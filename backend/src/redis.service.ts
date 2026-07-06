import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    try {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        enableOfflineQueue: false,
      });

      this.client.on('connect', () => {
        this.logger.log('Redis conectado com sucesso');
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis indisponível: ${err.message} — usando fallback em memória`);
      });
    } catch (err: any) {
      this.logger.warn(`Redis não inicializado: ${err.message} — usando fallback em memória`);
      this.client = null;
    }
  }

  /**
   * Armazena um valor com TTL em segundos.
   * Retorna true em sucesso, false se Redis indisponível.
   */
  async set(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) return false;
    try {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Recupera um valor pelo key.
   * Retorna null se não encontrado ou Redis indisponível.
   */
  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    try {
      return await this.client.get(key);
    } catch {
      return null;
    }
  }

  /**
   * Remove uma chave do Redis.
   */
  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      // silently ignore
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
