import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';

import { changeUserDto, createUserDto, GqlContext } from './types/interfaces.js';
import { UUIDType } from './types/uuid.js';
import { profileType } from './profiles.js';
import { postType } from './posts.js';

export const userType: GraphQLObjectType = new GraphQLObjectType({
  name: 'user',
  fields: () => ({
    id: { type: UUIDType },
    name: { type: GraphQLString },
    balance: { type: GraphQLFloat },

    posts: {
      type: new GraphQLList(postType),
      resolve: (parent, args, context) =>
        context.prisma.post.findMany({ where: { authorId: parent.id } }),
    },
    profile: {
      type: profileType,
      resolve: async (
        parent: { id: string },
        args: { id: string },
        context: GqlContext,
      ) => {
        const profile = await context.prisma.profile.findUnique({
          where: { userId: parent.id },
        });

        if (!profile) {
          return null;
        }

        return profile;
      },
    },
    userSubscribedTo: {
      type: new GraphQLList(userType),
      resolve: async (parent: { id: string }, args, context) => {
        const authors = await context.prisma.subscribersOnAuthors.findMany({
          where: { subscriberId: parent.id },
          include: { author: true },
        });
        return authors.map((author) => author.author);
      },
    },
    subscribedToUser: {
      type: new GraphQLList(userType),
      resolve: async (parent: { id: string }, args, context) => {
        const subscribers = await context.prisma.subscribersOnAuthors.findMany({
          where: { authorId: parent.id },
          include: { subscriber: true },
        });
        return subscribers.map((subscriber) => subscriber.subscriber);
      },
    },
  }),
});

export const usersQuery = {
  type: new GraphQLList(userType),
  resolve: async (parent: unknown, args: unknown, context: GqlContext) => {
    return context.prisma.user.findMany();
  },
};

export const userQuery = {
  type: userType,
  args: { id: { type: UUIDType } },

  resolve: async (_parent: unknown, args: { id: string }, context: GqlContext) => {
    console.log(`Get user by id: `, args.id);
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
