import { PrismaClient } from '@prisma/client';

export interface GqlContext {
  prisma: PrismaClient;
}
