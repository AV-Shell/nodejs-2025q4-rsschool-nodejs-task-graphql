import { GraphQLObjectType, GraphQLList, GraphQLInt, GraphQLBoolean } from 'graphql';
import { GqlContext } from './types/interfaces.js';
import { UUIDType } from './types/uuid.js';
import { memberTypeType } from './memberTypes.js';
import { MemberTypeId } from './types/membertypeid.js';

const profileType = new GraphQLObjectType({
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
        console.error({ parent });
        console.error({
          result: context.prisma.memberType
            .findUnique({
              where: { id: parent.memberTypeId },
            })
            .then((data) => {
              console.log({ result: data });
              return data;
            })
            .then((data) => console.log({ result: data }))
            .catch((e) => console.log(e)),
        });

        return context.prisma.memberType.findUnique({
          where: { id: parent.memberTypeId },
        });
      },
    },
  }),
});

const profilesQuery = {
  type: new GraphQLList(profileType),
  resolve: async (_parent: unknown, _args: unknown, context: GqlContext) => {
    return context.prisma.profile.findMany();
  },
};

const profileQuery = {
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

export { profileType, profilesQuery, profileQuery };
