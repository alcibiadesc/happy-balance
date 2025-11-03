# Search Implementation - Quick Reference

## Key Files Location Map

```
happy-balance/
├── apps/frontend/
│   └── src/
│       ├── lib/
│       │   ├── modules/transactions/
│       │   │   └── application/services/
│       │   │       └── FilterService.ts ⭐ MAIN FRONTEND SEARCH
│       │   └── components/
│       │       ├── molecules/
│       │       │   └── SearchBar.svelte (UI only)
│       │       └── organisms/
│       │           ├── FiltersPanel.svelte (category filters)
│       │           └── CategorySelectionModal.svelte ⭐ CATEGORY SEARCH
│       └── routes/transactions/
│           └── +page.svelte (integrates search)
│
└── apps/backend/
    └── src/
        ├── infrastructure/
        │   └── repositories/
        │       └── PrismaTransactionRepository.ts ⭐ MAIN BACKEND SEARCH
        ├── application/
        │   └── queries/
        │       └── TransactionListQuery.ts (query parameters)
        └── domain/
            └── repositories/
                └── ITransactionRepository.ts (interface)
```

---

## Frontend Search Flow

### Entry Point: SearchBar Component
```
User Input → SearchBar.svelte
    ↓
    onInput event
    ↓
    setSearchQuery() in FilterService.ts
    ↓
    FilterState.searchQuery updated
    ↓
    filterTransactions() called
    ↓
    matchesSearch() for each transaction
    ↓
    Filtered results displayed
```

### Search Function Location
```typescript
// File: FilterService.ts (Line 31-51)
const matchesSearch = (transaction: Transaction, query: string): boolean => {
  // ⚠️ Currently NOT accent-insensitive
  const lowerQuery = query.toLowerCase();
  
  // Searches merchant AND description fields
  return (
    transaction.merchant.toLowerCase().includes(lowerQuery) ||
    transaction.description.toLowerCase().includes(lowerQuery)
  );
};
```

---

## Backend Search Flow

### Entry Point: API Request
```
API Request with searchTerm
    ↓
    TransactionListQuery created
    ↓
    PrismaTransactionRepository.findWithFilters()
    ↓
    buildWhereClause() constructs WHERE clause
    ↓
    Prisma queries PostgreSQL
    ↓
    Results returned
```

### Search Implementation Location
```typescript
// File: PrismaTransactionRepository.ts (Line 699-736)
if (filters.merchantName && filters.merchantName.trim()) {
  const searchTerm = filters.merchantName.trim();
  
  if (searchTerm.length <= 3) {
    // Use startsWith for short terms (more precise)
    where.OR = [
      { merchant: { startsWith: searchTerm, mode: "insensitive" } },
      { description: { startsWith: searchTerm, mode: "insensitive" } }
    ];
  } else {
    // Use contains for longer terms (broader match)
    where.OR = [
      { merchant: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } }
    ];
  }
}
```

---

## Category Search Implementation

### CategorySelectionModal.svelte (Line 60+)
```typescript
// Current implementation
searchTerm === '' ||
cat.name.toLowerCase().includes(searchTerm.toLowerCase())

// Issue: NOT accent-insensitive
// Examples that FAIL:
// - "Café" searchTerm won't match category named "Café"
// - "Senor" searchTerm won't match category named "Señor"
```

---

## How to Make Search Accent-Insensitive

### Quick Solution (Frontend)
```typescript
// Add this utility function
const normalizeForSearch = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')                          // Decompose accents
    .replace(/[\u0300-\u036f]/g, '');         // Remove diacritics
};

// Update matchesSearch():
const lowerQuery = normalizeForSearch(query);
const textMatch =
  normalizeForSearch(transaction.merchant).includes(lowerQuery) ||
  normalizeForSearch(transaction.description).includes(lowerQuery);
```

### Update CategorySelectionModal Search:
```typescript
const normalizedSearchTerm = normalizeForSearch(searchTerm);
const isSearched = 
  searchTerm === '' ||
  normalizeForSearch(cat.name).includes(normalizedSearchTerm);
```

---

## Testing Search Functionality

### Frontend Test Cases
```
Input: "Café"
- Should find merchant "Café" ✓ (currently works)
- Should find merchant "cafe" ✗ (currently fails)

Input: "Señor"
- Should find description with "Señor" ✓ (currently works)
- Should find description with "senor" ✗ (currently fails)

Input: "100"
- Should find transaction with amount 100 ✓ (works)
```

### Backend Test Cases (via API)
```
GET /transactions?searchTerm=cafe
- Should find merchant "Café" ✗ (currently fails)
- Should find merchant "cafe" ✓ (currently works)

GET /transactions?searchTerm=Señor
- Should find merchant "Señor" ✗ (currently fails)
- Should find merchant "senor" ✓ (currently works)
```

---

## Related Search Methods

### PrismaTransactionRepository.ts
1. **findByMerchant()** (Line 219)
   - Wraps findWithFilters() with merchantName filter
   - Also NOT accent-insensitive

2. **findByPattern()** (Line 786)
   - Used for duplicate detection
   - Searches merchant AND description
   - Uses mode: "insensitive" (case only)

3. **findPotentialDuplicates()** (Line 446)
   - Uses merchant field contains filter
   - Also NOT accent-insensitive

---

## Configuration Notes

### Current Database Search Setup
- Database: PostgreSQL (via Prisma)
- Search Mode: Case-insensitive via Prisma `mode: "insensitive"`
- Collation: PostgreSQL default (C locale or UTF-8)
- Status: Searches are NOT accent-insensitive

### To Enable Accent-Insensitive Search at DB Level
Would require:
```sql
CREATE INDEX idx_merchant_unaccent 
ON transaction USING GIN (unaccent(merchant) gin_trgm_ops);

-- Or use collation:
ALTER TABLE transaction 
  ALTER COLUMN merchant TYPE VARCHAR COLLATE "en-u-kn-true";
```

---

## Implementation Checklist

- [ ] Add normalizeForSearch() utility function
- [ ] Update FilterService.ts matchesSearch()
- [ ] Update CategorySelectionModal.svelte search logic
- [ ] Test with accented characters (é, ñ, ü, etc.)
- [ ] Consider backend implementation (optional if frontend only needed)
- [ ] Update database collation (optional, for consistency)
- [ ] Add test cases for accent-insensitive search

