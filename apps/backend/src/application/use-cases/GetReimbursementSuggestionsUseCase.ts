import { Result } from '@domain/shared/Result';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { TransactionType } from '@domain/entities/TransactionType';
import { TransactionSnapshot } from '@domain/entities/Transaction';
import { FindPotentialReimbursementsUseCase } from './FindPotentialReimbursementsUseCase';

export interface GetReimbursementSuggestionsRequest {
  /** Max number of suggestions to return (default 50). */
  limit?: number;
  /** Minimum match score (0-100) for a suggestion to surface (default 50). */
  minScore?: number;
}

export interface ReimbursementSuggestionItem {
  /** The income transaction that looks like a reimbursement. */
  income: TransactionSnapshot;
  /** The best-matching expense it likely reimburses. */
  expense: TransactionSnapshot;
  matchScore: number;
  matchReasons: string[];
  /** Suggested split % the user actually bears on the expense (e.g. 50). */
  suggestedSplitPercentage: number;
}

export interface GetReimbursementSuggestionsResponse {
  suggestions: ReimbursementSuggestionItem[];
  /** How many unlinked income transactions were scanned. */
  totalScanned: number;
}

/**
 * Surfaces likely shared-expense reimbursements for Tinder mode.
 *
 * Pattern (see the live data): an INCOME transaction that reimburses ~50% of an
 * EXPENSE — e.g. "Isabel González Matos / Lo que me debes de Mercadona". We scan
 * unlinked income, score each against candidate expenses with the (tested)
 * {@link FindPotentialReimbursementsUseCase}, and boost candidates whose merchant
 * matches the merchant named in the income description ("Lo que me debes de X").
 * The user confirms each link via a swipe in Tinder.
 */
export class GetReimbursementSuggestionsUseCase {
  /** Cap on how many unlinked incomes we score per request (cost guard). */
  private static readonly MAX_SCAN = 300;
  /** Extra ranking weight when the named expense merchant matches a candidate. */
  private static readonly DESCRIPTION_MERCHANT_BOOST = 25;
  /** Boost (and threshold relief) for income from a merchant the user has linked before. */
  private static readonly LEARNED_PAYER_BOOST = 20;

  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly findPotentialReimbursementsUseCase: FindPotentialReimbursementsUseCase
  ) {}

  async execute(
    request: GetReimbursementSuggestionsRequest = {}
  ): Promise<Result<GetReimbursementSuggestionsResponse>> {
    const limit = request.limit ?? 50;
    const minScore = request.minScore ?? 50;

    const incomeResult = await this.transactionRepository.findWithFilters(
      { type: TransactionType.INCOME, includeHidden: false },
      { offset: 0, limit: 10000 }
    );

    if (incomeResult.isFailure()) {
      return Result.fail(incomeResult.getError());
    }

    const allIncome = incomeResult.getValue().transactions;

    // LEARNING: merchants the user has already confirmed as reimbursers (past
    // links) become "known payers". New income from them is boosted and passes
    // a more lenient threshold — so the detection improves every time the user
    // links one in Tinder, with no schema change (derived from existing data).
    const knownReimburserMerchants = new Set(
      allIncome
        .filter((tx) => tx.isReimbursement || tx.linkedTransactionId)
        .map((tx) => tx.merchant.name.trim().toLowerCase())
        .filter((name) => name.length > 0)
    );

    // Only income that isn't already linked / marked as a reimbursement.
    const candidates = allIncome
      .filter((tx) => !tx.linkedTransactionId && !tx.isReimbursement)
      .slice(0, GetReimbursementSuggestionsUseCase.MAX_SCAN);

    const suggestions: ReimbursementSuggestionItem[] = [];

    for (const income of candidates) {
      const matchesResult = await this.findPotentialReimbursementsUseCase.execute({
        transactionId: income.id.value,
      });
      if (matchesResult.isFailure()) continue;

      const matches = matchesResult.getValue();
      if (matches.length === 0) continue;

      // Merchant named in "Lo que me debes de <X>" descriptions is a strong signal.
      const namedMerchant = this.extractNamedMerchant(income.description);
      const isKnownReimburser = knownReimburserMerchants.has(
        income.merchant.name.trim().toLowerCase()
      );

      const best = matches
        .map((m) => ({
          match: m,
          rank:
            m.matchScore +
            (namedMerchant && this.merchantMatches(m.transaction.merchant.name, namedMerchant)
              ? GetReimbursementSuggestionsUseCase.DESCRIPTION_MERCHANT_BOOST
              : 0) +
            (isKnownReimburser ? GetReimbursementSuggestionsUseCase.LEARNED_PAYER_BOOST : 0),
        }))
        .sort((a, b) => b.rank - a.rank)[0];

      // Learned payers get a more lenient threshold so they surface reliably.
      const effectiveMin = isKnownReimburser
        ? minScore - GetReimbursementSuggestionsUseCase.LEARNED_PAYER_BOOST
        : minScore;
      if (best.match.matchScore < effectiveMin) continue;

      const expense = best.match.transaction;
      const expenseAmount = expense.amount.amount;
      const incomeAmount = income.amount.amount;
      const userShare =
        expenseAmount > 0
          ? Math.min(100, Math.max(0, Math.round((1 - incomeAmount / expenseAmount) * 100)))
          : 50;

      const matchReasons = isKnownReimburser
        ? [...best.match.matchReasons, 'Pagador recurrente (aprendido)']
        : best.match.matchReasons;

      suggestions.push({
        income: income.toSnapshot(),
        expense: expense.toSnapshot(),
        // Surface the learned boost in the displayed confidence too (capped 100).
        matchScore: isKnownReimburser
          ? Math.min(
              100,
              best.match.matchScore + GetReimbursementSuggestionsUseCase.LEARNED_PAYER_BOOST
            )
          : best.match.matchScore,
        matchReasons,
        suggestedSplitPercentage: userShare,
      });
    }

    suggestions.sort((a, b) => b.matchScore - a.matchScore);

    return Result.ok({
      suggestions: suggestions.slice(0, limit),
      totalScanned: candidates.length,
    });
  }

  /** Extracts "<X>" from "Lo que me debes de <X>" style descriptions. */
  private extractNamedMerchant(description: string): string | null {
    if (!description) return null;
    const match = description.match(/me debes de\s+(.+)/i);
    return match ? match[1].trim().toLowerCase() : null;
  }

  /** True when the named merchant shares a meaningful token with the candidate. */
  private merchantMatches(candidateMerchant: string, namedMerchant: string): boolean {
    const candidate = candidateMerchant.toLowerCase();
    if (candidate.includes(namedMerchant) || namedMerchant.includes(candidate)) return true;
    // Token overlap on words >= 4 chars (e.g. "mercadona" vs "MERCADONA SANTIDAD").
    const namedTokens = namedMerchant.split(/\s+/).filter((w) => w.length >= 4);
    return namedTokens.some((token) => candidate.includes(token));
  }
}
