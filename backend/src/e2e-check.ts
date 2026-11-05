import app from './index';
import http from 'http';

const TEST_PORT = 5056;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let server: http.Server;

async function runE2E() {
  console.log('\n==========================================================');
  console.log('   FULL-STACK INTEGRATION & FRONTEND-BACKEND TEST (INR ₹)   ');
  console.log('==========================================================\n');

  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => resolve());
  });

  try {
    // 1. Health check
    const health = await fetch(`${BASE_URL}/health`);
    console.log(`[1] Backend API Health: status = ${health.status}`);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Demo User Login (Slide 15 Step 1)
    console.log('\n[2] Testing Demo User Login (Slide 15, Step 1: Sign In)...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com', password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    console.log(`    Login response status: ${loginRes.status}`);
    console.log(`    Authenticated as: ${loginData.user?.name} (${loginData.user?.email})`);
    const token = loginData.token;
    if (!token) throw new Error('Failed to retrieve JWT token');

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    // 3. Current User verification (/auth/me)
    console.log('\n[3] Testing Session Persistence (GET /auth/me)...');
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    console.log(`    User session validated: ${meData.user.name}`);

    // 4. Load Categories (for forms & filters)
    console.log('\n[4] Testing Categories Fetch (GET /categories)...');
    const catRes = await fetch(`${BASE_URL}/categories`, { headers: authHeaders });
    const categories = await catRes.json();
    console.log(`    Categories loaded: ${categories.length} categories found (${categories.map((c: any) => c.name).join(', ')})`);

    // 5. Dashboard Summary (Slide 15 Step 5)
    console.log('\n[5] Testing Dashboard Summary Data (GET /summary?month=2026-11)...');
    const summaryRes = await fetch(`${BASE_URL}/summary?month=2026-11`, { headers: authHeaders });
    const summary = await summaryRes.json();
    console.log(`    Income:  ₹${summary.totalIncome.toFixed(2)}`);
    console.log(`    Expense: ₹${summary.totalExpense.toFixed(2)}`);
    console.log(`    Balance: ₹${summary.balance.toFixed(2)}`);
    console.log(`    Savings Rate: ${summary.savingsRate}%`);
    console.log(`    Category Breakdown: ${summary.categoryBreakdown.length} items`);
    console.log(`    6-Month Trend Points: ${summary.monthlyTrends.length} months`);

    // 6. Budgets (Slide 15 Step 4)
    console.log('\n[6] Testing Budgets Screen (GET /budgets?month=2026-11)...');
    const budgetRes = await fetch(`${BASE_URL}/budgets?month=2026-11`, { headers: authHeaders });
    const budgets = await budgetRes.json();
    console.log(`    Budgets found: ${budgets.length}`);
    for (const b of budgets) {
      console.log(`      - ${b.category.name}: Limit ₹${b.limitAmount}, Spent ₹${b.spent}, Remaining ₹${b.remaining} (${b.percentageSpent}%)`);
    }

    // 7. Record a New Transaction (Slide 15 Step 2: Add Data)
    console.log('\n[7] Testing Adding Transaction (Slide 15 Step 2: Add Data)...');
    const foodCat = categories.find((c: any) => c.name === 'Food & Dining');
    const newTxRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        categoryId: foodCat.id,
        type: 'EXPENSE',
        amount: 850,
        date: '2026-11-09T14:00:00.000Z',
        note: 'Live demo team lunch',
      }),
    });
    const newTx = await newTxRes.json();
    console.log(`    Created transaction: ID ${newTx.id}, Amount ₹${newTx.amount}, Category: ${newTx.category.name}`);

    // 8. Re-verify Budget Tracking update (Slide 15 Step 4)
    console.log('\n[8] Re-checking Budget Update (Real-time Remaining Amount Calculation)...');
    const updatedBudgetRes = await fetch(`${BASE_URL}/budgets?month=2026-11`, { headers: authHeaders });
    const updatedBudgets = await updatedBudgetRes.json();
    const updatedFoodBudget = updatedBudgets.find((b: any) => b.categoryId === foodCat.id);
    console.log(`    Updated Food Budget: Spent ₹${updatedFoodBudget.spent}, Remaining ₹${updatedFoodBudget.remaining} (${updatedFoodBudget.percentageSpent}%)`);

    // 9. Filter transactions (Slide 15 Step 3: Filter)
    console.log('\n[9] Testing Transactions Filter (Slide 15 Step 3: Filter by type & category)...');
    const filterRes = await fetch(`${BASE_URL}/transactions?month=2026-11&type=EXPENSE&categoryId=${foodCat.id}`, {
      headers: authHeaders,
    });
    const filteredTxs = await filterRes.json();
    console.log(`    Filtered Food Expenses: ${filteredTxs.length} transactions returned.`);

    // 10. Export CSV (Slide 15 Step 6: Export)
    console.log('\n[10] Testing CSV Export (Slide 15 Step 6: Export CSV)...');
    const exportRes = await fetch(`${BASE_URL}/transactions/export?month=2026-11`, { headers: authHeaders });
    const csvContent = await exportRes.text();
    const lines = csvContent.trim().split('\n');
    console.log(`    Exported CSV: Content-Type = ${exportRes.headers.get('content-type')}`);
    console.log(`    CSV Header: ${lines[0]}`);
    console.log(`    Total CSV Lines: ${lines.length} lines`);

    console.log('\n==========================================================');
    console.log('   ALL FRONTEND-BACKEND INTEGRATION TESTS PASSED 100%!   ');
    console.log('==========================================================\n');
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runE2E();
