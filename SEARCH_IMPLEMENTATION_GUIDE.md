# Search & Filter Functionality Implementation Summary

## Overview
The Happy Balance application implements search and filtering across two main areas:
1. **Transactions Search** - Searching for transactions by merchant name, description, and amount
2. **Categories Search** - Searching for categories by name in the category selection modal

---

## Frontend Search Implementation

### 1. Transaction Search Service
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/modules/transactions/application/services/FilterService.ts`

#### Search Function: `matchesSearch()`
- **Line:** 31-51
- **Current Implementation:**
  ```typescript
  const matchesSearch = (transaction: Transaction, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const numericQuery = parseFloat(query);
    const isNumeric = !isNaN(numericQuery) && isFinite(numericQuery);

    // Text-based search (case-insensitive)
    const textMatch =
      transaction.merchant.toLowerCase().includes(lowerQuery) ||
      transaction.description.toLowerCase().includes(lowerQuery);

    // Amount-based search
    if (isNumeric) {
      const transactionAmount = Math.abs(transaction.amount);
      const amountMatch =
        Math.abs(transactionAmount - numericQuery) < 0.01 ||
        transactionAmount.toString().includes(numericQuery.toString());
      return textMatch || amountMatch;
    }

    return textMatch;
  };
  ```

- **Current Behavior:**
  - Case-insensitive search (uses `.toLowerCase()`)
  - **NOT accent-insensitive** - accents are NOT normalized
  - Searches both merchant and description fields
  - Supports numeric amount searching

#### Filter State Integration
- **Line:** 3-29
- **searchQuery** property stores the search term in FilterState
- **setSearchQuery** action updates the search query (line 122-125)
- Search filter is applied in **filterTransactions()** function (line 108)

### 2. Search Bar Component
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/molecules/SearchBar.svelte`

- Simple UI component that captures input and passes it via `onInput` callback
- Displays search icon and clear button
- No filtering logic here - just UI

### 3. Filters Panel Component
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/organisms/FiltersPanel.svelte`

- Manages category filters with bento-box layout
- Has a category dropdown (line 91-131) that displays category names
- No search functionality in this component itself

### 4. Category Selection Modal Search
**File:** `/Users/alcibiades/Github/happy-balance/apps/frontend/src/lib/components/organisms/CategorySelectionModal.svelte`

#### Search Implementation
- **Line:** 15 - `searchTerm` variable holds the search input
- **Search Logic:** Filters categories by name (case-insensitive only)
  ```typescript
  // Group categories by type and filter by search term
  searchTerm === '' ||
  cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  ```
- **Current Behavior:**
  - Case-insensitive search on category names
  - **NOT accent-insensitive**
  - No numeric or description search for categories

---

## Backend Search Implementation

### Transaction Repository Search
**File:** `/Users/alcibiades/Github/happy-balance/apps/backend/src/infrastructure/repositories/PrismaTransactionRepository.ts`

#### buildWhereClause() Method
- **Line:** 665-758
- **Search Implementation (Line 699-736):**

```typescript
// Merchant name filter - enhanced to search both merchant and description
if (filters.merchantName && filters.merchantName.trim()) {
  const searchTerm = filters.merchantName.trim();

  if (searchTerm.length <= 3) {
    // For short terms, use OR condition with startsWith for both fields
    where.OR = [
      {
        merchant: {
          startsWith: searchTerm,
          mode: "insensitive",  // Prisma case-insensitive mode
        },
      },
      {
        description: {
          startsWith: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  } else {
    // For longer terms, use OR condition with contains for both fields
    where.OR = [
      {
        merchant: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: "insensitive",
        },
      },
    ];
  }
}
```

#### Additional Search Methods
1. **findByMerchant()** (Line 219-228)
   - Uses `merchantName` filter through `findWithFilters()`

2. **findByPattern()** (Line 786-815)
   - Searches merchant and description fields
   - Uses `mode: "insensitive"`
   - Can be used for duplicate detection

3. **findPotentialDuplicates()** (Line 446-491)
   - Uses merchant field with `contains: "..." mode: "insensitive"`

#### Backend Search Features
- **Case-insensitive** via Prisma's `mode: "insensitive"` parameter
- **NOT accent-insensitive** - PostgreSQL's case-insensitive mode still respects accents
- Smart length-based strategy:
  - ≤3 characters: Uses `startsWith`
  - >3 characters: Uses `contains`
- Searches both merchant and description fields

---

## Data Flow

### Frontend to Backend
1. User types in SearchBar component
2. Query stored in FilterState.searchQuery
3. Frontend applies matchesSearch() filter locally
4. No backend search API call (filtering is client-side only)

### Backend Only (if called directly)
1. API receives `searchTerm` parameter in TransactionListQuery
2. PrismaTransactionRepository.findWithFilters() is called
3. buildWhereClause() constructs Prisma where clause
4. Database returns filtered results

---

## Key Findings - Current Limitations

### Frontend Search
- **Case-insensitive:** YES ✓
- **Accent-insensitive:** NO ✗
  - Example: "Café" would NOT match "cafe"
  - Example: "Señor" would NOT match "senor"

### Backend Search
- **Case-insensitive:** YES ✓
- **Accent-insensitive:** NO ✗
  - Prisma's `mode: "insensitive"` only handles case, not accents
  - PostgreSQL default collation varies by configuration
  - Would need explicit accent-insensitive collation or normalization

### Category Search
- **Case-insensitive:** YES ✓
- **Accent-insensitive:** NO ✗

---

## Files to Modify for Case/Accent Insensitivity

### Frontend Changes
1. **FilterService.ts** (Line 31-51)
   - Update `matchesSearch()` function
   - Add accent normalization using `String.prototype.normalize()`

2. **CategorySelectionModal.svelte** (Line 60+)
   - Update category filter logic
   - Add accent normalization

### Backend Changes
1. **PrismaTransactionRepository.ts** (Line 699-736)
   - Update buildWhereClause() method
   - Option A: Use PostgreSQL accent-insensitive search (requires proper collation)
   - Option B: Normalize search terms before comparison
   - Option C: Use full-text search with proper configuration

---

## Solution Recommendations

### Option 1: Client-Side Normalization (Easiest)
Use JavaScript's `String.prototype.normalize()`:
```typescript
const normalizeString = (str: string): string => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};

// Then use:
transaction.merchant.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
```

### Option 2: Backend PostgreSQL Collation
Use PostgreSQL accent-insensitive collation:
```sql
-- In migration, add index or column with proper collation
CREATE INDEX idx_merchant_accent_insensitive 
ON transaction(merchant COLLATE "en-u-kn-true");
```

### Option 3: Hybrid Approach
- Frontend: Use normalized search for better UX
- Backend: Apply same normalization for consistency

---

## Summary Table

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| Case-insensitive | YES | YES | ✓ Works |
| Accent-insensitive | NO | NO | ✗ Needs Fix |
| Merchant search | YES | YES | ✓ Works |
| Description search | YES | YES | ✓ Works |
| Category name search | YES | N/A | ✓ Works (UI only) |
| Amount search | YES | YES | ✓ Works |
| Short-term optimization (≤3 chars) | NO | YES | ✓ Backend only |

