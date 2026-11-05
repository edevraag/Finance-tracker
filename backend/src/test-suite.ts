import app from './index';
import { prisma } from './prisma';
import http from 'http';

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, name: string, details?: string) {
  if (condition) {
    results.push({ name, passed: true });
    console.log(`  ✓ ${name}`);
  } else {
    results.push({ name, passed: false, details });
    console.error(`  ✗ ${name} (FAILED: ${details || 'Assertion failed'})`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   PERSONAL FINANCE TRACKER - BACKEND VERIFICATION   ');
  console.log('======================================================\n');

  // Start test server
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  const testEmailA = `test_a_${Date.now()}@example.com`;
  const testEmailB = `test_b_${Date.now()}@example.com`;
  let tokenA = '';
  let tokenB = '';
  let userIdA = '';
  let userIdB = '';
  let foodCategoryId = '';
  let userBCategoryId = '';
  let transactionId = '';
  let budgetId = '';

  const currentMonth = new Date().toISOString().slice(0, 7);

  try {
    // ------------------------------------------------------------------
    // TEST 1: Health Check
    // ------------------------------------------------------------------
    console.log('[1] Health Check');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'ok', 'GET /api/health returns 200 and status ok');

    // ------------------------------------------------------------------
    // TEST 2: Authentication & Security
    // ------------------------------------------------------------------
    console.log('\n[2] Authentication & Security');

    // 2.1 Register User A
    const regResA = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Smith', email: testEmailA, password: 'Password123!' }),
    });
    const regDataA = await regResA.json();
    assert(regResA.status === 201 && !!regDataA.token, 'Register User A succeeds with 201 and JWT token');
    tokenA = regDataA.token;
    userIdA = regDataA.user.id;

    // 2.2 Reject duplicate email
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice Clone', email: testEmailA, password: 'Password123!' }),
    });
    const dupData = await dupRes.json();
    assert(dupRes.status === 400 && dupData.error.includes('already registered'), 'Duplicate email registration returns 400');

    // 2.3 Reject short password
    const shortPassRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Shorty', email: `short_${Date.now()}@example.com`, password: 'short' }),
    });
    assert(shortPassRes.status === 400, 'Weak password (< 8 chars) rejected with 400');

    // 2.4 Register User B
    const regResB = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bob Jones', email: testEmailB, password: 'BobPassword123!' }),
    });
    const regDataB = await regResB.json();
    assert(regResB.status === 201 && !!regDataB.token, 'Register User B succeeds with 201');
    tokenB = regDataB.token;
    userIdB = regDataB.user.id;

    // 2.5 Login with wrong password
    const wrongLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailA, password: 'wrongpassword' }),
    });
    assert(wrongLoginRes.status === 401, 'Login with wrong password returns 401');

    // 2.6 Login with valid credentials
    const validLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmailA, password: 'Password123!' }),
    });
    const validLoginData = await validLoginRes.json();
    assert(validLoginRes.status === 200 && !!validLoginData.token, 'Login with valid credentials returns 200 and token');

    // 2.7 Current User (/me)
    const meWithoutToken = await fetch(`${BASE_URL}/auth/me`);
    assert(meWithoutToken.status === 401, 'Accessing /api/auth/me without token returns 401');

    const meWithToken = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const meData = await meWithToken.json();
    assert(meWithToken.status === 200 && meData.user.email === testEmailA, 'Accessing /api/auth/me with token returns user');

    // ------------------------------------------------------------------
    // TEST 3: Categories & Isolation
    // ------------------------------------------------------------------
    console.log('\n[3] Categories & Category Isolation');

    // 3.1 Default categories seeded automatically
    const catResA = await fetch(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const categoriesA = await catResA.json();
    assert(catResA.status === 200 && categoriesA.length >= 5, 'User A automatically has default categories seeded');
    const foodCat = categoriesA.find((c: any) => c.name.toLowerCase().includes('food'));
    foodCategoryId = foodCat ? foodCat.id : categoriesA[0].id;

    // Get a category from User B
    const catResB = await fetch(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const categoriesB = await catResB.json();
    userBCategoryId = categoriesB[0].id;

    // 3.2 Create custom category
    const createCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Investments', color: '#6366f1' }),
    });
    assert(createCatRes.status === 201, 'Create custom category returns 201');

    // 3.3 Reject duplicate category name
    const dupCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Investments' }),
    });
    assert(dupCatRes.status === 400, 'Duplicate category name returns 400');

    // ------------------------------------------------------------------
    // TEST 4: Transactions CRUD & Validation
    // ------------------------------------------------------------------
    console.log('\n[4] Transactions CRUD & Validation');

    // 4.1 Reject invalid amount (negative)
    const negAmountRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: foodCategoryId,
        type: 'EXPENSE',
        amount: -50,
        date: new Date().toISOString(),
      }),
    });
    assert(negAmountRes.status === 400, 'Transaction with negative amount rejected with 400');

    // 4.2 Reject non-numeric amount
    const strAmountRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: foodCategoryId,
        type: 'EXPENSE',
        amount: 'not-a-number',
        date: new Date().toISOString(),
      }),
    });
    assert(strAmountRes.status === 400, 'Transaction with non-numeric amount rejected with 400');

    // 4.3 Reject User B's category ID when used by User A (Data isolation!)
    const crossCatRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: userBCategoryId,
        type: 'EXPENSE',
        amount: 100,
        date: new Date().toISOString(),
      }),
    });
    assert(crossCatRes.status === 400, 'Transaction using another user category rejected with 400');

    // 4.4 Create valid Income transaction
    const salaryCat = categoriesA.find((c: any) => c.name.toLowerCase().includes('salary')) || categoriesA[0];
    const incomeRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: salaryCat.id,
        type: 'INCOME',
        amount: 5000,
        date: `${currentMonth}-05T10:00:00.000Z`,
        note: 'Monthly salary credit',
      }),
    });
    assert(incomeRes.status === 201, 'Create Income transaction returns 201');

    // 4.5 Create valid Expense transactions
    const expenseRes1 = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: foodCategoryId,
        type: 'EXPENSE',
        amount: 250,
        date: `${currentMonth}-08T12:30:00.000Z`,
        note: 'Supermarket groceries',
      }),
    });
    const expData1 = await expenseRes1.json();
    assert(expenseRes1.status === 201, 'Create Expense transaction returns 201');
    transactionId = expData1.id;

    const expenseRes2 = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: foodCategoryId,
        type: 'EXPENSE',
        amount: 150,
        date: `${currentMonth}-10T19:00:00.000Z`,
        note: 'Dinner with team',
      }),
    });
    assert(expenseRes2.status === 201, 'Create second Expense transaction returns 201');

    // 4.6 List transactions and test filtering
    const listRes = await fetch(`${BASE_URL}/transactions?month=${currentMonth}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const listData = await listRes.json();
    assert(listRes.status === 200 && listData.length === 3, 'GET /api/transactions returns 3 transactions for current month');

    // 4.7 Update transaction (PATCH)
    const patchRes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ amount: 300, note: 'Updated supermarket groceries' }),
    });
    const patchData = await patchRes.json();
    assert(patchRes.status === 200 && patchData.amount === 300, 'PATCH /api/transactions/:id updates amount to 300');

    // 4.8 Single transaction fetch (GET /:id)
    const singleRes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const singleData = await singleRes.json();
    assert(singleRes.status === 200 && singleData.note === 'Updated supermarket groceries', 'GET /api/transactions/:id returns single transaction');

    // 4.9 CSV Export
    const exportRes = await fetch(`${BASE_URL}/transactions/export?month=${currentMonth}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const exportCsv = await exportRes.text();
    assert(
      exportRes.status === 200 &&
        Boolean(exportRes.headers.get('content-type')?.includes('text/csv')) &&
        exportCsv.includes('Date,Type,Category,Amount,Note'),
      'GET /api/transactions/export returns valid CSV format with headers'
    );

    // ------------------------------------------------------------------
    // TEST 5: Data Isolation (User A vs User B)
    // ------------------------------------------------------------------
    console.log('\n[5] Multi-Tenant Data Isolation');

    // User B tries to view User A's transaction
    const bViewARes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(bViewARes.status === 404, 'User B cannot access User A transaction (returns 404)');

    // User B tries to update User A's transaction
    const bUpdateARes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ amount: 99999 }),
    });
    assert(bUpdateARes.status === 404, 'User B cannot update User A transaction (returns 404)');

    // User B tries to delete User A's transaction
    const bDeleteARes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    assert(bDeleteARes.status === 404, 'User B cannot delete User A transaction (returns 404)');

    // User B's transaction list is empty
    const bListRes = await fetch(`${BASE_URL}/transactions`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const bListData = await bListRes.json();
    assert(bListRes.status === 200 && bListData.length === 0, 'User B transaction list is isolated and empty');

    // ------------------------------------------------------------------
    // TEST 6: Budget Logic & Tracking
    // ------------------------------------------------------------------
    console.log('\n[6] Budget Logic & Tracking');

    // 6.1 Set budget of 1000 for food category for current month
    const setBudgetRes = await fetch(`${BASE_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: foodCategoryId,
        month: currentMonth,
        limitAmount: 1000,
      }),
    });
    const budgetData = await setBudgetRes.json();
    assert(setBudgetRes.status === 201 && budgetData.limitAmount === 1000, 'POST /api/budgets sets category monthly limit');
    budgetId = budgetData.id;

    // 6.2 Check remaining amount calculation
    // Food expenses = 300 + 150 = 450
    // Budget limit = 1000
    // Remaining = 550
    const getBudgetsRes = await fetch(`${BASE_URL}/budgets?month=${currentMonth}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const budgetsList = await getBudgetsRes.json();
    const foodBudget = budgetsList.find((b: any) => b.categoryId === foodCategoryId);
    assert(
      getBudgetsRes.status === 200 &&
        foodBudget &&
        foodBudget.spent === 450 &&
        foodBudget.remaining === 550 &&
        foodBudget.percentageSpent === 45.0 &&
        foodBudget.isOverBudget === false,
      'Budget correctly calculates spent (450), remaining (550), and percentageSpent (45%)'
    );

    // 6.3 Budget invalid amount rejected
    const invalidBudgetRes = await fetch(`${BASE_URL}/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        categoryId: foodCategoryId,
        month: currentMonth,
        limitAmount: -500,
      }),
    });
    assert(invalidBudgetRes.status === 400, 'Budget with negative amount rejected with 400');

    // ------------------------------------------------------------------
    // TEST 7: Dashboard Summary & Trends
    // ------------------------------------------------------------------
    console.log('\n[7] Dashboard Summary & Trends');

    // Income = 5000, Expense = 450, Balance = 4550, SavingsRate = 91%
    const summaryRes = await fetch(`${BASE_URL}/summary?month=${currentMonth}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const summaryData = await summaryRes.json();
    assert(
      summaryRes.status === 200 &&
        summaryData.totalIncome === 5000 &&
        summaryData.totalExpense === 450 &&
        summaryData.balance === 4550 &&
        summaryData.savingsRate === 91.0,
      'Summary correctly calculates totalIncome (5000), totalExpense (450), balance (4550), savingsRate (91%)'
    );
    assert(
      Array.isArray(summaryData.categoryBreakdown) && summaryData.categoryBreakdown.length === 1,
      'Summary provides categoryBreakdown with percentage share'
    );
    assert(
      Array.isArray(summaryData.monthlyTrends) && summaryData.monthlyTrends.length === 6,
      'Summary provides 6-month historical trend for Recharts'
    );

    // ------------------------------------------------------------------
    // TEST 8: Category Deletion Protection
    // ------------------------------------------------------------------
    console.log('\n[8] Category Deletion Protection');

    // Food category currently has transactions; attempting delete should fail with 400
    const delCatRes = await fetch(`${BASE_URL}/categories/${foodCategoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const delCatData = await delCatRes.json();
    assert(
      delCatRes.status === 400 && delCatData.error.includes('transaction(s)'),
      'Cannot delete category that contains transactions (returns 400 with helpful warning)'
    );

    // ------------------------------------------------------------------
    // TEST 9: Budget & Transaction Deletion
    // ------------------------------------------------------------------
    console.log('\n[9] Deletion Flow');

    // Delete budget
    const delBudgetRes = await fetch(`${BASE_URL}/budgets/${budgetId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delBudgetRes.status === 200, 'DELETE /api/budgets/:id deletes budget successfully');

    // Delete transaction
    const delTxRes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(delTxRes.status === 200, 'DELETE /api/transactions/:id deletes transaction successfully');

    // Verify transaction is gone
    const getDeletedTxRes = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert(getDeletedTxRes.status === 404, 'Fetching deleted transaction returns 404');
  } catch (error: any) {
    console.error('Test suite crashed with error:', error);
  } finally {
    // Clean up test users from database
    console.log('\n[Cleaning up test data...]');
    try {
      if (userIdA) await prisma.user.delete({ where: { id: userIdA } });
      if (userIdB) await prisma.user.delete({ where: { id: userIdB } });
      console.log('Cleanup finished.');
    } catch (e) {
      console.error('Cleanup error:', e);
    }

    server.close();

    const passedCount = results.filter((r) => r.passed).length;
    const failedCount = results.filter((r) => !r.passed).length;

    console.log('\n======================================================');
    console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED (TOTAL: ${results.length})`);
    console.log('======================================================\n');

    if (failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
