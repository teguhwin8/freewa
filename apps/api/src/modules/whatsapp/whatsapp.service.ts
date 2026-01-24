import { Injectable, Inject, forwardRef, OnModuleInit } from '@nestjs/common';
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
import { ChatService } from '../chat/chat.service';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sockets: Map<string, WASocket> = new Map();
  private qrCodes: Map<string, string | null> = new Map();

  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => DeviceService))
    private readonly deviceService: DeviceService,
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
  ) { }

  async onModuleInit() {
    console.log('🔄 Initializing WhatsApp service...');
    await this.autoConnectDevices();
  }

  private async autoConnectDevices(): Promise<void> {
    try {
      const sessionsPath = path.join(process.cwd(), 'wa_sessions');

      // Check if wa_sessions folder exists
      if (!fs.existsSync(sessionsPath)) {
        console.log('📁 No sessions folder found, skipping auto-connect');
        return;
      }

      // Get all device folders
      const deviceFolders = fs.readdirSync(sessionsPath).filter((file) => {
        const fullPath = path.join(sessionsPath, file);
        return fs.statSync(fullPath).isDirectory();
      });

      if (deviceFolders.length === 0) {
        console.log('📭 No existing sessions found');
        return;
      }

      console.log(`🔌 Found ${deviceFolders.length} device session(s), auto-connecting...`);

      // Auto-connect each device
      for (const deviceId of deviceFolders) {
        // Check if device exists in database
        const device = await this.deviceService.findOne(deviceId);
        if (!device) {
          console.log(`⚠️  Device ${deviceId} has session but not in database, skipping`);
          continue;
        }

        // Check if session has creds.json (means authenticated)
        const credsPath = path.join(sessionsPath, deviceId, 'creds.json');
        if (!fs.existsSync(credsPath)) {
          console.log(`⚠️  Device ${deviceId} has no credentials, skipping`);
          continue;
        }

        console.log(`🔌 Auto-connecting device: ${deviceId}`);

        // Use setTimeout to prevent blocking and allow proper initialization
        setTimeout(() => {
          this.connectDevice(deviceId).catch((err) => {
            console.error(`❌ Failed to auto-connect ${deviceId}:`, err.message);
          });
        }, 1000 * deviceFolders.indexOf(deviceId)); // Stagger connections
      }
    } catch (error) {
      console.error('❌ Error in auto-connect:', error);
    }
  }

  private getSessionPath(deviceId: string): string {
    // Use absolute path from project root
    const sessionPath = path.join(process.cwd(), 'wa_sessions', deviceId);

    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    console.log(`📁 Session path for ${deviceId}: ${sessionPath}`);
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
          // Get device to show phone number in logs
          const device = this.deviceService.findOne(deviceId);
          const displayId = device.phoneNumber || deviceId;

          // Extract message text
          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            '';

          if (!msg.key.fromMe) {
            console.log(`📩 [${displayId}] Incoming message:`, text);

            // Store message in database
            const chatId = msg.key.remoteJid?.split('@')[0];
            if (chatId && msg.key.remoteJid && this.chatService) {
              try {
                const savedMessage = await this.chatService.addMessage({
                  deviceId,
                  chatId,
                  from: msg.key.remoteJid,
                  to: `${displayId}@s.whatsapp.net`,
                  body: text,
                  timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) : Date.now(),
                  fromMe: false,
                  status: 'received',
                });

                // Emit to WebSocket for real-time UI update
                this.eventsGateway.emitDevice(deviceId, 'message:new', savedMessage);

                // Also emit chat update
                const chat = await this.chatService.getChats(deviceId);
                const updatedChat = chat.find(c => c.chatId === chatId);
                if (updatedChat) {
                  this.eventsGateway.emitDevice(deviceId, 'chat:update', updatedChat);
                }
              } catch (error) {
                console.error(`❌ Failed to store message:`, error);
              }
            }

            // Get device-specific webhook URL or fallback to global WEBHOOK_URL
            const webhookUrl = device.webhookUrl || process.env.WEBHOOK_URL;

            if (webhookUrl) {
              try {
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
                  `✅ [${displayId}] Webhook forwarded to ${webhookUrl}`,
                );
              } catch (error) {
                if (error instanceof Error) {
                  console.error(
                    `❌ [${deviceId}] Failed to hit webhook:`,
                    error.message,
                  );
                } else {
                  console.error(`❌ [${displayId}] Failed to hit webhook:`, error);
                }
              }
            }
          }
        }
      })();
    });

    // CRITICAL: Save credentials whenever they update
    socket.ev.on('creds.update', async () => {
      console.log(`💾 Saving credentials for device ${deviceId}`);
      await saveCreds();
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
          // Extract phone number from socket.user.id (format: 628xxx@s.whatsapp.net)
          let phoneNumber: string | undefined;
          if (socket.user?.id) {
            phoneNumber = socket.user.id.split('@')[0];
          }

          console.log(`\n✅ [${phoneNumber || deviceId}] SUCCESSFULLY CONNECTED TO WHATSAPP! 🚀\n`);

          this.qrCodes.set(deviceId, null);
          this.deviceService.updateStatus(deviceId, 'connected', phoneNumber);
          this.eventsGateway.emitDevice(deviceId, 'status', 'connected');
          this.eventsGateway.emitDevice(deviceId, 'qr', null);

          // Emit phone number so frontend can display it
          if (phoneNumber) {
            this.eventsGateway.emitDevice(deviceId, 'phoneNumber', phoneNumber);
          }
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
