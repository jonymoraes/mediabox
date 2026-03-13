import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    cookies: {
      [key: string]: string | undefined;
    };
  }

  interface FastifyReply {
    setCookie(
      name: string,
      value: string,
      options?: {
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none';
        httpOnly?: boolean;
        maxAge?: number;
      },
    ): FastifyReply;

    clearCookie(
      name: string,
      options?: {
        path?: string;
        domain?: string;
        secure?: boolean;
        sameSite?: 'lax' | 'strict' | 'none';
        httpOnly?: boolean;
      },
    ): FastifyReply;
  }
}
