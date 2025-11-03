# Ready-to-Use Code: Make Search Accent-Insensitive

## 1. Create Utility Function File

### File: `apps/frontend/src/lib/utils/stringNormalization.ts`

```typescript
/**
 * Normalize strings for accent-insensitive search
 * Converts accented characters to their base form (é → e, ñ → n, etc.)
 */
export const normalizeForSearch = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')                    // Decompose characters with diacritics
    .replace(/[\u0300-\u036f]/g, '')    // Remove all diacritical marks
    .trim();
};

/**
 * Check if a text matches a search query with accent-insensitive matching
 */
export const matchesSearchTerm = (text: string, query: string): boolean => {
  if (!query.trim()) return true;
  return normalizeForSearch(text).includes(normalizeForSearch(query));
};

/**
 * Filter array of strings by search term (accent-insensitive)
 */
export const filterBySearchTerm = (items: string[], searchTerm: string): string[] => {
  if (!searchTerm.trim()) return items;
  const normalized = normalizeForSearch(searchTerm);
  return items.filter(item => normalizeForSearch(item).includes(normalized));
};
```

---

## 2. Update FilterService.ts

### File: `apps/frontend/src/lib/modules/transactions/application/services/FilterService.ts`

Replace the `matchesSearch` function (lines 31-51) with:

```typescript
import { normalizeForSearch } from '$lib/utils/stringNormalization';

// ... existing imports ...

const matchesSearch = (transaction: Transaction, query: string): boolean => {
  if (!query.trim()) return true;
  
  const normalizedQuery = normalizeForSearch(query);
  const numericQuery = parseFloat(query);
  const isNumeric = !isNaN(numericQuery) && isFinite(numericQuery);

  // Text-based search (case-insensitive AND accent-insensitive)
  const textMatch =
    normalizeForSearch(transaction.merchant).includes(normalizedQuery) ||
    normalizeForSearch(transaction.description).includes(normalizedQuery);

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

---

## 3. Update CategorySelectionModal.svelte

### File: `apps/frontend/src/lib/components/organisms/CategorySelectionModal.svelte`

Replace the category filter logic (around line 60-70):

```svelte
<script lang="ts">
  import { normalizeForSearch } from '$lib/utils/stringNormalization';
  // ... existing imports ...

  let searchTerm = '';
  let searchInput: HTMLInputElement;

  // ... existing code ...

  // Group categories by type and filter by search term
  const filteredCategories = $derived(
    categories.filter(cat => {
      if (!searchTerm.trim()) return true;
      return (
        normalizeForSearch(cat.name).includes(
          normalizeForSearch(searchTerm)
        )
      );
    })
  );
</script>

<!-- In the template, use filteredCategories instead of categories: -->
{#each filteredCategories as category}
  <!-- category rendering code -->
{/each}
```

---

## 4. Update Backend (Optional but Recommended)

### File: `apps/backend/src/infrastructure/repositories/PrismaTransactionRepository.ts`

Add utility function at the top:

```typescript
/**
 * Normalize string for accent-insensitive search
 * Matches frontend implementation for consistency
 */
private normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
```

Update buildWhereClause method (lines 699-736):

```typescript
// Merchant name filter - enhanced to search both merchant and description
if (filters.merchantName && filters.merchantName.trim()) {
  const searchTerm = this.normalizeForSearch(filters.merchantName.trim());

  if (searchTerm.length <= 3) {
    // For short terms, use OR condition with startsWith for both fields
    where.OR = [
      {
        merchant: {
          // Use normalized search - PostgreSQL doesn't do this automatically
          // This requires the frontend/application layer to normalize
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

**Alternative Backend Approach** - Use PostgreSQL's `unaccent` extension:

```typescript
// This requires PostgreSQL unaccent extension to be enabled
// Advanced approach - only if above simple approach doesn't work well

// You would need:
// 1. Enable extension: CREATE EXTENSION unaccent;
// 2. Use raw Prisma query:
await this.prisma.$queryRaw`
  SELECT * FROM transaction 
  WHERE unaccent(merchant) ILIKE unaccent(${searchTerm})
`;
```

---

## 5. Testing Implementation

### Create test file: `apps/frontend/src/lib/utils/stringNormalization.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeForSearch, matchesSearchTerm, filterBySearchTerm } from './stringNormalization';

describe('stringNormalization', () => {
  describe('normalizeForSearch', () => {
    it('should convert to lowercase', () => {
      expect(normalizeForSearch('CAFÉ')).toBe('cafe');
    });

    it('should remove accents from Spanish characters', () => {
      expect(normalizeForSearch('Señor')).toBe('senor');
      expect(normalizeForSearch('mañana')).toBe('manana');
    });

    it('should remove accents from French characters', () => {
      expect(normalizeForSearch('Café')).toBe('cafe');
      expect(normalizeForSearch('résumé')).toBe('resume');
    });

    it('should remove accents from Portuguese characters', () => {
      expect(normalizeForSearch('São Paulo')).toBe('sao paulo');
      expect(normalizeForSearch('açúcar')).toBe('acucar');
    });

    it('should trim whitespace', () => {
      expect(normalizeForSearch('  café  ')).toBe('cafe');
    });

    it('should handle mixed content', () => {
      expect(normalizeForSearch('Panamá, Inc.')).toBe('panama, inc.');
    });
  });

  describe('matchesSearchTerm', () => {
    it('should match exact case-insensitive text', () => {
      expect(matchesSearchTerm('Café', 'cafe')).toBe(true);
      expect(matchesSearchTerm('Café', 'CAFE')).toBe(true);
    });

    it('should match with accents when normalized', () => {
      expect(matchesSearchTerm('Café', 'café')).toBe(true);
      expect(matchesSearchTerm('café', 'CAFE')).toBe(true);
    });

    it('should match partial strings', () => {
      expect(matchesSearchTerm('Señor García', 'senor')).toBe(true);
      expect(matchesSearchTerm('Señor García', 'garcia')).toBe(true);
    });

    it('should return true for empty query', () => {
      expect(matchesSearchTerm('anything', '')).toBe(true);
      expect(matchesSearchTerm('anything', '   ')).toBe(true);
    });

    it('should return false for non-matching query', () => {
      expect(matchesSearchTerm('café', 'pizza')).toBe(false);
    });
  });

  describe('filterBySearchTerm', () => {
    const items = ['Café', 'Restaurant', 'Panamá', 'Pizza'];

    it('should filter items by search term', () => {
      const result = filterBySearchTerm(items, 'cafe');
      expect(result).toEqual(['Café']);
    });

    it('should handle accent-insensitive filtering', () => {
      const result = filterBySearchTerm(items, 'panama');
      expect(result).toEqual(['Panamá']);
    });

    it('should return all items for empty query', () => {
      const result = filterBySearchTerm(items, '');
      expect(result).toEqual(items);
    });

    it('should be case-insensitive', () => {
      const result = filterBySearchTerm(items, 'RESTAURANT');
      expect(result).toEqual(['Restaurant']);
    });
  });
});
```

### Run tests:
```bash
npm run test -- stringNormalization.test.ts
```

---

## 6. Example Usage in Components

### Example 1: In a transaction list filter

```typescript
import { normalizeForSearch } from '$lib/utils/stringNormalization';

// Filter transactions by search term
const filteredTransactions = $derived(
  transactions.filter(tx => {
    const normalizedSearch = normalizeForSearch(searchQuery);
    return (
      normalizeForSearch(tx.merchant).includes(normalizedSearch) ||
      normalizeForSearch(tx.description).includes(normalizedSearch)
    );
  })
);
```

### Example 2: In a category selector

```typescript
import { filterBySearchTerm } from '$lib/utils/stringNormalization';

const filteredCategories = $derived(
  filterBySearchTerm(
    categories.map(c => c.name),
    searchTerm
  ).map(name => categories.find(c => c.name === name))
);
```

---

## 7. Migration Guide

### Step 1: Create the utility file
```bash
touch apps/frontend/src/lib/utils/stringNormalization.ts
```

### Step 2: Copy utility code into the file

### Step 3: Update FilterService.ts
- Add import statement
- Replace matchesSearch function

### Step 4: Update CategorySelectionModal.svelte
- Add import statement
- Update filter logic

### Step 5: Test in browser
- Search for: "café", "señor", "panamá", "résumé"
- Verify that case and accent-insensitive matching works

### Step 6: (Optional) Update backend
- Add normalization utility
- Update buildWhereClause method

### Step 7: Run tests
```bash
npm run test
```

---

## 8. Known Limitations & Edge Cases

### What This Solution Handles
- Basic Latin characters with accents (é, ñ, ü, etc.)
- Case-insensitive matching
- Partial string matching
- Trailing/leading whitespace

### What This Solution Does NOT Handle
- Characters from other scripts (Chinese, Arabic, Greek, etc.)
- Ligatures (ﬁ, ﬂ, ß → ss, etc.)
- Complex combining characters
- Performance optimization for very large datasets (would need indexing)

### Performance Considerations
- For typical transaction lists (< 10,000 items), performance is excellent
- For larger datasets, consider:
  - Debouncing search input (already done in typical implementation)
  - Server-side filtering for large result sets
  - Database full-text search indices

---

## 9. Browser Compatibility

The solution uses `String.prototype.normalize()`, which is supported in:
- Chrome 34+
- Firefox 29+
- Safari 11+
- Edge (all versions)
- Mobile browsers (all modern versions)

For older browser support, you can use a polyfill or alternative approach.

---

## 10. References

- [Unicode Normalization in JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
- [Prisma Case-Insensitive Search](https://www.prisma.io/docs/concepts/components/prisma-client/filtering#case-insensitive-filtering)
- [PostgreSQL Full Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [JavaScript String Normalization](https://github.com/lodash/lodash/blob/main/deburr.js)

