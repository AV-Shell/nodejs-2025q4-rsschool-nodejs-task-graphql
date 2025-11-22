import { GraphQLObjectType, GraphQLList, GraphQLString, GraphQLFloat } from 'graphql';

import { GqlContext } from './types/interfaces.js';
import { UUIDType } from './types/uuid.js';
import { profileType } from './profiles.js';
import { postType } from './posts.js';

const userType: GraphQLObjectType = new GraphQLObjectType({
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

const usersQuery = {
  type: new GraphQLList(userType),
  resolve: async (parent: unknown, args: unknown, context: GqlContext) => {
    return context.prisma.user.findMany();
  },
};

const userQuery = {
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

export { userType, usersQuery, userQuery };
