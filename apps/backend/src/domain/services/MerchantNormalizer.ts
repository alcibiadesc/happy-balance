/**
 * MerchantNormalizer - Intelligent merchant name normalization
 *
 * This service transforms raw merchant strings from bank statements into
 * clean, canonical names for better categorization matching.
 *
 * Examples:
 *   "UBER *EATS NYC 0123ABC" → "uber eats"
 *   "TST* STARBUCKS #1234"   → "starbucks"
 *   "AMZN MKTP US*2F3K4L"    → "amazon"
 *   "SQ *COFFEE SHOP"        → "coffee shop"
 */

export interface NormalizationResult {
  /** Original merchant string */
  original: string;
  /** Normalized/cleaned merchant name (lowercase) */
  normalized: string;
  /** Canonical name if known, otherwise same as normalized */
  canonical: string;
  /** Confidence score for the normalization (0-1) */
  confidence: number;
  /** Tokens extracted for pattern matching */
  tokens: string[];
  /** Detected payment processor prefix if any */
  detectedProcessor?: string;
}

// Known brand patterns that use asterisk notation - these get special handling
// Pattern: BRAND *SERVICE or BRAND* SERVICE
const BRAND_PATTERNS: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /^uber\s*\*?\s*eats?\b/i, canonical: 'uber eats' },
  { pattern: /^uber\s*\*?\s*trip/i, canonical: 'uber' },
  { pattern: /^uber\s*\*/i, canonical: 'uber' },
  { pattern: /^lyft\s*\*/i, canonical: 'lyft' },
  { pattern: /^doordash\s*\*/i, canonical: 'doordash' },
  { pattern: /^grubhub\s*\*/i, canonical: 'grubhub' },
  { pattern: /^postmates\s*\*/i, canonical: 'postmates' },
  { pattern: /^instacart\s*\*/i, canonical: 'instacart' },
  { pattern: /^amzn\s*(mktp|prime|digital)/i, canonical: 'amazon' },
  { pattern: /^amazon\s*(mktp|prime|digital)/i, canonical: 'amazon' },
  { pattern: /^apple\.com\/bill/i, canonical: 'apple' },
  { pattern: /^google\s*\*\s*(play|cloud|storage|youtube)/i, canonical: 'google' },
];

// Payment processor prefixes to strip (only true processors, not brand patterns)
const PROCESSOR_PREFIXES = [
  /^tst\s*\*\s*/i, // Toast POS
  /^sq\s*\*\s*/i, // Square
  /^sqsp\s*\*\s*/i, // Squarespace
  /^pp\s*\*\s*/i, // PayPal
  /^paypal\s*\*\s*/i,
  /^stripe\s*\*?\s*/i,
  /^goo\s*\*\s*/i, // Google (generic, not specific service)
  /^chk\s+/i, // Check card prefix
  /^pos\s+/i, // POS prefix
  /^ach\s+/i, // ACH prefix
  /^wire\s+/i, // Wire prefix
  /^deb\s+/i, // Debit prefix
  /^crd\s+/i, // Card prefix
];

// Known canonical merchant mappings
const CANONICAL_MERCHANTS: Record<string, string> = {
  // Ride sharing & Delivery
  uber: 'uber',
  'uber eats': 'uber eats',
  ubereats: 'uber eats',
  lyft: 'lyft',
  doordash: 'doordash',
  'door dash': 'doordash',
  grubhub: 'grubhub',
  'grub hub': 'grubhub',
  postmates: 'postmates',
  instacart: 'instacart',
  deliveroo: 'deliveroo',
  glovo: 'glovo',
  'just eat': 'just eat',
  justeat: 'just eat',

  // E-commerce
  amazon: 'amazon',
  amzn: 'amazon',
  'amazon prime': 'amazon prime',
  ebay: 'ebay',
  aliexpress: 'aliexpress',
  alibaba: 'alibaba',
  etsy: 'etsy',
  wish: 'wish',
  shein: 'shein',
  zalando: 'zalando',
  asos: 'asos',

  // Tech & Streaming
  netflix: 'netflix',
  spotify: 'spotify',
  'apple music': 'apple music',
  'youtube premium': 'youtube premium',
  'youtube music': 'youtube music',
  hbo: 'hbo max',
  'hbo max': 'hbo max',
  'disney+': 'disney+',
  'disney plus': 'disney+',
  hulu: 'hulu',
  'prime video': 'amazon prime video',
  twitch: 'twitch',
  steam: 'steam',
  playstation: 'playstation',
  xbox: 'xbox',
  nintendo: 'nintendo',

  // Software & Services
  google: 'google',
  microsoft: 'microsoft',
  apple: 'apple',
  adobe: 'adobe',
  dropbox: 'dropbox',
  slack: 'slack',
  zoom: 'zoom',
  github: 'github',
  aws: 'amazon web services',
  heroku: 'heroku',
  digitalocean: 'digitalocean',
  openai: 'openai',
  anthropic: 'anthropic',

  // Food & Coffee
  starbucks: 'starbucks',
  'dunkin donuts': 'dunkin',
  dunkin: 'dunkin',
  mcdonalds: 'mcdonalds',
  "mcdonald's": 'mcdonalds',
  'burger king': 'burger king',
  kfc: 'kfc',
  'taco bell': 'taco bell',
  chipotle: 'chipotle',
  subway: 'subway',
  dominos: 'dominos',
  "domino's": 'dominos',
  'pizza hut': 'pizza hut',

  // Supermarkets
  walmart: 'walmart',
  target: 'target',
  costco: 'costco',
  'whole foods': 'whole foods',
  trader: 'trader joes',
  'trader joe': 'trader joes',
  kroger: 'kroger',
  safeway: 'safeway',
  aldi: 'aldi',
  lidl: 'lidl',
  mercadona: 'mercadona',
  carrefour: 'carrefour',
  eroski: 'eroski',
  dia: 'dia',

  // Gas stations
  shell: 'shell',
  bp: 'bp',
  exxon: 'exxon',
  chevron: 'chevron',
  repsol: 'repsol',
  cepsa: 'cepsa',

  // Pharmacies
  cvs: 'cvs pharmacy',
  walgreens: 'walgreens',
  'rite aid': 'rite aid',

  // Airlines
  'american airlines': 'american airlines',
  delta: 'delta airlines',
  united: 'united airlines',
  southwest: 'southwest airlines',
  jetblue: 'jetblue',
  ryanair: 'ryanair',
  easyjet: 'easyjet',
  iberia: 'iberia',
  vueling: 'vueling',
  aireuropa: 'air europa',

  // Hotels
  marriott: 'marriott',
  hilton: 'hilton',
  hyatt: 'hyatt',
  'holiday inn': 'holiday inn',
  airbnb: 'airbnb',
  'booking.com': 'booking.com',
  booking: 'booking.com',
  expedia: 'expedia',
};

// Patterns to remove (transaction IDs, locations, etc)
const NOISE_PATTERNS = [
  /\s*#\d+/g, // Store numbers #1234
  /\s*\*[A-Z0-9]+$/i, // Trailing transaction IDs *ABC123
  /\s+\d{4,}/g, // Long numeric codes
  /\s+[A-Z]{2}\d{4,}/g, // State codes + numbers US1234
  /\s+\d{2}\/\d{2}\/?\d{0,4}/g, // Dates 12/25 or 12/25/2024
  /\s+\d{2}-\d{2}-?\d{0,4}/g, // Dates with dashes
  /\s+[A-Z]{2,3}\s*$/i, // Trailing state/country codes
  /\s+\d+\s*$/g, // Trailing numbers
  /\s*-\s*\d+\s*$/g, // Trailing -123
  /\s+ref\s*:?\s*\w+/gi, // Reference numbers
  /\s+id\s*:?\s*\w+/gi, // ID numbers
  /\s+auth\s*:?\s*\w+/gi, // Auth codes
  /\s+txn\s*:?\s*\w+/gi, // Transaction IDs
  /\s+confirmation\s*:?\s*\w+/gi, // Confirmation numbers
  /\s+order\s*:?\s*[\w-]+/gi, // Order numbers
  /,?\s*[a-z]{2,}\s+\d{5}(-\d{4})?$/i, // City + zip code
  /\s+\(\d+\)/g, // Numbers in parentheses
  /\s+ext\.?\s*\d+/gi, // Extension numbers
];

// Corporate suffixes to remove
const CORPORATE_SUFFIXES = [
  /\s+(inc|llc|ltd|corp|co|company|corporation|sa|sl|srl|gmbh|ag|bv|nv|plc|pty|pvt)\.?$/i,
  /\s+(limited|incorporated|holdings?)\.?$/i,
];

// Location patterns (cities, countries)
const LOCATION_PATTERNS = [
  /\s+(madrid|barcelona|valencia|sevilla|bilbao|malaga|zaragoza)$/i,
  /\s+(new york|los angeles|chicago|houston|phoenix|philadelphia|san antonio|san diego|dallas|san jose|austin|jacksonville|fort worth|columbus|charlotte|san francisco|indianapolis|seattle|denver|washington|boston|el paso|detroit|nashville|portland|memphis|oklahoma city|las vegas|louisville|baltimore|milwaukee|albuquerque|tucson|fresno|mesa|sacramento|atlanta|kansas city|colorado springs|miami|raleigh|omaha|long beach|virginia beach|oakland|minneapolis|tulsa|arlington|new orleans|wichita|cleveland|tampa|bakersfield|aurora|anaheim|honolulu|santa ana|riverside|corpus christi|lexington|stockton|henderson|saint paul|st\. louis|cincinnati|pittsburgh|greensboro|anchorage|plano|lincoln|orlando|irvine|newark|toledo|durham|chula vista|fort wayne|jersey city|st\. petersburg|laredo|scottsdale|chandler|gilbert|madison|lubbock|reno|buffalo|norfolk|winston|glendale|hialeah|garland|chesapeake|irving|north las vegas|fremont|baton rouge|richmond|boise|san bernardino)$/i,
  /\s+(usa|uk|gb|es|de|fr|it|pt|nl|be|ch|at|ie|ca|au|mx|br|ar|cl|co|pe)$/i,
];

export class MerchantNormalizer {
  /**
   * Normalize a merchant name for pattern matching
   */
  normalize(rawMerchant: string): NormalizationResult {
    if (!rawMerchant || rawMerchant.trim().length === 0) {
      return {
        original: rawMerchant || '',
        normalized: '',
        canonical: '',
        confidence: 0,
        tokens: [],
      };
    }

    const original = rawMerchant;
    let normalized = rawMerchant.toLowerCase().trim();
    let detectedProcessor: string | undefined;
    let earlyCanonical: string | undefined;

    // Step 0: Check for known brand patterns FIRST (before stripping anything)
    // These are brands that use asterisk notation like "UBER *EATS"
    for (const { pattern, canonical } of BRAND_PATTERNS) {
      if (pattern.test(normalized)) {
        earlyCanonical = canonical;
        // Don't strip - we'll use this canonical name directly
        break;
      }
    }

    // Step 1: Detect and remove payment processor prefixes (only if no brand match)
    if (!earlyCanonical) {
      for (const prefix of PROCESSOR_PREFIXES) {
        const match = normalized.match(prefix);
        if (match) {
          detectedProcessor = match[0].trim();
          normalized = normalized.replace(prefix, '').trim();
          break;
        }
      }
    }

    // Step 2: Remove corporate suffixes
    for (const suffix of CORPORATE_SUFFIXES) {
      normalized = normalized.replace(suffix, '').trim();
    }

    // Step 3: Remove noise patterns (IDs, codes, dates)
    for (const pattern of NOISE_PATTERNS) {
      normalized = normalized.replace(pattern, '').trim();
    }

    // Step 4: Remove location patterns
    for (const pattern of LOCATION_PATTERNS) {
      normalized = normalized.replace(pattern, '').trim();
    }

    // Step 5: Clean up special characters but preserve meaningful punctuation
    normalized = normalized
      .replace(/[^\w\s'-]/g, ' ') // Replace special chars with space (keep apostrophe, hyphen)
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Step 6: Find canonical name (use early match if found)
    const canonical = earlyCanonical || this.findCanonicalName(normalized);
    // If we had an early canonical match, also update normalized to match
    if (earlyCanonical) {
      normalized = earlyCanonical;
    }
    const confidence = this.calculateConfidence(original, normalized, canonical);

    // Step 7: Extract tokens for pattern matching
    const tokens = this.extractTokens(normalized);

    return {
      original,
      normalized,
      canonical,
      confidence,
      tokens,
      detectedProcessor,
    };
  }

  /**
   * Find a known canonical name for the normalized merchant
   */
  private findCanonicalName(normalized: string): string {
    // Direct match
    if (CANONICAL_MERCHANTS[normalized]) {
      return CANONICAL_MERCHANTS[normalized];
    }

    // Check if normalized starts with or contains a known merchant
    for (const [key, value] of Object.entries(CANONICAL_MERCHANTS)) {
      // Starts with known merchant
      if (normalized.startsWith(key + ' ') || normalized === key) {
        return value;
      }

      // Contains known merchant as a word
      const regex = new RegExp(`\\b${this.escapeRegex(key)}\\b`, 'i');
      if (regex.test(normalized)) {
        return value;
      }
    }

    // No canonical match - return normalized
    return normalized;
  }

  /**
   * Calculate confidence score for the normalization
   */
  private calculateConfidence(original: string, normalized: string, canonical: string): number {
    let confidence = 0.5; // Base confidence

    // Boost if we found a canonical name
    if (canonical !== normalized) {
      confidence += 0.3; // Known merchant match
    }

    // Boost based on string quality
    if (normalized.length >= 3) {
      confidence += 0.1;
    }

    // Penalize if too much was removed
    const removedRatio = 1 - normalized.length / Math.max(original.length, 1);
    if (removedRatio > 0.7) {
      confidence -= 0.2; // Removed too much
    } else if (removedRatio < 0.3) {
      confidence += 0.1; // Good preservation
    }

    // Penalize very short results
    if (normalized.length < 3) {
      confidence -= 0.3;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract meaningful tokens for pattern matching
   */
  private extractTokens(normalized: string): string[] {
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'from',
      'to',
      'at',
      'in',
      'on',
      'of',
      'a',
      'an',
    ]);

    return normalized
      .split(/\s+/)
      .filter((token) => token.length >= 2 && !stopWords.has(token))
      .slice(0, 5); // Max 5 tokens
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calculate similarity between two strings (0-1)
   * Uses Levenshtein-like approach for fuzzy matching
   */
  calculateSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    if (!a || !b) return 0;

    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    if (aLower === bLower) return 1;

    // Check if one contains the other
    if (aLower.includes(bLower) || bLower.includes(aLower)) {
      const longer = Math.max(a.length, b.length);
      const shorter = Math.min(a.length, b.length);
      return shorter / longer;
    }

    // Token-based similarity
    const aTokens = new Set(aLower.split(/\s+/));
    const bTokens = new Set(bLower.split(/\s+/));

    const intersection = [...aTokens].filter((t) => bTokens.has(t)).length;
    const union = new Set([...aTokens, ...bTokens]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Check if two merchant names likely refer to the same merchant
   */
  isSameMerchant(a: string, b: string, threshold = 0.7): boolean {
    const normA = this.normalize(a);
    const normB = this.normalize(b);

    // Same canonical name
    if (normA.canonical === normB.canonical && normA.canonical !== normA.normalized) {
      return true;
    }

    // Direct match
    if (normA.normalized === normB.normalized) {
      return true;
    }

    // Similarity check
    return this.calculateSimilarity(normA.normalized, normB.normalized) >= threshold;
  }

  /**
   * Get all known canonical merchant names
   */
  getKnownMerchants(): string[] {
    return [...new Set(Object.values(CANONICAL_MERCHANTS))].sort();
  }

  /**
   * Add a custom canonical mapping (runtime only)
   */
  addCanonicalMapping(pattern: string, canonical: string): void {
    CANONICAL_MERCHANTS[pattern.toLowerCase()] = canonical.toLowerCase();
  }
}

// Singleton instance for convenience
export const merchantNormalizer = new MerchantNormalizer();
