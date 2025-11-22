import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { postQuery, postsQuery } from './posts.js';
import { memberTypeQuery, memberTypesQuery } from './memberTypes.js';
import { profileQuery, profilesQuery } from './profiles.js';
import { userQuery, usersQuery } from './users.js';

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
