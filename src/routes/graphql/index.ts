import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { postQuery, postsQuery, postCreate, postDelete, postChange } from './posts.js';
import { memberTypeQuery, memberTypesQuery } from './memberTypes.js';
import {
  profileChange,
  profileCreate,
  profileDelete,
  profileQuery,
  profilesQuery,
} from './profiles.js';
import {
  userQuery,
  usersQuery,
  userCreate,
  userDelete,
  userChange,
  subscribeTo,
  unsubscribeFrom,
} from './users.js';

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: () => ({
      users: usersQuery,
      user: userQuery,
      profiles: profilesQuery,
      profile: profileQuery,
      posts: postsQuery,
      post: postQuery,
      memberTypes: memberTypesQuery,
      memberType: memberTypeQuery,
    }),
  }),
  mutation: new GraphQLObjectType({
    name: 'mutation',
    fields: () => ({
      createUser: userCreate,
      createProfile: profileCreate,
      createPost: postCreate,
      deleteUser: userDelete,
      deletePost: postDelete,
      deleteProfile: profileDelete,
      changePost: postChange,
      changeProfile: profileChange,
      changeUser: userChange,
      subscribeTo: subscribeTo,
      unsubscribeFrom: unsubscribeFrom,
    }),
  }),
});

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const { query, variables } = req.body;

      return graphql({
        schema,
        source: String(query),
        variableValues: variables,
        contextValue: fastify,
      });
    },
  });
};

export default plugin;
