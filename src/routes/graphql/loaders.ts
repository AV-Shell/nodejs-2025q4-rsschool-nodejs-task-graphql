import DataLoader from 'dataloader';
import { Post, PrismaClient, User } from '@prisma/client';

export function createMemberTypesLoader(prisma: PrismaClient) {
  return new DataLoader(async (ids: readonly string[]) => {
    const memberTypes = await prisma.memberType.findMany({
      where: { id: { in: [...ids] } },
    });

    const map = new Map(memberTypes.map((x) => [x.id, x]));
    return ids.map((id) => map.get(id) || null);
  });
}

export function createPostsLoader(prisma: PrismaClient) {
  return new DataLoader(async (ids: readonly string[]) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...ids] } },
    });

    const PostByAuthorIds = new Map<string, Array<Post>>(ids.map((id) => [id, []]));

    posts.forEach((post) => {
      if (PostByAuthorIds.has(post.authorId)) {
        const authorPosts = PostByAuthorIds.get(post.authorId)!;
        authorPosts.push(post);
      }
    });

    return ids.map((id) => PostByAuthorIds.get(id) || null);
  });
}

export function createProfileLoader(prisma: PrismaClient) {
  return new DataLoader(async (ids: readonly string[]) => {
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: [...ids] } },
    });

    const map = new Map(profiles.map((x) => [x.userId, x]));
    return ids.map((id) => map.get(id) || null);
  });
}

export function createSubscribersLoader(prisma: PrismaClient) {
  return new DataLoader<string, User[]>(async (ids: readonly string[]) => {
    const subscribers = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: [...ids] } },
      include: { subscriber: true },
    });

    const SubscribersByAuthorIds = new Map<string, Array<User>>(
      ids.map((id) => [id, []]),
    );

    subscribers.forEach((subscriber) => {
      if (SubscribersByAuthorIds.has(subscriber.authorId)) {
        const authorSubs = SubscribersByAuthorIds.get(subscriber.authorId)!;
        authorSubs.push(subscriber.subscriber);
      }
    });

    return ids.map((id) => SubscribersByAuthorIds.get(id) || []);
  });
}

export function createAuthorsLoader(prisma: PrismaClient) {
  return new DataLoader<string, User[]>(async (ids: readonly string[]) => {
    const subscribers = await prisma.subscribersOnAuthors.findMany({
      where: { subscriberId: { in: [...ids] } },
      include: { author: true },
    });

    const AuthorsByUserId = new Map<string, Array<User>>(ids.map((id) => [id, []]));

    subscribers.forEach((author) => {
      if (AuthorsByUserId.has(author.subscriberId)) {
        const authorsByUser = AuthorsByUserId.get(author.subscriberId)!;
        authorsByUser.push(author.author);
      }
    });

    return ids.map((id) => AuthorsByUserId.get(id) || []);
  });
}
