import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import * as path from 'path';

//  Guards
import { APP_GUARD } from '@nestjs/core';
import { RateLimitGuard } from '@/src/adapters/inbound/rest/guards/rate-limit.guard';

//  Exceptions
import { APP_FILTER } from '@nestjs/core';
import { I18nValidationFilter } from '@/src/adapters/inbound/rest/filters/i18n-validation.filter';
import { I18nExceptionFilter } from '@/src/adapters/inbound/rest/filters/i18n-exception.filter';

//  Interceptors
import { APP_INTERCEPTOR } from '@nestjs/core';
import { I18nResponseInterceptor } from '@/src/adapters/inbound/rest/interceptors/i18n.interceptor';

//  I18n
import {
  QueryResolver,
  HeaderResolver,
  CookieResolver,
  AcceptLanguageResolver,
  I18nModule,
  I18nJsonLoader,
  I18nLanguageInterceptor,
} from 'nestjs-i18n';

//  Database
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'src/platform/config/settings/typeorm.config';

//  Config
import { ConfigModule } from '@nestjs/config';

//  BullMQ
import { BullModule } from '@nestjs/bullmq';
import { createBullMQRedisConfig } from 'src/platform/config/settings/bullmq.config';

//  CronJobs
import { ScheduleModule } from '@nestjs/schedule';

//  Modules
import { StaticModule } from './static.module';
import { AccountModule } from './account.module';
import { QuotaModule } from './quota.module';
import { ImageModule } from './image.module';
import { VideoModule } from './video.module';

// Seeds
import { SeedersModule } from './seeder.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),

    I18nModule.forRoot({
      fallbackLanguage: 'es',
      loader: I18nJsonLoader,
      loaderOptions: {
        path: path.join(process.cwd(), 'i18n'),
        watch: true,
      },
      logging: true,
      resolvers: [
        new QueryResolver(['lang']),
        new HeaderResolver(['lang', 'Accept-Language']),
        new CookieResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
    }),

    TypeOrmModule.forRoot(dataSourceOptions),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),

    BullModule.forRootAsync({
      useFactory: () => ({
        connection: createBullMQRedisConfig(),
      }),
    }),

    AccountModule,
    QuotaModule,
    StaticModule,
    ImageModule,
    VideoModule,

    SeedersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nLanguageInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: I18nResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: I18nExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: I18nValidationFilter,
    },
  ],
})
export class AppModule {}
