import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLInputObjectType,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql';
import { changeProfileDto, createProfileDto, GqlContext } from './types/interfaces.js';
import { UUIDType } from './types/uuid.js';
import { memberTypeType } from './memberTypes.js';
import { MemberTypeId } from './types/membertypeid.js';

export const profileType = new GraphQLObjectType({
  name: 'profile',
  fields: () => ({
    id: { type: UUIDType },
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    userId: { type: UUIDType },
    memberTypeId: { type: MemberTypeId },
    memberType: {
      type: memberTypeType,
      resolve: (parent: { memberTypeId: string }, args, context: GqlContext) => {
        return context.prisma.memberType.findUnique({
          where: { id: parent.memberTypeId },
        });
      },
    },
  }),
});

export const profilesQuery = {
  type: new GraphQLList(profileType),
  resolve: async (_parent: unknown, _args: unknown, context: GqlContext) => {
    return context.prisma.profile.findMany();
  },
};

export const profileQuery = {
  type: profileType,
  args: { id: { type: UUIDType } },
  resolve: async (_parent: unknown, args: { id: string }, context: GqlContext) => {
    const profile = await context.prisma.profile.findUnique({
      where: { id: args.id },
    });

    if (!profile) {
      return null;
    }

    return profile;
  },
};

const createProfileTypeDto = new GraphQLInputObjectType({
  name: 'CreateProfileInput',
  fields: () => ({
    isMale: { type: new GraphQLNonNull(GraphQLBoolean) },
    yearOfBirth: { type: new GraphQLNonNull(GraphQLInt) },
    userId: { type: new GraphQLNonNull(UUIDType) },
    memberTypeId: { type: new GraphQLNonNull(MemberTypeId) },
  }),
});

const changeProfileTypeDto = new GraphQLInputObjectType({
  name: 'ChangeProfileInput',
  fields: () => ({
    isMale: { type: GraphQLBoolean },
    yearOfBirth: { type: GraphQLInt },
    memberTypeId: { type: MemberTypeId },
  }),
});

export const profileCreate = {
  type: profileType,
  args: {
    dto: {
      type: createProfileTypeDto,
    },
  },
  resolve: async (
    parent: unknown,
    args: { dto: createProfileDto },
    context: GqlContext,
  ) => {
    return context.prisma.profile.create({
      data: {
        isMale: args.dto.isMale,
        yearOfBirth: args.dto.yearOfBirth,
        userId: args.dto.userId,
        memberTypeId: args.dto.memberTypeId,
      },
    });
  },
};

export const profileDelete = {
  type: GraphQLString,
  args: {
    id: {
      type: new GraphQLNonNull(UUIDType),
    },
  },
  resolve: async (parent: unknown, args: { id: string }, context: GqlContext) => {
    await context.prisma.profile.delete({
      where: { id: args.id },
    });
    return null;
  },
};

export const profileChange = {
  type: profileType,
  args: {
    id: {
      type: UUIDType,
    },
    dto: {
      type: changeProfileTypeDto,
    },
  },
  resolve: async (
    parent: unknown,
    args: { id: string; dto: changeProfileDto },
    context: GqlContext,
  ) => {
    const data: changeProfileDto = {};
    if (args.dto.isMale != undefined) data.isMale = args.dto.isMale;
    if (args.dto.yearOfBirth != undefined) data.yearOfBirth = args.dto.yearOfBirth;
    if (args.dto.memberTypeId != undefined) data.memberTypeId = args.dto.memberTypeId;
    return context.prisma.profile.update({
      where: { id: args.id },
      data,
    });
  },
};
