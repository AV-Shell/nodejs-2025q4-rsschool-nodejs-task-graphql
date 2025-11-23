import { PrismaClient } from '@prisma/client';

export interface GqlContext {
  prisma: PrismaClient;
}

export interface createUserDto {
  name: string;
  balance: number;
}

export interface changeUserDto {
  name?: string;
  balance?: number;
}

export interface createPostDto {
  title: string;
  content: string;
  authorId: string;
}
export interface changePostDto {
  title?: string;
  content?: string;
}

export interface createProfileDto {
  isMale: boolean;
  yearOfBirth: number;
  userId: string;
  memberTypeId: string;
}
export interface changeProfileDto {
  isMale?: boolean;
  yearOfBirth?: number;
  memberTypeId?: string;
}
