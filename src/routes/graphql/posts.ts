import { GraphQLObjectType, GraphQLList, GraphQLString } from 'graphql';
import { UUIDType } from './types/uuid.js';
import { GqlContext } from './types/interfaces.js';

const postType = new GraphQLObjectType({
  name: 'post',
  fields: () => ({
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: { type: UUIDType },
  }),
});

const postsQuery = {
  type: new GraphQLList(postType),
  resolve: async (_parent: unknown, _args: unknown, context: GqlContext) => {
    return context.prisma.post.findMany();
  },
};

const postQuery = {
  type: postType,
  args: { id: { type: UUIDType } },
  resolve: async (_parent: unknown, args: { id: string }, context: GqlContext) => {
    const post = await context.prisma.post.findUnique({
      where: { id: args.id },
    });

    if (!post) {
      return null;
    }

    return post;
  },
};

export { postType, postsQuery, postQuery };
