# Quick Implementation Reference - Dashboard Improvements

## Key File Locations (Absolute Paths)

### Frontend Store (THE MAIN FILE TO CHANGE)
```
/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/presentation/stores/enhancedDashboardStore.svelte.ts
```
Line 22: `let selectedPeriodType = $state<PeriodType>('month');` → CHANGE TO `'year'`

### Frontend Components
```
/Users/alcibiades/Github/happy-balance/apps/frontend/src/routes/+page.svelte
  └─ Main dashboard entry point

/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/molecules/CleanPeriodNav.svelte
  └─ Period navigation UI

/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/molecules/FinancialChart.svelte
  └─ Line chart (Income/Expenses/Balance)

/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/molecules/FinancialBarCharts.svelte
  └─ Bar chart (Expense breakdown)
```

### Domain Layer
```
/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/domain/value-objects/Period.ts
  └─ Period type definition & calculation

/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/domain/entities/Trend.ts
  └─ Trend analysis (already implements basic BI)
```

### Data Layer
```
/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/infrastructure/adapters/ModernApiDashboardRepository.ts
  └─ API client for dashboard data
```

### Backend API
```
/Users/alcibiades/Github/happy-balance/apps/backend/src/infrastructure/routes/dashboardRoutesV2.ts
  └─ API endpoint definitions

/Users/alcibiades/Github/happy-balance/apps/backend/src/infrastructure/controllers/DashboardController.ts
  └─ Controller logic
```

---

## Implementation Checklist

### Task 1: Change Default to Annual (30 minutes)
- [ ] Edit `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/presentation/stores/enhancedDashboardStore.svelte.ts`
  - Line 22: Change `'month'` to `'year'`
- [ ] Test: Load dashboard, verify "Este año" appears selected
- [ ] Test: Navigate between years
- [ ] Test: Switch back to monthly, then annual again

### Task 2: Implement 12-Month Rolling Charts (1 hour)
- [ ] Edit `enhancedDashboardStore.svelte.ts` lines 103-157
  - Modify: Load 12-month history for all period types for charts
  - Keep: Individual period data for metrics display
- [ ] Optional: Add visual indicator in UI showing "Last 12 months"
- [ ] Test: Verify charts show 12 data points regardless of period

### Task 3: Add Core BI Features (4-6 hours)
- [ ] Create `TrendAnalysisService.ts` in domain/services
  - Moving average calculations
  - Standard deviation
  - Seasonal pattern detection
- [ ] Create `BudgetVarianceService.ts`
  - Budget vs actual comparison
  - Variance percentages
- [ ] Update store to expose new metrics
- [ ] Create UI components to display new metrics

### Task 4: Year-over-Year Comparison (2 hours)
- [ ] Add method to repository: `getMultipleYearSummaries()`
- [ ] Add calculation in store: `getYearOverYearTrends()`
- [ ] Create component: `YearOverYearComparison.svelte`
- [ ] Display in dashboard alongside existing charts

### Task 5: Data Quality & Validation (1-2 hours)
- [ ] Create `DataQualityValidator.ts`
- [ ] Add checks for: missing periods, data gaps, outliers
- [ ] Display data quality badge in dashboard
- [ ] Add tooltip explaining quality score

---

## Code Changes Summary

### CHANGE 1: Default Period
**File:** `enhancedDashboardStore.svelte.ts` line 22
```diff
- let selectedPeriodType = $state<PeriodType>('month');
+ let selectedPeriodType = $state<PeriodType>('year');
```

### CHANGE 2: 12-Month Rolling Charts
**File:** `enhancedDashboardStore.svelte.ts` lines 103-157
```diff
  if (selectedPeriodType === 'month') {
    const [comparisonData, savings, history] = await Promise.all([
      repository.getComparison(year, month),
      repository.getSavingsMetrics(year, month),
      repository.getHistory(12)
    ]);
    comparison = comparisonData;
    savingsMetrics = savings;
    historicalData = history;
    loadHistoricalData = true;
- } else if (selectedPeriodType === 'quarter') {
-   historicalData = await repository.getQuarterlyHistory(8);
-   loadHistoricalData = true;
- } else if (selectedPeriodType === 'year') {
-   historicalData = await repository.getYearlyHistory(12);
-   loadHistoricalData = true;
- }
+ } else if (selectedPeriodType === 'quarter' || selectedPeriodType === 'year') {
+   // For all views, load 12-month historical data for charts
+   historicalData = await repository.getHistory(12);
+   loadHistoricalData = true;
+ }
```

---

## Data Flow for Annual View

```
User opens dashboard
         ↓
Store initializes with selectedPeriodType = 'year'
         ↓
Initialize() → detectLastPeriodWithData() → loadDashboardData()
         ↓
Period.create('year', 0) creates current year period
         ↓
buildModernUrl() → /dashboard/year/2025
         ↓
Repository fetches:
  ├─ Current year metrics (/dashboard/year/2025)
  ├─ 12-month history (/dashboard/history?months=12)
  ├─ Comparison with previous year
  └─ Savings metrics
         ↓
Historical data converted to chart format (monthlyTrend)
         ↓
Charts render 12 monthly data points
         ↓
User can navigate: Previous year (-1), Next year (0 max)
```

---

## BI Features Roadmap

### Already Implemented ✓
- Trend analysis (up/down/stable)
- Multi-period historical data
- Category breakdown
- Budget tracking
- Expense distribution

### Quick Wins (< 2 hours each)
- [ ] Moving average trendline
- [ ] Year-over-year comparison
- [ ] Monthly seasonal patterns
- [ ] Budget variance analysis

### Medium Effort (2-4 hours each)
- [ ] Forecasting (3-month projection)
- [ ] Statistical significance testing
- [ ] Data quality scores
- [ ] Drill-down to transactions

### Advanced Features (4+ hours each)
- [ ] Anomaly detection
- [ ] Predictive budgeting
- [ ] Category recommendations
- [ ] Real-time alerts

---

## Testing Checklist

### Unit Tests
- [ ] Period calculations with offsets
- [ ] Trend calculations
- [ ] Moving average function
- [ ] Standard deviation calculation
- [ ] Seasonal index computation

### Integration Tests
- [ ] Store initialization defaults to 'year'
- [ ] Period change triggers correct API calls
- [ ] Chart data populated correctly
- [ ] Navigation limits enforced

### Manual Tests
- [ ] Dashboard loads with annual view by default
- [ ] Charts show 12 months of data
- [ ] Year navigation works (prev/next year)
- [ ] Switch to monthly view works
- [ ] Switch back to annual view works
- [ ] Category data displays correctly
- [ ] Currency formatting correct

---

## Performance Notes

### Current Performance
- Single period change triggers reload
- No data caching
- All charts render even if not visible

### Optimization Opportunities
- Cache historical data (could save 80% of requests)
- Lazy load detailed chart data
- Memoize trend calculations
- Implement virtual scrolling for category lists

### Recommended Optimization:
```typescript
// Simple cache in store
const dataCache = new Map<string, DashboardData>();

async function getCachedData(period: Period, currency: string) {
  const key = `${period.getType()}-${period.getOffset()}-${currency}`;
  if (dataCache.has(key)) {
    console.log('[Cache HIT]', key);
    return dataCache.get(key)!;
  }
  
  const data = await loadDashboardDataUseCase.execute(period, currency);
  dataCache.set(key, data);
  return data;
}
```

---

## Troubleshooting

### Issue: Charts show wrong period
- Check `selectedPeriodType` in store
- Verify `loadDashboardData()` was called
- Check API responses in browser DevTools

### Issue: 12 months not showing
- Check `repository.getHistory(12)` is called
- Verify `historicalData` is populated
- Check `monthlyTrend` mapping (lines 135-142)

### Issue: Year navigation broken
- Check offset limits in `navigatePeriod()` method
- Verify `Period.calculateDates()` handles year offsets
- Check UI button disabled states

### Issue: Performance slow
- Check Network tab for API calls (should see only 1-2 calls)
- Check DevTools Performance tab for rendering bottlenecks
- Consider implementing caching (see optimization section)

---

## Questions?

Refer to the full analysis: `DASHBOARD_ARCHITECTURE_ANALYSIS.md` in project root

Key sections:
- Section 2: Frontend Architecture details
- Section 4: Data Fetching Strategy
- Section 5: State Management Details
- Section 7: Implementation Details with code snippets
