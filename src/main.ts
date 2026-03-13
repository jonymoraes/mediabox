import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { join } from 'path';

// Core & Config
import { AppModule } from './platform/config/module/app.module';

// i18n
import { I18nValidationPipe } from 'nestjs-i18n';

// Pino Configuration
import { PinoConfig } from './platform/config/settings/pino.config';

// Fastify Ecosystem
import fastifyCors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyCookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';

/**
 * Main entry point to bootstrap the application.
 * Uses Fastify for high-performance and Pino for structured logging.
 */
async function bootstrap() {
  // Create the Fastify Adapter with Pino configured from the start
  const adapter = new FastifyAdapter({
    logger:
      'development' === process.env.NODE_ENV
        ? {
            level: 'debug',
            transport: {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss',
                ignore: 'pid,hostname',
              },
            },
          }
        : {
            level: 'debug',
          },
  });

  // Create the application instance
  // bufferLogs ensures that logs during initialization are kept until the custom logger is ready
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    adapter,
    { bufferLogs: true },
  );

  // Configure and attach the Pino adapter to NestJS
  const fastify = app.getHttpAdapter().getInstance() as any;
  const configService = app.get(ConfigService);
  app.useLogger(new PinoConfig(fastify.log));

  // Security & Middleware
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  await fastify.register(fastifyCors as any, {
    origin: '*',
    credentials: false,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  });

  await fastify.register(fastifyCookie, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });

  // File Handling & Static Assets
  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024,
    },
    attachFieldsToBody: true,
  });

  await fastify.register(fastifyStatic, {
    root: join(process.cwd(), 'public'),
    serve: false,
  });

  // Global Pipes & Prefixes
  app.useGlobalPipes(
    new I18nValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      validationError: { target: false },
    }),
  );

  app.setGlobalPrefix('api');

  // Listen
  const port = configService.get<number>('PORT') || 4200;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`App is ready and listening on port ${port} 🚀`);
}

/**
 * Uncaught exception handler for the bootstrap process.
 */
function handleError(error: unknown) {
  const logger = new Logger('Bootstrap');
  logger.error('Uncaught exception during bootstrap', error as any);
  process.exit(1);
}

bootstrap().catch(handleError);
