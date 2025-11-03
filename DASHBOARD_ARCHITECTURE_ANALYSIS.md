# Dashboard Architecture Analysis - Happy Balance

## Executive Summary

The Happy Balance application has a well-structured, domain-driven architecture for its Dashboard module. Currently, it **defaults to monthly view** and loads data based on selected periods. To implement your improvements (annual default, 12-month rolling charts, BI best practices), we need to modify the period default and enhance the data fetching strategy.

---

## 1. Current Architecture Overview

### 1.1 Data Flow Diagram
```
Frontend (Svelte Components)
    ↓
Store (enhancedDashboardStore)
    ↓
Use Cases (LoadDashboardDataUseCase, CalculateTrendsUseCase)
    ↓
Repository (ModernApiDashboardRepository)
    ↓
HTTP API Calls
    ↓
Backend Controller (DashboardController)
    ↓
Use Cases & Repository (Backend)
    ↓
Database (Prisma ORM)
```

---

## 2. Frontend Architecture

### 2.1 Main Dashboard Page
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/routes/+page.svelte`

**Key Points:**
- Entry point for the dashboard
- Initializes `createEnhancedDashboardStore()` with API configuration
- Manages reactive data bindings using Svelte 5 `$state` and `$derived` runes
- Defines period options: `week`, `month`, `quarter`, `year`, `custom`
- Handles period navigation and type changes

**Event Handlers:**
- `handlePeriodChange()` - switches between period types
- `handlePeriodNavigation()` - moves between periods (past/future)
- `handlePeriodTypeChange()` - changes the period type
- `handleCustomDateRange()` - sets custom date ranges

**Current Behavior:**
- Period types are passed but no default is explicitly set at component level
- Default comes from the store initialization

### 2.2 Store: Enhanced Dashboard Store
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/presentation/stores/enhancedDashboardStore.svelte.ts`

**State Variables:**
```typescript
let selectedPeriodType = $state<PeriodType>('month');  // DEFAULT: MONTHLY
let periodOffset = $state(0);                           // Current period
let customStartDate = $state('');
let customEndDate = $state('');
let loading = $state(false);
let dashboardData = $state<DashboardData | null>(null);
let currentCurrency = $state('EUR');
let availablePeriods = $state<any[]>([]);
```

**KEY FINDING:** Line 22 shows `selectedPeriodType = $state<PeriodType>('month')` - **This is the default to change.**

**Methods:**
- `loadDashboardData()` - fetches data for current period
- `changePeriod(type)` - changes period type
- `navigatePeriod(offset)` - moves to past/future periods
- `getCurrentPeriodLabel()` - generates human-readable period label
- `initialize()` - called on store creation

**Data Loading Strategy (Lines 103-157):**
```typescript
if (selectedPeriodType === 'month') {
  // Loads: comparison, savings metrics, 12-month history
  const [comparisonData, savings, history] = await Promise.all([
    repository.getComparison(year, month),
    repository.getSavingsMetrics(year, month),
    repository.getHistory(12)  // Last 12 months
  ]);
} else if (selectedPeriodType === 'quarter') {
  historicalData = await repository.getQuarterlyHistory(8);
} else if (selectedPeriodType === 'year') {
  historicalData = await repository.getYearlyHistory(12);
}
```

**Chart Data Processing (Lines 135-157):**
- Converts historical data into `monthlyTrend` and `monthlyBarData` arrays
- Maps API response fields to chart-compatible format
- Handles different data structures from quarterly, yearly, and monthly endpoints

### 2.3 Period Value Object
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/domain/value-objects/Period.ts`

**Type Definition:**
```typescript
type PeriodType = 'week' | 'month' | 'quarter' | 'year' | 'custom';
```

**Key Methods:**
- `Period.create()` - factory method for creating periods
- `calculateDates()` - calculates start/end dates based on type and offset
- `generateLabel()` - creates human-readable labels

**Date Calculation Logic:**
- Handles month transitions and year boundaries correctly
- Applies offset for navigating past/future periods
- All dates set to full day boundaries (00:00:00 to 23:59:59)

### 2.4 Period Navigation Service
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/application/services/PeriodNavigationService.ts`

**Features:**
- Generates navigation options for each period type
- Returns last 12 months for monthly view
- Returns last 8 quarters for quarterly view
- Returns last 5 years for yearly view
- Returns last 12 weeks for weekly view

### 2.5 Period Navigation Component (CleanPeriodNav)
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/molecules/CleanPeriodNav.svelte`

**Features:**
- Left/right arrow buttons for navigation
- Dropdown menu showing:
  - Period type tabs (Mensual, Trimestral, Anual)
  - Period options for selected type
- Visual indicators for current selection and navigation limits

### 2.6 Chart Components

**FinancialChart.svelte** (Line Chart)
- Shows Income, Expenses, Balance trends
- Receives `data` array with `month`, `income`, `expenses`, `balance` properties
- Displays 12 data points for last 12 months

**FinancialBarCharts.svelte** (Bar Chart)
- Shows breakdown: Income, Essential, Discretionary, Debt, Investments
- Uses stacked bar visualization
- Also receives periodic data

**ChartSection.svelte**
- Wrapper component
- Displays title and subtitle
- Hosts the FinancialChart component

---

## 3. Backend Architecture

### 3.1 Dashboard API Endpoints
**File:** `/Users/alcibiades/Github/happy-balance/apps/backend/src/infrastructure/routes/dashboardRoutesV2.ts`

**Available Endpoints:**
1. `GET /dashboard/available-periods` - lists periods with data
2. `GET /dashboard/history?months=N` - gets N months of history
3. `GET /dashboard/year/:year` - metrics for a specific year
4. `GET /dashboard/month/:year/:month` - metrics for a specific month
5. `GET /dashboard/quarter/:year/:quarter` - metrics for a quarter
6. `GET /dashboard/enhanced/:year/:month` - enhanced month with categories
7. `GET /dashboard/current?type=month|quarter|year` - current period
8. `GET /dashboard/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` - custom range

### 3.2 Dashboard Query
**File:** `/Users/alcibiades/Github/happy-balance/apps/backend/src/application/queries/DashboardQuery.ts`

**Parameters:**
- `currency` - ISO code (default: EUR)
- `period` - week|month|quarter|year|custom
- `startDate`, `endDate` - for custom periods
- `includeInvestments` - boolean flag
- `periodOffset` - integer offset (0 = current, -1 = previous, etc.)

**Date Range Calculation:**
- Handles all period types with offset support
- Ensures dates don't exceed current date
- Properly handles month/quarter/year transitions

---

## 4. Data Fetching Strategy

### 4.1 Repository: ModernApiDashboardRepository
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/infrastructure/adapters/ModernApiDashboardRepository.ts`

**Key Methods:**

#### getDashboardData(period, currency)
- Builds appropriate URL based on period type
- Fetches data from `/dashboard/enhanced/:year/:month` for months
- Maps API response to domain model

#### getHistory(months)
- Fetches last N months of data
- Used for trend analysis
- Returns array of monthly summaries

#### getQuarterlyHistory(quarters)
- Fetches last N quarters
- Makes parallel requests for each quarter
- Aggregates and sorts results

#### getYearlyHistory(years)
- Fetches last N years
- Makes parallel requests for each year
- Used for year-over-year analysis

#### Data Mapping:
- Converts API responses to `DashboardData` domain model
- Extracts categories, trends, expense distribution
- Generates bar chart data from trend data

---

## 5. State Management Details

### 5.1 Period Selection Flow
```
User selects period type (month/quarter/year)
    ↓
changePeriod(type) in store
    ↓
Set selectedPeriodType = type
Set periodOffset = 0 (reset to current)
    ↓
loadDashboardData()
    ↓
Create Period object via Period.create()
    ↓
Fetch data based on period type
    ↓
Update dashboardData, trends, categories
    ↓
Components react to $derived values
```

### 5.2 Navigation Offset Handling
- `periodOffset = 0` means current period
- `periodOffset = -1` means previous period
- `periodOffset = 1` would mean future (limited)
- Limits enforced:
  - Monthly: ±24 months (2 years)
  - Quarterly: ±8 quarters (2 years)
  - Yearly: ±5 years
  - Weekly: ±52 weeks (1 year)

### 5.3 Chart Data Update
When period changes:
1. `loadDashboardData()` fetches new data
2. `monthlyTrend` is updated with historical data
3. `monthlyBarData` is generated from trends
4. Charts react to `$derived` changes
5. Chart.js instances update via `updateChart()`

---

## 6. Current BI Features (Already Implemented)

### 6.1 Trend Analysis
- **File:** `Trend.ts`
- Calculates percentage change between periods
- Supports direction indicators (up/down/stable)
- Color coding based on type (income/expenses/investments)

### 6.2 Multi-Period Historical Data
- Monthly view loads 12 months of history
- Quarterly view loads 8 quarters
- Yearly view loads up to 12 years
- Allows trend visualization over time

### 6.3 Period Comparison
- Backend provides comparison with previous period
- Savings metrics tracked
- Category breakdown with budgets

### 6.4 Expense Distribution
- Breaks down into: essential, discretionary, debt payments
- Shows percentages
- Can be empty if no real data (falls back to estimates)

### 6.5 Category Analysis
- Per-category percentage of total expenses
- Monthly budget tracking
- Budget usage metrics
- Color and icon support

---

## 7. What Needs to be Changed

### 7.1 Change Default Period to Annual (HIGHEST IMPACT)

**Location:** `enhancedDashboardStore.svelte.ts`, line 22

**Current:**
```typescript
let selectedPeriodType = $state<PeriodType>('month');
```

**Change to:**
```typescript
let selectedPeriodType = $state<PeriodType>('year');
```

**Affected Behavior:**
- Dashboard loads with annual view
- Charts show yearly data (12 years or aggregated to year level)
- Period navigation uses yearly boundaries
- `CleanPeriodNav` shows "Anual" as default tab

**Files Impacted:**
- `enhancedDashboardStore.svelte.ts`
- `+page.svelte` (may need to update initial period display)

### 7.2 Implement 12-Month Rolling Charts (MEDIUM COMPLEXITY)

**Current Behavior:**
- Monthly view: shows last 12 months
- Annual view: shows yearly aggregates (12 years)

**Desired Behavior:**
- Show last 12 months of data regardless of view
- Option to aggregate by period or show raw monthly data

**Implementation Options:**

**Option A: Always load 12-month history for charts**
```typescript
// In loadDashboardData, modify:
if (selectedPeriodType === 'year') {
  // Instead of yearly history, load monthly history
  const history = await repository.getHistory(12); // Last 12 months
  historicalData = history;
}
```

**Option B: New service for rolling data**
- Create `RollingMetricsService` 
- Always maintains 12-month window
- Updates on period selection

**Recommended:** Option A - simpler, uses existing API

### 7.3 Enhanced BI Features to Add

**7.3.1 Year-over-Year Comparison**
```typescript
// New method in store:
async function getYearOverYearData() {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;
  
  const current = await repository.getYearSummary(currentYear);
  const previous = await repository.getYearSummary(previousYear);
  
  return {
    current,
    previous,
    changePercent: ((current - previous) / previous) * 100
  };
}
```

**7.3.2 Trend Line Analysis**
```typescript
// Calculate moving averages, growth rates
function calculateMovingAverage(data: number[], period: number = 3) {
  return data.map((_, i) => {
    if (i < period - 1) return null;
    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    return sum / period;
  });
}
```

**7.3.3 Volatility Analysis**
```typescript
function calculateStandardDeviation(data: number[]) {
  const mean = data.reduce((a, b) => a + b) / data.length;
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2)) / data.length;
  return Math.sqrt(variance);
}
```

**7.3.4 Budget vs Actual Variance**
```typescript
// Categories already have budget data
// Calculate: actual spend vs budget, % variance
// Color code: red if over, green if under
```

**7.3.5 Seasonal Decomposition**
```typescript
// Identify seasonal patterns by comparing same months across years
function getSeasonalPatterns(monthlyData: any[]) {
  const byMonth: { [key: number]: number[] } = {};
  monthlyData.forEach(m => {
    const month = new Date(m.date).getMonth();
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(m.value);
  });
  
  return Object.entries(byMonth).map(([m, values]) => ({
    month: parseInt(m),
    average: values.reduce((a, b) => a + b) / values.length,
    volatility: standardDeviation(values)
  }));
}
```

---

## 8. BI Best Practices Currently Missing

### 8.1 Data Quality & Completeness
- **Missing:** Validation for data completeness
- **Add:** Check if all periods have data, flag gaps
- **Implementation:** `DataQualityValidator` service

### 8.2 Statistical Significance
- **Missing:** Confidence intervals on trends
- **Add:** Show when changes are statistically significant vs noise
- **Implementation:** Calculate Z-scores on percentage changes

### 8.3 Forecasting
- **Missing:** Predictive analytics
- **Add:** Simple linear regression for next 3-6 months
- **Implementation:** Use `regression-js` library or simple algorithm

### 8.4 Benchmarking
- **Missing:** Target/benchmark comparisons
- **Add:** Compare against user's own history or categories
- **Implementation:** New endpoint: `/dashboard/benchmarks`

### 8.5 Drill-Down Capability
- **Missing:** Click charts to see underlying transactions
- **Add:** Navigate from aggregate to transaction level
- **Implementation:** New modal component with transaction list

### 8.6 Real-Time Alerts
- **Missing:** Notifications on budget overruns
- **Add:** Toast/badge when spending exceeds thresholds
- **Implementation:** New `BudgetAlertService`

### 8.7 Data Aggregation Levels
- **Missing:** Flexible time-based aggregation
- **Add:** Choose between daily/weekly/monthly data points
- **Implementation:** `DataAggregationService` with configurable granularity

---

## 9. Architecture Strengths

1. **Clean Separation of Concerns**
   - Domain layer: Period, Trend, DashboardMetrics value objects
   - Application layer: Use cases, services
   - Infrastructure layer: Repository, API client
   - Presentation layer: Components, stores

2. **Reactive Data Binding**
   - Svelte 5 runes (`$state`, `$derived`) for efficient updates
   - No manual subscription management
   - Derived values automatically recalculate

3. **Domain-Driven Design**
   - Rich domain models (Trend, Period, Money)
   - Value objects immutable and frozen
   - Clear business logic in domain entities

4. **Flexible Period System**
   - Supports multiple period types
   - Offset-based navigation
   - Custom date ranges
   - Clear label generation

5. **Type Safety**
   - Full TypeScript throughout
   - Strong typing for API responses
   - Validation schemas in backend (Zod)

---

## 10. Implementation Roadmap

### Phase 1: Default Change (1 hour)
- [ ] Change `selectedPeriodType` default from 'month' to 'year'
- [ ] Test period navigation at year level
- [ ] Verify charts display correctly

### Phase 2: 12-Month Rolling Charts (2 hours)
- [ ] Modify store to load 12-month history for all periods
- [ ] Update chart components to display 12 months
- [ ] Add visual indicator for rolling window

### Phase 3: Core BI Features (4-6 hours)
- [ ] Implement year-over-year comparison
- [ ] Add moving average trend line
- [ ] Create budget variance analysis
- [ ] Build seasonal pattern detector

### Phase 4: Advanced BI (8-10 hours)
- [ ] Add forecasting capability
- [ ] Implement statistical significance testing
- [ ] Create data quality dashboard
- [ ] Build drill-down functionality

### Phase 5: Polish & Documentation (2-4 hours)
- [ ] Add BI metrics explanations
- [ ] Create help tooltips
- [ ] Document new features
- [ ] Add unit tests for new services

---

## 11. Code Snippets for Quick Reference

### Change Default Period
```typescript
// File: enhancedDashboardStore.svelte.ts, line 22
// BEFORE:
let selectedPeriodType = $state<PeriodType>('month');

// AFTER:
let selectedPeriodType = $state<PeriodType>('year');
```

### Load 12-Month Data for All Views
```typescript
// File: enhancedDashboardStore.svelte.ts, loadDashboardData() method
// Around line 103, modify the data loading:

if (selectedPeriodType === 'month' || selectedPeriodType === 'year') {
  // For both monthly and yearly views, load 12-month history
  const [comparisonData, savings, history] = await Promise.all([
    repository.getComparison(year, month),
    repository.getSavingsMetrics(year, month),
    repository.getHistory(12)  // Always 12 months
  ]);
  historicalData = history;
  loadHistoricalData = true;
} else if (selectedPeriodType === 'quarter') {
  historicalData = await repository.getQuarterlyHistory(8);
  loadHistoricalData = true;
}
```

### Add Trend Analysis Service
```typescript
// New file: TrendAnalysisService.ts
export class TrendAnalysisService {
  calculateMovingAverage(data: number[], period: number = 3): number[] {
    return data.map((_, i) => {
      if (i < period - 1) return 0;
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      return sum / period;
    });
  }

  calculateStandardDeviation(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
  }

  detectSeasons(monthlyData: any[]): Map<number, number> {
    const seasonalIndexes = new Map<number, number>();
    const monthlyAverages = new Map<number, number[]>();

    monthlyData.forEach(m => {
      const month = new Date(m.month).getMonth();
      if (!monthlyAverages.has(month)) monthlyAverages.set(month, []);
      monthlyAverages.get(month)!.push(m.expenses);
    });

    const grandAverage = monthlyData.reduce((a, b) => a + b.expenses, 0) / monthlyData.length;
    
    monthlyAverages.forEach((values, month) => {
      const monthAverage = values.reduce((a, b) => a + b) / values.length;
      seasonalIndexes.set(month, monthAverage / grandAverage);
    });

    return seasonalIndexes;
  }
}
```

---

## 12. Files to Modify

### Priority 1 (Required for default change)
1. `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/dashboard/presentation/stores/enhancedDashboardStore.svelte.ts`
   - Line 22: Change default period to 'year'

### Priority 2 (For 12-month rolling charts)
1. `enhancedDashboardStore.svelte.ts`
   - Lines 103-157: Modify data loading logic
2. `FinancialChart.svelte` (optional - add year labels)
3. `CleanPeriodNav.svelte` (optional - update default display)

### Priority 3 (For BI features)
1. New: `TrendAnalysisService.ts`
2. New: `BudgetVarianceService.ts`
3. New: `SeasonalAnalysisService.ts`
4. New: `ForecastingService.ts` (optional)
5. Update: `enhancedDashboardStore.svelte.ts` (add new methods)
6. New Components: Year-over-year comparison, seasonal heatmap, etc.

---

## 13. Testing Considerations

### Unit Tests Needed
- Period calculation with offsets
- Trend calculations
- Data aggregation logic
- Moving average calculations
- Standard deviation
- Seasonal index calculations

### Integration Tests Needed
- Full data flow: Component → Store → Repository → API
- Period changes trigger correct API calls
- Chart data correctly mapped from API responses
- Multiple period type switches in sequence

### E2E Tests (Playwright)
- Switch from monthly to annual view
- Verify charts update correctly
- Navigate between periods
- Verify 12-month rolling window maintained

---

## 14. Performance Considerations

### Current
- Each period change triggers complete reload
- No caching of historical data
- Each chart re-renders on any store update

### Recommendations
1. **Implement caching:**
   ```typescript
   class CachedRepository {
     private cache = new Map<string, DashboardData>();
     
     async getDashboardData(period: Period, currency: string) {
       const key = `${period.getType()}-${period.getOffset()}-${currency}`;
       if (this.cache.has(key)) return this.cache.get(key)!;
       
       const data = await this.repository.getDashboardData(period, currency);
       this.cache.set(key, data);
       return data;
     }
   }
   ```

2. **Lazy load chart data:**
   - Load summary immediately
   - Load detailed chart data in background

3. **Memoize derived calculations:**
   - Cache trend calculations
   - Cache seasonal patterns

---

## Summary

The Happy Balance Dashboard has a solid, well-organized architecture following domain-driven design principles. The default period can be easily changed from monthly to annual with a single line modification. The 12-month rolling chart feature is achievable by adjusting the data loading strategy in the store.

Most BI best practices can be added through new services without requiring changes to the core architecture, maintaining the clean separation of concerns and making the codebase more maintainable.

**Key Insight:** The store's reactive nature means that once you change the default period type and data loading logic, all components automatically adapt through Svelte's `$derived` mechanism - no manual wiring needed.

