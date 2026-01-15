# FreeWA

**Open Source WhatsApp Gateway** built with NestJS, Next.js, and Baileys.
Designed for stability with Queue System (Redis/BullMQ) and Realtime QR (WebSocket).

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-22-green)

## Features

- **Multi-Device Support** - Connect and manage multiple WhatsApp devices
- **Queue Dashboard** - Monitor message queue status in real-time
- **Monorepo Architecture** (NestJS + Next.js)
- **Queue System** (Anti-Banned & High Concurrency)
- **Realtime QR Code** (WebSocket Integration)
- **Docker Ready** (Just one command to run)
- **REST API** for sending messages
- **shadcn/ui** - Modern UI components with Lucide icons

## Tech Stack

- **Backend:** NestJS, Socket.io, BullMQ
- **Frontend:** Next.js 16 (App Router), TailwindCSS v4, shadcn/ui
- **Infra:** Docker, Redis, PostgreSQL
- **Core:** @whiskeysockets/baileys

## Quick Start (Docker)

1. **Clone Repo**

   ```bash
   git clone https://github.com/teguhwin8/FreeWA.git
   cd FreeWA
   ```

2. **Configure Environment**

   ```bash
   # Backend
   cp apps/api/env.example apps/api/.env
   
   # Frontend
   cp apps/web/env.local.example apps/web/.env.local
   ```

3. **Run Everything**

   ```bash
   docker-compose up -d
   ```

4. **Access**

   - **Dashboard:** http://localhost:3001
   - **API Endpoint:** http://localhost:3000
   - **API Docs (Swagger):** http://localhost:3000/api

## API Usage

### Send Text Message

```bash
curl -X POST http://localhost:3000/message/send \
   -H "Content-Type: application/json" \
   -H "x-api-key: your_api_key" \
   -d '{
     "to": "6281234567890",
     "type": "text",
     "message": "Hello from FreeWA!"
   }'
```

### Send Image Message

```bash
curl -X POST http://localhost:3000/message/send \
   -H "Content-Type: application/json" \
   -H "x-api-key: your_api_key" \
   -d '{
     "to": "6281234567890",
     "type": "image",
     "url": "https://example.com/image.jpg",
     "caption": "Check this out!"
   }'
```

### Send to Specific Device

```bash
curl -X POST http://localhost:3000/message/send \
   -H "Content-Type: application/json" \
   -H "x-api-key: your_api_key" \
   -d '{
     "deviceId": "abc123-def456",
     "to": "6281234567890",
     "type": "text",
     "message": "Hello from specific device!"
   }'
```

## Device Management API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/device` | GET | List all devices |
| `/device` | POST | Create new device |
| `/device/:id` | GET | Get device by ID |
| `/device/:id/connect` | POST | Connect device (get QR) |
| `/device/:id/disconnect` | POST | Disconnect device |
| `/device/:id` | DELETE | Delete device |

## Queue Monitoring API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/queue/stats` | GET | Get job counts (waiting, active, completed, failed, delayed) |
| `/queue/jobs` | GET | List jobs with status filter |
| `/queue/jobs/:id/retry` | POST | Retry a failed job |
| `/queue/jobs/:id` | DELETE | Remove a job |

## Development Mode

For development with hot-reload:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

## Contributing

Pull requests are welcome!

---

Created with love by [Teguh Coding](https://github.com/teguhwin8)
