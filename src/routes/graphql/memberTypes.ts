import { GraphQLObjectType, GraphQLList, GraphQLInt, GraphQLFloat } from 'graphql';
import { GqlContext } from './types/interfaces.js';
import { MemberTypeId } from './types/membertypeid.js';

export const memberTypeType = new GraphQLObjectType({
  name: 'memberType',
  fields: () => ({
    id: { type: MemberTypeId },
    discount: { type: GraphQLFloat },
    postsLimitPerMonth: { type: GraphQLInt },
  }),
});

export const memberTypesQuery = {
  type: new GraphQLList(memberTypeType),
  resolve: async (_parent: unknown, _args: unknown, context: GqlContext) => {
    return context.prisma.memberType.findMany();
  },
};

export const memberTypeQuery = {
  type: memberTypeType,
  args: { id: { type: MemberTypeId } },
  resolve: async (_parent: unknown, args: { id: string }, context: GqlContext) => {
    const mte = await context.prisma.memberType.findUnique({
      where: { id: args.id },
    });

    if (!mte) {
      return null;
    }

    return mte;
  },
};
