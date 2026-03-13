import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n';

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  /**
   * Intercepts successful responses to translate keys and normalize format.
   * Gold Standard implementation: Domain returns keys, Infrastructure translates.
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const i18n = I18nContext.current(context);

    return next.handle().pipe(
      map((data) => {
        // Guard for non-object data or missing i18n context
        if (!data || !i18n || typeof data !== 'object') return data;

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        let messages: Record<string, string> = {};
        let reason: string | undefined = undefined;

        // Process 'message' property
        if (typeof data.message === 'string') {
          const processed = this.processKey(data.message, i18n);
          reason = processed.reason;
          messages = processed.messages;
        }
        // Process 'messages' property (array or record)
        else if (data.messages) {
          if (Array.isArray(data.messages)) {
            for (const m of data.messages) {
              const { messages: fm } = this.processKey(m, i18n);
              Object.assign(messages, fm);
            }
          } else if (this.isObject(data.messages)) {
            for (const key of Object.keys(data.messages)) {
              messages[key] = i18n.t(data.messages[key]);
            }
          }
        }

        // Cleanup original data to avoid duplication
        const rest = { ...data };
        delete rest.message;
        delete rest.messages;

        const hasMessages = Object.keys(messages).length > 0;

        return {
          ...rest,
          ...(hasMessages && { messages }),
          statusCode,
          ...(reason && { reason }),
        };
      }),
    );
  }

  /**
   * Parses the key for reason prefixes and translates the final key.
   */
  private processKey(rawKey: string, i18n: I18nContext) {
    let reason: string | undefined = undefined;
    let finalKey = rawKey;

    const delimiterIndex = rawKey.indexOf(':');
    if (delimiterIndex !== -1) {
      reason = rawKey.substring(0, delimiterIndex).trim();
      finalKey = rawKey.substring(delimiterIndex + 1).trim();
    }

    const translated = i18n.t(finalKey);
    return {
      reason,
      messages: this.formatMessage(translated),
    };
  }

  /**
   * Formats translated string into field/root record.
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

  /**
   * Utility to check if value is a plain object.
   */
  private isObject(val: any): boolean {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
  }
}
