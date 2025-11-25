import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLResolveInfo,
} from 'graphql';
import { parseResolveInfo, ResolveTree } from 'graphql-parse-resolve-info';

import { changeUserDto, createUserDto, GqlContext } from './types/interfaces.js';
import { UUIDType } from './types/uuid.js';
import { profileType } from './profiles.js';
import { postType } from './posts.js';
import { Prisma, User } from '@prisma/client';

export const userType: GraphQLObjectType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },

    posts: {
      type: new GraphQLList(postType),
      resolve: (parent: { id: string }, args, context: GqlContext) =>
        context.postsLoader.load(parent.id),
    },
    profile: {
      type: profileType,
      resolve: (parent: { id: string }, args, context: GqlContext) =>
        context.profileLoader.load(parent.id),
    },
    userSubscribedTo: {
      type: new GraphQLList(userType),
      resolve: async (parent: { id: string }, args, context: GqlContext) =>
        context.authorsLoader.load(parent.id),
    },
    subscribedToUser: {
      type: new GraphQLList(userType),
      resolve: async (parent: { id: string }, args, context: GqlContext) =>
        context.subscribersLoader.load(parent.id),
    },
  }),
});

export const usersQuery = {
  type: new GraphQLList(userType),

  resolve: async (
    _parent: unknown,
    _args: unknown,
    context: GqlContext,
    info: GraphQLResolveInfo,
  ): Promise<User[]> => {
    const parsed = parseResolveInfo(info) as ResolveTree | null;
    if (!parsed) {
      return context.prisma.user.findMany();
    }

    const userFields = parsed.fieldsByTypeName?.user;

    const include: Prisma.UserInclude = {};

    if (userFields.userSubscribedTo) {
      include.userSubscribedTo = true;
    }

    if (userFields.subscribedToUser) {
      include.subscribedToUser = true;
    }

    if (!Object.keys(include).length) {
      return context.prisma.user.findMany();
    }

    const myUsers = await context.prisma.user.findMany({ include });
    const usersById = new Map(myUsers.map((u) => [u.id, u]));

    myUsers.forEach((user) => {
      if (Array.isArray(user.userSubscribedTo)) {
        context.authorsLoader.prime(
          user.id,
          user.userSubscribedTo.map((data) => usersById.get(data.authorId)!),
        );
      }
      if (Array.isArray(user.subscribedToUser)) {
        context.subscribersLoader.prime(
          user.id,
          user.subscribedToUser.map((data) => usersById.get(data.subscriberId)!),
        );
      }
    });

    return myUsers;
  },
};

export const userQuery = {
  type: userType,
  args: { id: { type: UUIDType } },

  resolve: async (_parent: unknown, args: { id: string }, context: GqlContext) => {
    const user = await context.prisma.user.findUnique({
      where: { id: args.id },
    });

    if (!user) {
      return null;
    }

    return user;
  },
};

const createUserTypeDto = new GraphQLInputObjectType({
  name: 'CreateUserInput',
  fields: () => ({
    name: { type: new GraphQLNonNull(GraphQLString) },
    balance: { type: new GraphQLNonNull(GraphQLFloat) },
  }),
});

const changeUserTypeDto = new GraphQLInputObjectType({
  name: 'ChangeUserInput',
  fields: () => ({
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },
  }),
});

export const userCreate = {
  type: userType,
  args: {
    dto: {
      type: createUserTypeDto,
    },
  },
  resolve: async (parent: unknown, args: { dto: createUserDto }, context: GqlContext) => {
    return context.prisma.user.create({
      data: {
        name: args.dto.name,
        balance: args.dto.balance,
      },
    });
  },
};

export const userDelete = {
  type: GraphQLString,
  args: {
    id: {
      type: new GraphQLNonNull(UUIDType),
    },
  },
  resolve: async (parent: unknown, args: { id: string }, context: GqlContext) => {
    await context.prisma.user.delete({
      where: { id: args.id },
    });
    return null;
  },
};

export const userChange = {
  type: userType,
  args: {
    id: { type: UUIDType },
    dto: {
      type: changeUserTypeDto,
    },
  },
  resolve: async (
    parent: unknown,
    args: { id: string; dto: changeUserDto },
    context: GqlContext,
  ) => {
    const data: changeUserDto = {};
    if (args.dto.balance != undefined) data.balance = args.dto.balance;
    if (args.dto.name != undefined) data.name = args.dto.name;
    return context.prisma.user.update({
      where: { id: args.id },
      data: {
        name: args.dto.name,
        balance: args.dto.balance,
      },
    });
  },
};

export const subscribeTo = {
  type: new GraphQLNonNull(GraphQLString),
  args: {
    userId: { type: UUIDType },
    authorId: { type: UUIDType },
  },
  resolve: async (
    parent: unknown,
    args: { userId: string; authorId: string },
    context: GqlContext,
  ) => {
    try {
      await context.prisma.subscribersOnAuthors.create({
        data: {
          subscriberId: args.userId,
          authorId: args.authorId,
        },
      });
      return 'OK';
    } catch (e) {
      return 'ERROR';
    }
  },
};

export const unsubscribeFrom = {
  type: new GraphQLNonNull(GraphQLString),
  args: {
    userId: { type: UUIDType },
    authorId: { type: UUIDType },
  },
  resolve: async (
    parent: unknown,
    args: { userId: string; authorId: string },
    context: GqlContext,
  ) => {
    try {
      await context.prisma.subscribersOnAuthors.delete({
        where: {
          subscriberId_authorId: {
            subscriberId: args.userId,
            authorId: args.authorId,
          },
        },
      });

      return 'OK';
    } catch (e) {
      return 'ERROR';
    }
  },
};
