import UserPage from '@/app/main/user/[handle]/_answers';
import Profile from '@/app/main/user/[handle]/_profile';
import { Metadata } from 'next';
import { GetPrismaClient } from '@/app/api/_utils/getPrismaClient/get-prisma-client';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const profileHandle = decodeURIComponent(handle);
  const prisma = GetPrismaClient.getClient();
  const userProfile = await prisma.profile.findUnique({
    where: {
      handle: profileHandle,
    },
  });

  if (!userProfile) {
    return {
      title: 'User Not Found',
      description: 'The requested user could not be found',
    };
  }

  const username = userProfile.handle.match(/(?:@)(.+)(?:@)/)?.[1] || '';

  return {
    title: `@${username}'s ${userProfile.questionBoxName}`,
    openGraph: {
      title: `@${username}'s ${userProfile.questionBoxName}`,
      description: `@${username}'s ${userProfile.questionBoxName}`,
      images: userProfile.avatarUrl,
    },
  };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const userHandle = decodeURIComponent(handle);
  const prisma = GetPrismaClient.getClient();
  const user = await prisma.user.findUnique({
    where: {
      handle: userHandle,
    },
  });

  if (user === null) {
    return notFound();
  }
  return (
    <div className="w-[90%] window:w-[80%] desktop:w-[70%] grid grid-cols-1 desktop:grid-cols-2 gap-4">
      <>
        <a href={`https://${user.hostName}/@${user.account}`} className="hidden" rel={'me'}></a>
        <Profile />
        <UserPage />
      </>
    </div>
  );
}
