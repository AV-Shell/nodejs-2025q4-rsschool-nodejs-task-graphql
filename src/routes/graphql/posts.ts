import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLInputObjectType,
  GraphQLNonNull,
} from 'graphql';
import { UUIDType } from './types/uuid.js';
import { changePostDto, createPostDto, GqlContext } from './types/interfaces.js';

export const postType = new GraphQLObjectType({
  name: 'post',
  fields: () => ({
    id: { type: UUIDType },
    title: { type: GraphQLString },
    content: { type: GraphQLString },
    authorId: { type: UUIDType },
  }),
});

export const postsQuery = {
  type: new GraphQLList(postType),
  resolve: async (_parent: unknown, _args: unknown, context: GqlContext) => {
    return context.prisma.post.findMany();
  },
};

export const postQuery = {
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


const createPostTypeDto = new GraphQLInputObjectType({
  name: 'CreatePostInput',
  fields: () => ({
    title: { type: new GraphQLNonNull(GraphQLString) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(UUIDType) },
  }),
});

const changePostTypeDto = new GraphQLInputObjectType({
  name: 'ChangePostInput',
  fields: () => ({
    title: { type: GraphQLString },
    content: { type: GraphQLString },
  }),
});

export const postCreate = {
  type: postType,
  args: {
    dto: {
      type: createPostTypeDto,
    },
  },
  resolve: async (parent: unknown, args: { dto: createPostDto }, context: GqlContext) => {
    return context.prisma.post.create({
      data: {
        content: args.dto.content,
        title: args.dto.title,
        authorId: args.dto.authorId,
      },
    });
  },
};

export const postDelete = {
  type: GraphQLString,
  args: {
    id: {
      type: new GraphQLNonNull(UUIDType),
    },
  },
  resolve: async (parent: unknown, args: { id: string }, context: GqlContext) => {
    await context.prisma.post.delete({
      where: { id: args.id },
    });
    return null;
  },
};

export const postChange = {
  type: postType,
  args: {
    id: {
      type: UUIDType,
    },
    dto: {
      type: changePostTypeDto,
    },
  },
  resolve: async (
    parent: unknown,
    args: { id: string; dto: changePostDto },
    context: GqlContext,
  ) => {
    const data: changePostDto = {};
    if (args.dto.title != undefined) data.title = args.dto.title;
    if (args.dto.content != undefined) data.content = args.dto.content;

    return context.prisma.post.update({
      where: { id: args.id },
      data,
    });
  },
};
