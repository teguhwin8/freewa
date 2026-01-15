import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface DeviceState {
  status: string;
  qr: string | null;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  // Global state (backward compatibility)
  private lastStatus: string = 'disconnected';
  private lastQr: string | null = null;

  // Per-device state
  private deviceStates: Map<string, DeviceState> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client baru connect: ${client.id}`);

    // Send global state for backward compatibility
    client.emit('status', this.lastStatus);
    if (this.lastStatus === 'scan_qr' && this.lastQr) {
      client.emit('qr', this.lastQr);
    }

    // Send all device states
    this.deviceStates.forEach((state, deviceId) => {
      client.emit(`device:${deviceId}:status`, state.status);
      if (state.status === 'scan_qr' && state.qr) {
        client.emit(`device:${deviceId}:qr`, state.qr);
      }
    });

    // Send devices list
    client.emit('devices:list', this.getDevicesList());
  }

  // Backward compatible emit (global)
  emit(event: string, data: any) {
    if (event === 'status') {
      this.lastStatus = data as string;
      if (data === 'connected') {
        this.lastQr = null;
      }
    }

    if (event === 'qr') {
      this.lastQr = data as string;
      this.lastStatus = 'scan_qr';
    }

    this.server.emit(event, data);
  }

  // Device-specific emit
  emitDevice(deviceId: string, event: string, data: any) {
    let state = this.deviceStates.get(deviceId);
    if (!state) {
      state = { status: 'disconnected', qr: null };
      this.deviceStates.set(deviceId, state);
    }

    if (event === 'status') {
      state.status = data as string;
      if (data === 'connected') {
        state.qr = null;
      }
    }

    if (event === 'qr') {
      state.qr = data as string;
      if (data) {
        state.status = 'scan_qr';
      }
    }

    this.deviceStates.set(deviceId, state);

    // Emit device-specific event
    this.server.emit(`device:${deviceId}:${event}`, data);

    // Broadcast updated devices list
    this.server.emit('devices:list', this.getDevicesList());
  }

  private getDevicesList(): Array<{ id: string; status: string }> {
    return Array.from(this.deviceStates.entries()).map(([id, state]) => ({
      id,
      status: state.status,
    }));
  }

  removeDevice(deviceId: string) {
    this.deviceStates.delete(deviceId);
    this.server.emit('devices:list', this.getDevicesList());
  }
}
