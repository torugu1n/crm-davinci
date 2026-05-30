import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente manualmente do .env raiz
try {
  const rootEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(rootEnvPath)) {
    const envConfig = fs.readFileSync(rootEnvPath, 'utf-8');
    envConfig.split(/\r?\n/).forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn('Erro ao ler .env raiz:', e);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads', 'logos');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static assets from uploads directory
  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000,http://davinci.localhost:3000,http://barbearia-vip.localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);

      const baseDomain = process.env.BASE_DOMAIN || 'vtecsolutions.online';
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
        callback(null, false); // Block other domains gracefully
      }
    },
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT || 5001;
  await app.listen(port);
  console.log(`Da Vinci CRM Backend is running on: http://localhost:${port}`);
}
bootstrap();
