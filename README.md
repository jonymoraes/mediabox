# MediaBox

![Version](https://img.shields.io/github/package-json/v/jonymoraes/mediabox)
![License](https://img.shields.io/github/license/jonymoraes/mediabox)
[![Build](https://github.com/jonymoraes/mediabox/actions/workflows/tests.yml/badge.svg)](https://github.com/jonymoraes/mediabox/actions/workflows/tests.yml)

**Unified Media Storage Engine: A flexible intermediary and S3-compatible bridge.** Seamlessly manage uploads, transcoding, and quotas across **Local Storage, VPS, StorageBox, or Cloud Providers.**

This API acts as a high-performance abstraction layer, allowing you to replace S3 with local infrastructure or bridge between multiple storage backends while providing real-time feedback.

---

## Features

- **Storage Abstraction & Bridging**
  - Works as a standalone S3 replacement for local/VPS setups.
  - Can act as a bridge/proxy to other Cloud Providers or StorageBox.
  - Transparent handling: your frontend/main backend doesn't need to know where the file is physically stored.

- **Smart Media Processing**
  - **Images:** Automatic conversion to **WebP** for optimized delivery and responsive use cases.
  - **Video:** Default transcoding to **WebM**; extensible to any format or scale.
  - Powered by **BullMQ + Redis** for scalable, asynchronous task handling.

- **Real-Time Feedback (WebSockets)**
  - Native **Socket.io** integration.
  - Real-time progress reporting for uploads, transcoding, and background jobs (percentage, status, and messages).

- **Multi-Tenant Architecture**
  - Isolated accounts managed by **name** and **domain**.
  - Dedicated storage namespaces for each account.
  - Granular **Quota Management**: tracks storage usage and transfer limits to prevent over-usage.

- **Enterprise-Ready Stack**
  - **Hexagonal Architecture**: Decoupled business logic for long-term maintainability.
  - **High Performance**: Built with Fastify and compiled with SWC.
  - **Security**: Built-in Rate Limiting and API Key authentication.
  - **I18n**: Multi-language support via `nestjs-i18n`.

---

## Tech Stack

| Component       | Technology           |
| :-------------- | :------------------- |
| **Runtime**     | Node.js (Fastify)    |
| **Database**    | PostgreSQL + TypeORM |
| **Queue/Cache** | Redis + BullMQ       |
| **Logging**     | Pino                 |
| **Build Tool**  | SWC                  |

---

## Requirements

Ensure you have the following services running:

- **Node.js** ≥ 20
- **Redis** ≥ 7 (for queues and state management)
- **PostgreSQL** ≥ 15 (for persistent data)

---

## Installation

```bash
git clone [https://github.com/jonymoraes/mediabox.git](https://github.com/jonymoraes/mediabox.git)
cd mediabox
pnpm install
```

## Configuration

```bash
cp .env.example .env
```

### Build and Run

1. **Run Migrations:**

```bash
pnpm run migration:run
```

2. **Start Development Server:**

```bash
pnpm run start:dev
```

3. **Production Build:**

```bash
pnpm run build
pnpm run start:prod
```

### Testing

The project includes a comprehensive suite of tests to ensure stability and correct behavior of the storage and processing logic.

```bash
# Run all tests with coverage
pnpm run test:all

# Run tests in watch mode
pnpm run test:watch

# Test coverage
pnpm run test:cov
```
