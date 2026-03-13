import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { I18nContext } from 'nestjs-i18n';
import { DomainException } from 'src/domain/shared/exceptions/domain.exceptions';

@Catch(HttpException, DomainException)
export class I18nExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException | DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const i18n = I18nContext.current(host);

    let status: number;
    let messages: Record<string, string> = {};
    let reason: string | undefined = undefined;

    // --- Case 1: DomainException ---
    if (exception instanceof DomainException) {
      status = exception.status;

      // We use string type here to allow transformations (reason:key)
      // while the original exception.key is strictly typed.
      const rawKey: string = exception.key;
      const delimiterIndex = rawKey.indexOf(':');
      let finalKey: string = rawKey;

      if (delimiterIndex !== -1) {
        reason = rawKey.substring(0, delimiterIndex).trim();
        finalKey = rawKey.substring(delimiterIndex + 1).trim();
      }

      const translated = i18n ? i18n.t(finalKey as any) : finalKey;
      messages = this.formatMessage(translated);
    }
    // --- Case 2: HttpException ---
    else {
      status = exception.getStatus();
      const excResp = exception.getResponse();

      if (this.isObject(excResp)) {
        // Extract reason if the service injected it in the object
        if ('reason' in (excResp as any)) {
          reason = String((excResp as any).reason);
        }

        const rawMessage = (excResp as any).message;

        if (Array.isArray(rawMessage)) {
          for (const m of rawMessage) {
            const translated = i18n ? i18n.t(m) : m;
            Object.assign(messages, this.formatMessage(translated));
          }
        } else {
          const keyToTranslate = rawMessage || (excResp as any).error;
          const translated = i18n ? i18n.t(keyToTranslate) : keyToTranslate;
          messages = this.formatMessage(translated);
        }
      } else {
        const translated = i18n
          ? i18n.t(excResp as string)
          : (excResp as string);
        messages = this.formatMessage(translated);
      }
    }

    return response.status(status).send({
      messages,
      statusCode: status,
      ...(reason && { reason }), // Only send reason if defined
    });
  }

  /**
   * Parse the message translated into field/root record.
   */
  private formatMessage(translated: any): Record<string, string> {
    if (this.isObject(translated)) {
      return translated as Record<string, string>;
    }

    const msg = String(translated);
    const delimiterIndex = msg.indexOf(':');

    if (delimiterIndex === -1) {
      return { root: msg.trim() };
    }

    const field = msg.substring(0, delimiterIndex).trim();
    const text = msg.substring(delimiterIndex + 1).trim();

    return { [field]: text };
  }

  private isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }
}
