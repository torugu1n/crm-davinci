import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const defaultSecret = 'davinci_gold_secret_key_2026_exclusive';

if (isProduction && (!jwtSecret || jwtSecret === defaultSecret)) {
  throw new Error('FATAL: A secure JWT_SECRET environment variable must be set in production!');
}

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: jwtSecret || defaultSecret,
    }),
  ],
  providers: [WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
