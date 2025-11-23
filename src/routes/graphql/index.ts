import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import {
  parse,
  validate,
  graphql,
  GraphQLObjectType,
  GraphQLSchema,
  DocumentNode,
} from 'graphql';
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
import depthLimit from 'graphql-depth-limit';
import {
  createAuthorsLoader,
  createMemberTypesLoader,
  createPostsLoader,
  createProfileLoader,
  createSubscribersLoader,
} from './loaders.js';
import { GqlContext } from './types/interfaces.js';

const DEPTH_LIMIT = 5;

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

      let document: DocumentNode;
      try {
        document = parse(query);
      } catch (err) {
        let errorMessage = '';
        if (err instanceof Error) {
          errorMessage = err?.message;
        }
        return {
          errors: [
            {
              message: 'Query parsing error: ' + errorMessage,
            },
          ],
        };
      }
      const depthErrors = validate(schema, document, [depthLimit(DEPTH_LIMIT)]);

      if (depthErrors.length > 0) {
        return { errors: depthErrors };
      }

      const context: GqlContext = {
        prisma,
        memberTypeLoader: createMemberTypesLoader(prisma),
        postsLoader: createPostsLoader(prisma),
        profileLoader: createProfileLoader(prisma),
        subscribersLoader: createSubscribersLoader(prisma),
        authorsLoader: createAuthorsLoader(prisma),
      };

      return graphql({
        schema,
        source: String(query),
        variableValues: variables,
        contextValue: context,
      });
    },
  });
};

export default plugin;
