import { LoggerService } from '@nestjs/common';
import { FastifyBaseLogger } from 'fastify';

/**
 * @description Pino adapter for NestLogger with source formatting
 */
export class PinoConfig implements LoggerService {
  constructor(private logger: FastifyBaseLogger) {}

  private formatMessage(context: string | undefined, msg: any): string {
    return context ? `[${context}] ${msg}` : msg;
  }

  log(msg: any, context?: string) {
    this.logger.info(this.formatMessage(context, msg));
  }

  error(msg: any, trace?: string, context?: string) {
    this.logger.error({ trace }, this.formatMessage(context, msg));
  }

  warn(msg: any, context?: string) {
    this.logger.warn(this.formatMessage(context, msg));
  }

  debug(msg: any, context?: string) {
    this.logger.debug(this.formatMessage(context, msg));
  }

  verbose(msg: any, context?: string) {
    this.logger.trace(this.formatMessage(context, msg));
  }
}
