import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data for Personal Finance Tracker (in INR ₹)...');

  const demoEmail = 'demo@example.com';
  const existingUser = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (existingUser) {
    console.log(`User ${demoEmail} already exists. Cleaning up existing demo user data...`);
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);

  // Helper for date in month
  const makeDate = (year: number, monthIdx: number, day: number) =>
    new Date(Date.UTC(year, monthIdx, day, 12, 0, 0));

  const curYear = now.getUTCFullYear();
  const curMonthIdx = now.getUTCMonth(); // 0-based

  const user = await prisma.user.create({
    data: {
      name: 'demo guy',
      email: demoEmail,
      passwordHash,
      categories: {
        create: [
          { name: 'Salary', color: '#10b981' },
          { name: 'Food & Dining', color: '#f59e0b' },
          { name: 'Rent & Housing', color: '#3b82f6' },
          { name: 'Shopping', color: '#ec4899' },
          { name: 'Transport', color: '#8b5cf6' },
          { name: 'Entertainment', color: '#06b6d4' },
          { name: 'Utilities', color: '#64748b' },
        ],
      },
    },
    include: { categories: true },
  });

  const categoryMap = new Map(user.categories.map((c) => [c.name, c.id]));

  // Seed Budgets for current month (in Rupees ₹)
  await prisma.budget.createMany({
    data: [
      {
        userId: user.id,
        categoryId: categoryMap.get('Food & Dining')!,
        month: currentMonth,
        limitAmount: 15000,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('Rent & Housing')!,
        month: currentMonth,
        limitAmount: 22000,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('Shopping')!,
        month: currentMonth,
        limitAmount: 8000,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('Entertainment')!,
        month: currentMonth,
        limitAmount: 5000,
      },
      {
        userId: user.id,
        categoryId: categoryMap.get('Transport')!,
        month: currentMonth,
        limitAmount: 4000,
      },
    ],
  });

  // Seed Transactions: Current month + 2 previous months (in Rupees ₹)
  const sampleTransactions = [
    // Current month
    {
      categoryId: categoryMap.get('Salary')!,
      type: 'INCOME',
      amount: 75000,
      date: makeDate(curYear, curMonthIdx, 1),
      note: 'Monthly salary credit',
    },
    {
      categoryId: categoryMap.get('Rent & Housing')!,
      type: 'EXPENSE',
      amount: 22000,
      date: makeDate(curYear, curMonthIdx, 2),
      note: 'Apartment rent payment',
    },
    {
      categoryId: categoryMap.get('Food & Dining')!,
      type: 'EXPENSE',
      amount: 4250,
      date: makeDate(curYear, curMonthIdx, 3),
      note: 'Supermarket weekly grocery haul',
    },
    {
      categoryId: categoryMap.get('Utilities')!,
      type: 'EXPENSE',
      amount: 2150,
      date: makeDate(curYear, curMonthIdx, 4),
      note: 'High-speed broadband & power bill',
    },
    {
      categoryId: categoryMap.get('Transport')!,
      type: 'EXPENSE',
      amount: 1400,
      date: makeDate(curYear, curMonthIdx, 5),
      note: 'Metro card recharge & fuel',
    },
    {
      categoryId: categoryMap.get('Food & Dining')!,
      type: 'EXPENSE',
      amount: 1850,
      date: makeDate(curYear, curMonthIdx, 6),
      note: 'Weekend dinner with team',
    },
    {
      categoryId: categoryMap.get('Shopping')!,
      type: 'EXPENSE',
      amount: 3499,
      date: makeDate(curYear, curMonthIdx, 7),
      note: 'New ergonomic desk chair cushion',
    },
    {
      categoryId: categoryMap.get('Entertainment')!,
      type: 'EXPENSE',
      amount: 1200,
      date: makeDate(curYear, curMonthIdx, 8),
      note: 'Cinema tickets & weekend movie',
    },

    // 1 Month Ago
    {
      categoryId: categoryMap.get('Salary')!,
      type: 'INCOME',
      amount: 75000,
      date: makeDate(curYear, curMonthIdx - 1, 1),
      note: 'Monthly salary credit',
    },
    {
      categoryId: categoryMap.get('Rent & Housing')!,
      type: 'EXPENSE',
      amount: 22000,
      date: makeDate(curYear, curMonthIdx - 1, 2),
      note: 'Apartment rent payment',
    },
    {
      categoryId: categoryMap.get('Food & Dining')!,
      type: 'EXPENSE',
      amount: 9800,
      date: makeDate(curYear, curMonthIdx - 1, 10),
      note: 'Monthly groceries & dining',
    },
    {
      categoryId: categoryMap.get('Shopping')!,
      type: 'EXPENSE',
      amount: 6200,
      date: makeDate(curYear, curMonthIdx - 1, 15),
      note: 'Clothing & electronics',
    },
    {
      categoryId: categoryMap.get('Transport')!,
      type: 'EXPENSE',
      amount: 2800,
      date: makeDate(curYear, curMonthIdx - 1, 20),
      note: 'Cab rides & fuel',
    },

    // 2 Months Ago
    {
      categoryId: categoryMap.get('Salary')!,
      type: 'INCOME',
      amount: 72000,
      date: makeDate(curYear, curMonthIdx - 2, 1),
      note: 'Monthly salary credit',
    },
    {
      categoryId: categoryMap.get('Rent & Housing')!,
      type: 'EXPENSE',
      amount: 22000,
      date: makeDate(curYear, curMonthIdx - 2, 2),
      note: 'Apartment rent payment',
    },
    {
      categoryId: categoryMap.get('Food & Dining')!,
      type: 'EXPENSE',
      amount: 8900,
      date: makeDate(curYear, curMonthIdx - 2, 12),
      note: 'Groceries & groceries market',
    },
    {
      categoryId: categoryMap.get('Transport')!,
      type: 'EXPENSE',
      amount: 2400,
      date: makeDate(curYear, curMonthIdx - 2, 18),
      note: 'Fuel & taxi rides',
    },
  ];

  await prisma.transaction.createMany({
    data: sampleTransactions.map((tx) => ({
      userId: user.id,
      ...tx,
    })),
  });

  console.log('Seed completed successfully with Indian Rupee (₹) amounts!');
  console.log('------------------------------------------------------');
  console.log(`Demo Account Email:    ${demoEmail}`);
  console.log(`Demo Account Password: Password123!`);
  console.log('Seeded:');
  console.log(`  - 7 Categories`);
  console.log(`  - 5 Monthly Budgets for ${currentMonth}`);
  console.log(`  - ${sampleTransactions.length} Sample Transactions across 3 months`);
  console.log('------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
