import { Request, Response } from 'express';
import { IMerchantAliasRepository } from '../repositories/MerchantAliasRepository';
import { MerchantAlias, AliasSource } from '../../domain/entities/MerchantAlias';
import { MerchantNormalizer } from '../../domain/services/MerchantNormalizer';

export class MerchantAliasController {
  private normalizer: MerchantNormalizer;

  constructor(
    private readonly aliasRepository: IMerchantAliasRepository,
    private readonly userId: string
  ) {
    this.normalizer = new MerchantNormalizer();
  }

  /**
   * GET /merchant-aliases
   * List all merchant aliases for the user
   */
  async list(_req: Request, res: Response): Promise<void> {
    try {
      const aliases = await this.aliasRepository.findAllForUser(this.userId);

      res.json({
        success: true,
        data: aliases.map((a) => a.toSnapshot()),
        count: aliases.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to list aliases',
      });
    }
  }

  /**
   * GET /merchant-aliases/:id
   * Get a single alias by ID
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alias = await this.aliasRepository.findById(id, this.userId);

      if (!alias) {
        res.status(404).json({
          success: false,
          error: 'Alias not found',
        });
        return;
      }

      res.json({
        success: true,
        data: alias.toSnapshot(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get alias',
      });
    }
  }

  /**
   * POST /merchant-aliases
   * Create a new merchant alias
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { rawPattern, canonicalName, confidence } = req.body;

      if (!rawPattern || !canonicalName) {
        res.status(400).json({
          success: false,
          error: 'rawPattern and canonicalName are required',
        });
        return;
      }

      // Check if alias already exists
      const existing = await this.aliasRepository.findByRawPattern(rawPattern, this.userId);

      if (existing) {
        res.status(409).json({
          success: false,
          error: 'Alias for this pattern already exists',
          existingAlias: existing.toSnapshot(),
        });
        return;
      }

      const aliasResult = MerchantAlias.create(
        rawPattern,
        canonicalName,
        'user' as AliasSource,
        this.userId,
        confidence ?? 1.0
      );

      if (aliasResult.isFailure()) {
        res.status(400).json({
          success: false,
          error: aliasResult.getError().message,
        });
        return;
      }

      const alias = aliasResult.getValue();
      await this.aliasRepository.save(alias);

      res.status(201).json({
        success: true,
        data: alias.toSnapshot(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create alias',
      });
    }
  }

  /**
   * PUT /merchant-aliases/:id
   * Update an existing alias
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { canonicalName, confidence } = req.body;

      const alias = await this.aliasRepository.findById(id, this.userId);

      if (!alias) {
        res.status(404).json({
          success: false,
          error: 'Alias not found',
        });
        return;
      }

      // Verify ownership
      if (alias.userId !== this.userId && alias.userId !== null) {
        res.status(403).json({
          success: false,
          error: "Cannot modify another user's alias",
        });
        return;
      }

      if (canonicalName) {
        const updateResult = alias.updateCanonicalName(canonicalName);
        if (updateResult.isFailure()) {
          res.status(400).json({
            success: false,
            error: updateResult.getError().message,
          });
          return;
        }
      }

      if (confidence !== undefined) {
        const updateResult = alias.updateConfidence(confidence);
        if (updateResult.isFailure()) {
          res.status(400).json({
            success: false,
            error: updateResult.getError().message,
          });
          return;
        }
      }

      await this.aliasRepository.save(alias);

      res.json({
        success: true,
        data: alias.toSnapshot(),
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update alias',
      });
    }
  }

  /**
   * DELETE /merchant-aliases/:id
   * Delete an alias
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const alias = await this.aliasRepository.findById(id, this.userId);

      if (!alias) {
        res.status(404).json({
          success: false,
          error: 'Alias not found',
        });
        return;
      }

      // Verify ownership (only allow deletion of own aliases)
      if (alias.userId !== this.userId) {
        res.status(403).json({
          success: false,
          error: "Cannot delete another user's alias or global alias",
        });
        return;
      }

      await this.aliasRepository.delete(id);

      res.json({
        success: true,
        message: 'Alias deleted',
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete alias',
      });
    }
  }

  /**
   * POST /merchant-aliases/normalize
   * Normalize a merchant name (utility endpoint)
   */
  async normalize(req: Request, res: Response): Promise<void> {
    try {
      const { merchant } = req.body;

      if (!merchant) {
        res.status(400).json({
          success: false,
          error: 'merchant is required',
        });
        return;
      }

      // Get base normalization
      const normResult = this.normalizer.normalize(merchant);

      // Check if we have a user alias that might override
      const alias = await this.aliasRepository.findBestMatch(merchant, this.userId);

      res.json({
        success: true,
        data: {
          original: normResult.original,
          normalized: normResult.normalized,
          canonical: alias ? alias.canonicalName : normResult.canonical,
          confidence: alias
            ? Math.max(normResult.confidence, alias.confidence)
            : normResult.confidence,
          tokens: normResult.tokens,
          detectedProcessor: normResult.detectedProcessor,
          matchedAlias: alias ? alias.toSnapshot() : null,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to normalize merchant',
      });
    }
  }

  /**
   * POST /merchant-aliases/bulk-normalize
   * Normalize multiple merchant names at once
   */
  async bulkNormalize(req: Request, res: Response): Promise<void> {
    try {
      const { merchants } = req.body;

      if (!Array.isArray(merchants) || merchants.length === 0) {
        res.status(400).json({
          success: false,
          error: 'merchants array is required',
        });
        return;
      }

      // Limit to 100 merchants per request
      const toProcess = merchants.slice(0, 100);

      const results = await Promise.all(
        toProcess.map(async (merchant: string) => {
          const normResult = this.normalizer.normalize(merchant);
          const alias = await this.aliasRepository.findBestMatch(merchant, this.userId);

          return {
            original: merchant,
            normalized: normResult.normalized,
            canonical: alias ? alias.canonicalName : normResult.canonical,
            confidence: alias
              ? Math.max(normResult.confidence, alias.confidence)
              : normResult.confidence,
            hasAlias: !!alias,
          };
        })
      );

      res.json({
        success: true,
        data: results,
        processed: results.length,
        total: merchants.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to bulk normalize merchants',
      });
    }
  }

  /**
   * GET /merchant-aliases/search
   * Search aliases by canonical name
   */
  async searchByCanonical(req: Request, res: Response): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({
          success: false,
          error: "Query parameter 'q' is required",
        });
        return;
      }

      const aliases = await this.aliasRepository.findByCanonicalName(q, this.userId);

      res.json({
        success: true,
        data: aliases.map((a) => a.toSnapshot()),
        count: aliases.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to search aliases',
      });
    }
  }

  /**
   * GET /merchant-aliases/known-merchants
   * Get list of all known canonical merchant names
   */
  async getKnownMerchants(_req: Request, res: Response): Promise<void> {
    try {
      const knownMerchants = this.normalizer.getKnownMerchants();

      res.json({
        success: true,
        data: knownMerchants,
        count: knownMerchants.length,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get known merchants',
      });
    }
  }
}
