import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Note: Users must be created through Supabase Auth first
  // This seed script assumes you have at least one user in Supabase Auth
  // Replace these IDs with actual Supabase Auth user IDs after creating users

  // Example: Get the first user from the database (if any exist)
  const existingUser = await prisma.user.findFirst();

  if (!existingUser) {
    console.log('No users found in database. Please create a user through Supabase Auth first.');
    console.log('After creating a user, update this seed script with the user ID and run again.');
    return;
  }

  const userId = existingUser.id;

  console.log(`Using user: ${existingUser.email} (${userId})`);

  // Create sample daily logs
  const today = new Date();
  const logs = [];

  // Create logs for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Skip some days to create gaps (pending days)
    if (i % 7 === 0) continue; // Skip every 7th day

    // Most days are no sugar, but some have consumed sugar
    const consumedSugar = i % 10 === 0; // Every 10th day has sugar
    const confirmedAt = i < 20 ? new Date() : null; // First 20 days are confirmed

    logs.push({
      userId,
      date: dateString,
      consumedSugar,
      confirmedAt,
    });
  }

  // Create daily logs
  for (const log of logs) {
    try {
      await prisma.dailyLog.upsert({
        where: {
          userId_date: {
            userId: log.userId,
            date: log.date,
          },
        },
        update: log,
        create: log,
      });
    } catch (error) {
      console.error(`Error creating log for ${log.date}:`, error);
    }
  }

  console.log(`Created ${logs.length} daily logs`);

  // Create a sample challenge
  const existingChallenge = await prisma.challenge.findFirst({
    where: { ownerUserId: userId },
  });

  let challenge;
  if (existingChallenge) {
    console.log(`Challenge already exists: ${existingChallenge.name}`);
    challenge = existingChallenge;
  } else {
    const startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const inviteCode = `SAMPLE${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    challenge = await prisma.challenge.create({
      data: {
        ownerUserId: userId,
        name: 'Sample Sugar-Free Challenge',
        startDate,
        rules: ['addedSugarCounts', 'fruitDoesNotCount', 'missingDaysPending'],
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
        invites: {
          create: {
            code: inviteCode,
          },
        },
      },
      include: {
        invites: true,
      },
    });
  }

  const invite = await prisma.invite.findFirst({
    where: { challengeId: challenge.id },
  });

  console.log(`Created challenge: ${challenge.name} (${challenge.id})`);
  console.log(`Invite code: ${invite?.code || 'N/A'}`);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

