import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';

const server = express();
let cachedApp: NestExpressApplication;

export async function bootstrap(expressInstance: express.Express): Promise<NestExpressApplication> {
  if (cachedApp) {
    return cachedApp;
  }
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressInstance),
    { rawBody: true }
  );

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://venusta.localhost:3000,http://barbearia-vip.localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const baseDomain = process.env.BASE_DOMAIN || 'appvenusta.com.br';
      const escapedBaseDomain = baseDomain.replace(/\./g, '\\.');
      const prodRegex = new RegExp(`^https?:\\/\\/([a-zA-Z0-9-]+\\.)?${escapedBaseDomain}(:\\d+)?$`);
      const devRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)?localhost(:\d+)?$/;
      const devIpRegex = /^https?:\/\/([a-zA-Z0-9-]+\.)?127\.0\.0\.1(:\d+)?$/;

      const isAllowed =
        allowedOrigins.includes(origin) ||
        prodRegex.test(origin) ||
        devRegex.test(origin) ||
        devIpRegex.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();
  cachedApp = app;
  return app;
}

export default async (req: any, res: any) => {
  await bootstrap(server);
  server(req, res);
};
