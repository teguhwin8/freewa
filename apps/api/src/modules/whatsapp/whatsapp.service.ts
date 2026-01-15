import { Injectable, Inject, forwardRef } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  ConnectionState,
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import * as path from 'path';
import * as fs from 'fs';
import { EventsGateway } from '../events/events.gateway';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { DeviceService } from '../device/device.service';

@Injectable()
export class WhatsappService {
  private sockets: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string | null> = new Map();

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
  ) { }

  private getSessionPath(deviceId: string): string {
    const sessionPath = path.resolve(
      __dirname,
      `../../../../wa_sessions/${deviceId}`,
    );
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }
    return sessionPath;
  }

  getQrCode(deviceId: string): string | null {
    return this.qrCodes.get(deviceId) || null;
  }

  async connectDevice(deviceId: string): Promise<void> {
    // If already connected, skip
    if (this.sockets.has(deviceId)) {
      console.log(`📱 Device ${deviceId} already has active socket`);
      return;
    }

    const authPath = this.getSessionPath(deviceId);
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const socket = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    this.sockets.set(deviceId, socket);
    this.deviceService.updateStatus(deviceId, 'connecting');

    // Handle incoming messages
    socket.ev.on('messages.upsert', (update) => {
      void (async () => {
        const { messages, type } = update;

        if (type !== 'notify') return;

        for (const msg of messages) {
          if (!msg.key.fromMe) {
            console.log(`📩 [${deviceId}] Incoming message:`, msg);

            // Get device-specific webhook URL or fallback to global WEBHOOK_URL
            const device = this.deviceService.findOne(deviceId);
            const webhookUrl = device.webhookUrl || process.env.WEBHOOK_URL;

            if (webhookUrl) {
              try {
                const text =
                  msg.message?.conversation ||
                  msg.message?.extendedTextMessage?.text ||
                  msg.message?.imageMessage?.caption ||
                  '';

                const payload = {
                  deviceId,
                  from: msg.key.remoteJid,
                  name: msg.pushName,
                  message: text,
                  timestamp: msg.messageTimestamp,
                  full_data: msg,
                };

                await firstValueFrom(
                  this.httpService.post(webhookUrl, payload),
                );
                console.log(
                  `✅ [${deviceId}] Webhook forwarded to ${webhookUrl}`,
                );
              } catch (error) {
                if (error instanceof Error) {
                  console.error(
                    `❌ [${deviceId}] Failed to hit webhook:`,
                    error.message,
                  );
                } else {
                  console.error(`❌ [${deviceId}] Failed to hit webhook:`, error);
                }
              }
            }
          }
        }
      })();
    });

    // Handle connection updates
    socket.ev.on(
      'connection.update',
      (update: Partial<ConnectionState>) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`\n[${deviceId}] Scan this QR Code with WhatsApp on your phone:`);
          qrcode.generate(qr, { small: true });

          this.qrCodes.set(deviceId, qr);
          this.deviceService.updateStatus(deviceId, 'scan_qr');
          this.eventsGateway.emitDevice(deviceId, 'qr', qr);
          this.eventsGateway.emitDevice(deviceId, 'status', 'scan_qr');
        }

        if (connection === 'close') {
          const shouldReconnect =
            (lastDisconnect?.error as { output?: { statusCode?: number } })
              ?.output?.statusCode !== DisconnectReason.loggedOut;

          console.log(
            `[${deviceId}] Connection closed due to:`,
            lastDisconnect?.error,
            ', Reconnecting:',
            shouldReconnect,
          );

          this.sockets.delete(deviceId);
          this.qrCodes.delete(deviceId);
          this.deviceService.updateStatus(deviceId, 'disconnected');
          this.eventsGateway.emitDevice(deviceId, 'status', 'disconnected');

          if (shouldReconnect) {
            void this.connectDevice(deviceId);
          }
        }

        if (connection === 'open') {
          console.log(`\n✅ [${deviceId}] SUCCESSFULLY CONNECTED TO WHATSAPP! 🚀\n`);

          this.qrCodes.set(deviceId, null);
          this.deviceService.updateStatus(deviceId, 'connected');
          this.eventsGateway.emitDevice(deviceId, 'status', 'connected');
          this.eventsGateway.emitDevice(deviceId, 'qr', null);
        }
      },
    );

    socket.ev.on('creds.update', () => {
      void saveCreds();
    });
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const socket = this.sockets.get(deviceId);
    if (socket) {
      socket.end(undefined);
      this.sockets.delete(deviceId);
      this.qrCodes.delete(deviceId);
      console.log(`📱 Device ${deviceId} disconnected`);
    }
  }

  deleteSession(deviceId: string): void {
    const sessionPath = path.resolve(
      __dirname,
      `../../../../wa_sessions/${deviceId}`,
    );
    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
      console.log(`🗑️ Session deleted for device ${deviceId}`);
    }
  }

  async sendText(
    deviceId: string | undefined,
    to: string,
    message: string,
  ): Promise<void> {
    const socket = this.getSocket(deviceId);
    const formattedTo = this.formatPhone(to);

    await socket.sendMessage(formattedTo, { text: message });
    console.log(`[${deviceId || 'default'}] Sent to ${to}: ${message}`);
  }

  async sendPhoto(
    deviceId: string | undefined,
    to: string,
    url: string,
    caption?: string,
  ): Promise<void> {
    const socket = this.getSocket(deviceId);
    const formattedTo = this.formatPhone(to);

    await socket.sendMessage(formattedTo, {
      image: { url: url },
      caption: caption || '',
    });

    console.log(`[${deviceId || 'default'}] Image sent to ${to}`);
  }

  private getSocket(deviceId?: string): WASocket {
    if (deviceId) {
      const socket = this.sockets.get(deviceId);
      if (!socket) {
        throw new Error(`Device ${deviceId} is not connected!`);
      }
      return socket;
    }

    // Fallback: use first connected device
    const firstDevice = this.deviceService.getFirstConnected();
    if (firstDevice) {
      const socket = this.sockets.get(firstDevice.id);
      if (socket) {
        return socket;
      }
    }

    throw new Error('No WhatsApp device is connected!');
  }

  private formatPhone(phone: string): string {
    let formatted = phone.replace(/[^0-9]/g, '');
    if (formatted.startsWith('0')) {
      formatted = '62' + formatted.slice(1);
    }
    if (!formatted.endsWith('@s.whatsapp.net')) {
      formatted += '@s.whatsapp.net';
    }
    return formatted;
  }

  isDeviceConnected(deviceId: string): boolean {
    return this.sockets.has(deviceId);
  }
}
