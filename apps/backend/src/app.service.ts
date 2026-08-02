import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { PrismaService } from './infrastructure/database/prisma/prisma.service';

export interface HealthStatus {
  status: 'ok' | 'error';
  postgres: 'up' | 'down';
  mongo: 'up' | 'down';
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectConnection() private readonly mongoConnection: Connection,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth(): Promise<HealthStatus> {
    const postgres = await this.pingPostgres();
    const mongo =
      this.mongoConnection.readyState === ConnectionStates.connected
        ? 'up'
        : 'down';

    return {
      status: postgres === 'up' && mongo === 'up' ? 'ok' : 'error',
      postgres,
      mongo,
    };
  }

  private async pingPostgres(): Promise<'up' | 'down'> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return 'up';
    } catch {
      return 'down';
    }
  }
}
