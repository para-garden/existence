// tests/financial.test.js — unit tests for the financial cycle
// Covers receiveMoney, deductBill, moneyTier, pending_bills, and financial_anxiety → serotonin.
//
// Note: serotoninTarget() is an internal function in state.js and is not exported.
// The financial_anxiety → serotonin pathway is therefore tested via the NT drift
// engine: after a large advanceTime() the serotonin level converges toward its target,
// letting us compare equilibrium levels under different financial_anxiety configurations.

import { describe, test, expect, beforeEach } from 'bun:test';
import { createTestContext } from '../js/test-context.js';

// Helper — create and initialise a test context.
// ctx.state.init() is required because createState() starts with s={} and state
// fields (including phone_inbox) are only populated by init() → defaults().
function makeCtx() {
  const ctx = createTestContext();
  ctx.state.init();
  return ctx;
}

// ---------------------------------------------------------------------------
// receiveMoney
// ---------------------------------------------------------------------------

describe('receiveMoney', () => {
  let ctx;
  beforeEach(() => { ctx = makeCtx(); });

  test('increases money by the given amount', () => {
    ctx.state.set('money', 100);
    ctx.state.receiveMoney(50, 'paycheck');
    expect(ctx.state.get('money')).toBe(150);
  });

  test('works when money is zero', () => {
    ctx.state.set('money', 0);
    ctx.state.receiveMoney(200, 'paycheck');
    expect(ctx.state.get('money')).toBe(200);
  });

  test('works when money is negative (overdrawn)', () => {
    ctx.state.set('money', -15);
    ctx.state.receiveMoney(100, 'paycheck');
    expect(ctx.state.get('money')).toBe(85);
  });

  test('handles fractional amounts without floating-point drift', () => {
    ctx.state.set('money', 10.10);
    ctx.state.receiveMoney(0.05, 'other');
    // adjustMoney rounds to 2 decimal places
    expect(ctx.state.get('money')).toBeCloseTo(10.15, 2);
  });
});

// ---------------------------------------------------------------------------
// moneyTier — all tiers including boundaries
// ---------------------------------------------------------------------------

describe('moneyTier', () => {
  let ctx;
  beforeEach(() => { ctx = makeCtx(); });

  test('returns "overdrawn" when money is negative', () => {
    ctx.state.set('money', -10);
    expect(ctx.state.moneyTier()).toBe('overdrawn');
  });

  test('returns "overdrawn" at -0.01', () => {
    ctx.state.set('money', -0.01);
    expect(ctx.state.moneyTier()).toBe('overdrawn');
  });

  test('returns "broke" when money is exactly 0', () => {
    ctx.state.set('money', 0);
    expect(ctx.state.moneyTier()).toBe('broke');
  });

  test('returns "scraping" just above 0 (e.g. $1)', () => {
    ctx.state.set('money', 1);
    expect(ctx.state.moneyTier()).toBe('scraping');
  });

  test('returns "scraping" just below $50 (e.g. $49.99)', () => {
    ctx.state.set('money', 49.99);
    expect(ctx.state.moneyTier()).toBe('scraping');
  });

  test('returns "tight" at $50', () => {
    ctx.state.set('money', 50);
    expect(ctx.state.moneyTier()).toBe('tight');
  });

  test('returns "tight" just below $200 (e.g. $199)', () => {
    ctx.state.set('money', 199);
    expect(ctx.state.moneyTier()).toBe('tight');
  });

  test('returns "careful" at $200', () => {
    ctx.state.set('money', 200);
    expect(ctx.state.moneyTier()).toBe('careful');
  });

  test('returns "careful" just below $600 (e.g. $599)', () => {
    ctx.state.set('money', 599);
    expect(ctx.state.moneyTier()).toBe('careful');
  });

  test('returns "okay" at $600', () => {
    ctx.state.set('money', 600);
    expect(ctx.state.moneyTier()).toBe('okay');
  });

  test('returns "okay" just below $1500 (e.g. $1499)', () => {
    ctx.state.set('money', 1499);
    expect(ctx.state.moneyTier()).toBe('okay');
  });

  test('returns "comfortable" at $1500', () => {
    ctx.state.set('money', 1500);
    expect(ctx.state.moneyTier()).toBe('comfortable');
  });

  test('returns "comfortable" just below $5000 (e.g. $4999)', () => {
    ctx.state.set('money', 4999);
    expect(ctx.state.moneyTier()).toBe('comfortable');
  });

  test('returns "cushioned" at $5000', () => {
    ctx.state.set('money', 5000);
    expect(ctx.state.moneyTier()).toBe('cushioned');
  });

  test('returns "cushioned" well above $5000', () => {
    ctx.state.set('money', 50000);
    expect(ctx.state.moneyTier()).toBe('cushioned');
  });
});

// ---------------------------------------------------------------------------
// deductBill — sufficient funds
// ---------------------------------------------------------------------------

describe('deductBill — sufficient funds', () => {
  let ctx;
  beforeEach(() => { ctx = makeCtx(); });

  test('deducts amount from money when funds are sufficient', () => {
    ctx.state.set('money', 500);
    ctx.state.deductBill(100, 'rent');
    expect(ctx.state.get('money')).toBe(400);
  });

  test('returns true when the bill is paid immediately', () => {
    ctx.state.set('money', 500);
    const result = ctx.state.deductBill(100, 'utilities');
    expect(result).toBe(true);
  });

  test('does not add to pending_bills when funds are sufficient', () => {
    ctx.state.set('money', 500);
    ctx.state.deductBill(100, 'phone');
    expect(ctx.state.get('pending_bills').length).toBe(0);
  });

  test('deducts exact amount when balance equals the bill', () => {
    ctx.state.set('money', 65);
    ctx.state.deductBill(65, 'utilities');
    expect(ctx.state.get('money')).toBe(0);
    expect(ctx.state.moneyTier()).toBe('broke');
  });
});

// ---------------------------------------------------------------------------
// deductBill — insufficient funds → pending_bills
// ---------------------------------------------------------------------------

describe('deductBill — insufficient funds', () => {
  let ctx;
  beforeEach(() => { ctx = makeCtx(); });

  test('returns false when funds are insufficient', () => {
    ctx.state.set('money', 10);
    const result = ctx.state.deductBill(100, 'rent');
    expect(result).toBe(false);
  });

  test('does NOT deduct money when queuing a pending bill', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(100, 'rent');
    expect(ctx.state.get('money')).toBe(10);
  });

  test('adds an entry to pending_bills', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(100, 'rent');
    const bills = ctx.state.get('pending_bills');
    expect(bills.length).toBe(1);
  });

  test('pending_bills entry has correct name and amount', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(65, 'utilities');
    const bill = ctx.state.get('pending_bills')[0];
    expect(bill.name).toBe('utilities');
    expect(bill.amount).toBe(65);
  });

  test('pending_bills entry has a notified field', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(45, 'phone');
    const bill = ctx.state.get('pending_bills')[0];
    expect(typeof bill.notified).toBe('boolean');
  });

  test('deduplicates: calling deductBill twice for the same bill name does not add a second entry', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(100, 'rent');
    ctx.state.deductBill(100, 'rent');
    const bills = ctx.state.get('pending_bills');
    expect(bills.length).toBe(1);
  });

  test('queues different bill types separately', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(100, 'rent');
    ctx.state.deductBill(65, 'utilities');
    const bills = ctx.state.get('pending_bills');
    expect(bills.length).toBe(2);
    const names = bills.map(b => b.name);
    expect(names).toContain('rent');
    expect(names).toContain('utilities');
  });
});

// ---------------------------------------------------------------------------
// failBill — overdraft fee on first negative crossing
// ---------------------------------------------------------------------------

describe('failBill — overdraft fee', () => {
  let ctx;
  beforeEach(() => { ctx = makeCtx(); });

  test('applies $30 overdraft fee when crossing from $0 into negative', () => {
    // money = $0 → after overdraft fee: -$30
    ctx.state.set('money', 0);
    ctx.state.failBill('utilities');
    expect(ctx.state.get('money')).toBe(-30);
  });

  test('does NOT apply another overdraft fee when already overdrawn', () => {
    // money already negative — fee guard should block the extra $30 deduction
    ctx.state.set('money', -5);
    ctx.state.failBill('utilities');
    // money stays at -5 (no extra fee)
    expect(ctx.state.get('money')).toBe(-5);
  });

  test('money tier is "overdrawn" after overdraft fee fires', () => {
    ctx.state.set('money', 0);
    ctx.state.failBill('phone');
    expect(ctx.state.moneyTier()).toBe('overdrawn');
  });

  test('removes the bill from pending_bills after failing it', () => {
    ctx.state.set('money', 10);
    // Queue the bill first via deductBill
    ctx.state.deductBill(100, 'rent');
    expect(ctx.state.get('pending_bills').length).toBe(1);
    // Fail the bill — should remove it from the queue
    ctx.state.failBill('rent');
    expect(ctx.state.get('pending_bills').length).toBe(0);
  });

  test('only removes the matching bill from pending_bills, leaving others', () => {
    ctx.state.set('money', 10);
    ctx.state.deductBill(100, 'rent');
    ctx.state.deductBill(65, 'utilities');
    ctx.state.failBill('rent');
    const bills = ctx.state.get('pending_bills');
    expect(bills.length).toBe(1);
    expect(bills[0].name).toBe('utilities');
  });
});

// ---------------------------------------------------------------------------
// financial_anxiety (money sentiment) → serotonin equilibrium
//
// serotoninTarget() is not exported. We observe its effect via the drift engine:
// advanceTime() shifts serotonin toward its current target on each call.
// After enough elapsed time the level converges close to the target, so we can
// compare equilibrium serotonin under different financial_anxiety settings.
//
// Test conditions are held constant except the anxiety sentiment, and drift is
// applied identically in both cases, so relative ordering reflects the target.
// ---------------------------------------------------------------------------

describe('financial_anxiety sentiment → serotonin equilibrium', () => {
  // Pin a stable location and money level to avoid confounding effects from
  // the direct money-level penalty or the workplace dopamine path.
  // apartment_main triggers the anxiety-at-home serotonin path in serotoninTarget().
  // money is held at $1000 so the direct money-level formula (money < $200) is silent.

  function buildScenario(anxietyIntensity) {
    const ctx = makeCtx();
    ctx.state.set('location', 'apartment_main');
    ctx.state.set('money', 1000);
    // Start serotonin at a fixed neutral level so both scenarios drift from the same base
    ctx.state.set('serotonin', 50);
    if (anxietyIntensity > 0) {
      ctx.state.adjustSentiment('money', 'anxiety', anxietyIntensity);
    }
    // Advance 2000 minutes (~33 h) — enough for substantial drift toward the target.
    // serotonin rate is [0.06, 0.08]/hr → t½ ~9-11h, so ~3 half-lives of convergence.
    ctx.state.advanceTime(2000);
    return ctx.state.get('serotonin');
  }

  test('high financial anxiety produces lower equilibrium serotonin than zero anxiety', () => {
    const serHigh = buildScenario(1.0);
    const serNone = buildScenario(0);
    expect(serHigh).toBeLessThan(serNone);
  });

  test('moderate financial anxiety sits between zero and full anxiety', () => {
    const serNone = buildScenario(0);
    const serHalf = buildScenario(0.5);
    const serFull = buildScenario(1.0);
    // serFull < serHalf < serNone (anxiety lowers the target, target pulls level down)
    expect(serFull).toBeLessThan(serHalf);
    expect(serHalf).toBeLessThan(serNone);
  });

  test('financial_anxiety sentiment intensity is stored and retrievable', () => {
    const ctx = makeCtx();
    ctx.state.adjustSentiment('money', 'anxiety', 0.7);
    expect(ctx.state.sentimentIntensity('money', 'anxiety')).toBeCloseTo(0.7, 5);
  });

  test('zero financial anxiety sentiment has no stored intensity', () => {
    const ctx = makeCtx();
    // No adjustment — should return 0
    expect(ctx.state.sentimentIntensity('money', 'anxiety')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// direct money level → serotonin equilibrium
//
// serotoninTarget() applies (200 - money) * 0.019 when money < $200.
// We verify this by comparing equilibrium serotonin across different balances.
// ---------------------------------------------------------------------------

describe('low money → serotonin equilibrium penalty', () => {
  function buildBalanceScenario(money) {
    const ctx = makeCtx();
    ctx.state.set('location', 'apartment_main');
    ctx.state.set('money', money);
    ctx.state.set('serotonin', 50);
    ctx.state.advanceTime(2000);
    return ctx.state.get('serotonin');
  }

  test('being broke ($0) produces lower equilibrium serotonin than comfortable ($1000)', () => {
    const broke = buildBalanceScenario(0);
    const okay = buildBalanceScenario(1000);
    expect(broke).toBeLessThan(okay);
  });

  test('being overdrawn (-$100) produces lower equilibrium serotonin than broke ($0)', () => {
    const overdrawn = buildBalanceScenario(-100);
    const broke = buildBalanceScenario(0);
    expect(overdrawn).toBeLessThan(broke);
  });

  test('being in "tight" range ($100) produces lower equilibrium serotonin than $1000', () => {
    const tight = buildBalanceScenario(100);
    const okay = buildBalanceScenario(1000);
    expect(tight).toBeLessThan(okay);
  });

  test('money at exactly $200 and $1000 produce identical equilibrium serotonin (no penalty above $200)', () => {
    // The formula fires only when money < 200, so $200 and $1000 should converge identically.
    const at200 = buildBalanceScenario(200);
    const at1000 = buildBalanceScenario(1000);
    // Allow a small tolerance for biological jitter (sine waves advance with time in both cases)
    expect(Math.abs(at200 - at1000)).toBeLessThan(0.5);
  });
});
