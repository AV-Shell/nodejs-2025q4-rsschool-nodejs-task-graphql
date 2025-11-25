import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

export interface GqlContext {
  prisma: PrismaClient;
  memberTypeLoader: DataLoader<
    string,
    {
      id: string;
      discount: number;
      postsLimitPerMonth: number;
    } | null,
    string
  >;
  postsLoader: DataLoader<
    string,
    | {
        id: string;
        title: string;
        content: string;
        authorId: string;
      }[]
    | null,
    string
  >;
  profileLoader: DataLoader<
    string,
    {
      id: string;
      isMale: boolean;
      yearOfBirth: number;
      userId: string;
      memberTypeId: string;
    } | null,
    string
  >;
  subscribersLoader: DataLoader<
    string,
    {
      id: string;
      name: string;
      balance: number;
    }[],
    string
  >;
  authorsLoader: DataLoader<
    string,
    {
      id: string;
      name: string;
      balance: number;
    }[],
    string
  >;
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
