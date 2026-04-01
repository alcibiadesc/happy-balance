import { Request, Response } from 'express';
import { z } from 'zod';
import { ImportTransactionsCommand } from '@application/commands/ImportTransactionsCommand';
import { ImportTransactionsUseCase } from '@application/use-cases/ImportTransactionsUseCase';
import {
  CheckDuplicateHashesUseCase,
  CheckDuplicateHashesCommand,
} from '@application/use-cases/CheckDuplicateHashesUseCase';
import {
  ImportSelectedTransactionsUseCase,
  ImportSelectedTransactionsCommand,
} from '@application/use-cases/ImportSelectedTransactionsUseCase';
import {
  GenerateHashesUseCase,
  GenerateHashesCommand,
} from '@application/use-cases/GenerateHashesUseCase';
import {
  BadRequestError,
  validateBody,
  handleResult,
  successResponse,
} from '@infrastructure/errors';

// Validation Schemas
const ImportConfigSchema = z.object({
  currency: z.string().min(3).max(3).default('EUR'),
  duplicateDetectionEnabled: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .default(true),
  skipDuplicates: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .default(true),
  autoCategorizationEnabled: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === 'true')
    .default(true),
});

const SelectedTransactionSchema = z.object({
  hash: z.string(),
  date: z.string(),
  merchant: z.string(),
  amount: z.number(),
  description: z.string().optional().default(''),
  currency: z.string().min(3).max(3).default('EUR'),
});

const ImportSelectedTransactionsSchema = z.object({
  transactions: z.array(SelectedTransactionSchema),
  currency: z.string().min(3).max(3).default('EUR'),
  duplicateDetectionEnabled: z.boolean().default(true),
  skipDuplicates: z.boolean().default(true),
  autoCategorizationEnabled: z.boolean().default(true),
});

const CheckDuplicateHashesSchema = z.object({
  hashes: z.array(z.string()).min(1, 'At least one hash is required'),
});

const GenerateHashesSchema = z.object({
  transactions: z
    .array(
      z.object({
        date: z.string(),
        merchant: z.string(),
        amount: z.number(),
        currency: z.string().optional(),
      })
    )
    .min(1, 'At least one transaction is required'),
});

export class ImportController {
  private readonly generateHashesUseCase: GenerateHashesUseCase;

  constructor(
    private readonly importTransactionsUseCase: ImportTransactionsUseCase,
    private readonly checkDuplicateHashesUseCase: CheckDuplicateHashesUseCase,
    private readonly importSelectedTransactionsUseCase: ImportSelectedTransactionsUseCase
  ) {
    this.generateHashesUseCase = new GenerateHashesUseCase();
  }

  async generateHashes(req: Request, res: Response): Promise<void> {
    const data = validateBody(GenerateHashesSchema, req);

    const command: GenerateHashesCommand = {
      transactions: data.transactions.map((t) => ({
        date: t.date,
        merchant: t.merchant,
        amount: t.amount,
        currency: t.currency,
      })),
    };

    const result = await this.generateHashesUseCase.execute(command);
    const hashes = handleResult(result, 'Hash generation failed');

    successResponse(res, hashes);
  }

  async checkDuplicates(req: Request, res: Response): Promise<void> {
    const { hashes } = validateBody(CheckDuplicateHashesSchema, req);

    const command: CheckDuplicateHashesCommand = { hashes };
    const result = await this.checkDuplicateHashesUseCase.execute(command);
    const duplicates = handleResult(result, 'Duplicate check failed');

    successResponse(res, duplicates);
  }

  async importSelected(req: Request, res: Response): Promise<void> {
    const data = validateBody(ImportSelectedTransactionsSchema, req);

    const command: ImportSelectedTransactionsCommand = {
      transactions: data.transactions.map((t) => ({
        hash: t.hash,
        date: t.date,
        merchant: t.merchant,
        amount: t.amount,
        description: t.description ?? '',
        currency: t.currency ?? 'EUR',
      })),
      currency: data.currency ?? 'EUR',
      duplicateDetectionEnabled: data.duplicateDetectionEnabled ?? true,
      skipDuplicates: data.skipDuplicates ?? true,
      autoCategorizationEnabled: data.autoCategorizationEnabled ?? true,
    };

    const result = await this.importSelectedTransactionsUseCase.execute(command);
    const importResult = handleResult(result, 'Import selected transactions failed');

    successResponse(res, importResult);
  }

  async importFromCsv(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestError('Only CSV files are accepted');
    }

    const config = validateBody(ImportConfigSchema, req);
    const csvContent = req.file.buffer.toString('utf-8');

    if (!csvContent.trim()) {
      throw new BadRequestError('Empty CSV file');
    }

    const command = new ImportTransactionsCommand(
      csvContent,
      config.currency ?? 'EUR',
      Boolean(config.duplicateDetectionEnabled ?? true),
      Boolean(config.skipDuplicates ?? true),
      Boolean(config.autoCategorizationEnabled ?? true)
    );

    const result = await this.importTransactionsUseCase.execute(command);
    const importResult = handleResult(result, 'Import failed');

    successResponse(res, importResult);
  }

  async importFromExcel(_req: Request, _res: Response): Promise<void> {
    throw new BadRequestError('Excel import not yet implemented. Please use CSV import for now.');
  }

  async getImportHistory(_req: Request, res: Response): Promise<void> {
    // Import history tracking not yet implemented - returns empty stub
    successResponse(res, { imports: [], totalCount: 0 });
  }

  async previewCsv(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestError('Only CSV files are accepted');
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const currency = ((req.body.currency as string) || 'EUR').toUpperCase();

    if (!csvContent.trim()) {
      throw new BadRequestError('Empty CSV file');
    }

    const command = new ImportTransactionsCommand(
      csvContent,
      currency,
      true, // duplicateDetectionEnabled
      false, // skipDuplicates - we want to see all including duplicates
      false // autoCategorizationEnabled - not needed for preview
    );

    const validation = command.isValid();
    if (!validation.valid) {
      throw new BadRequestError('Invalid import data');
    }

    const result = await this.importTransactionsUseCase.preview(command);
    const previewData = handleResult(result, 'CSV preview failed');

    successResponse(res, previewData);
  }

  async validateCsv(req: Request, res: Response): Promise<void> {
    if (!req.file) {
      throw new BadRequestError('No file uploaded');
    }

    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      throw new BadRequestError('Only CSV files are accepted');
    }

    const csvContent = req.file.buffer.toString('utf-8');

    if (!csvContent.trim()) {
      throw new BadRequestError('Empty CSV file');
    }

    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestError('CSV must have header and at least one data row');
    }

    const headerLine = lines[0];
    const headers = this.parseCSVLine(headerLine);
    const detectedFields = this.detectFields(headers);

    const validation = {
      isValid: detectedFields.requiredFields.length >= 3,
      totalRows: lines.length - 1,
      headers,
      detectedFields,
      issues: [] as string[],
    };

    if (!detectedFields.requiredFields.includes('date')) {
      validation.issues.push('Date field not detected');
    }
    if (!detectedFields.requiredFields.includes('merchant')) {
      validation.issues.push('Merchant field not detected');
    }
    if (!detectedFields.requiredFields.includes('amount')) {
      validation.issues.push('Amount field not detected');
    }

    successResponse(res, validation);
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }

    result.push(current.trim());
    return result;
  }

  private detectFields(headers: string[]) {
    const fieldPatterns: Record<string, RegExp> = {
      date: /booking\s*date|fecha\s*reserva|date|fecha/i,
      valueDate: /value\s*date|fecha\s*valor/i,
      merchant: /partner\s*name|nombre\s*socio|beneficiario|partner|merchant|comercio/i,
      iban: /partner\s*iban|iban\s*socio|iban/i,
      type: /type|tipo|transaction\s*type/i,
      description: /payment\s*reference|referencia\s*pago|concepto|description|descripci[oó]n/i,
      account: /account\s*name|nombre\s*cuenta|account/i,
      amount: /amount.*eur|importe.*eur|cantidad|amount|importe/i,
    };

    const detectedFields = {
      requiredFields: [] as string[],
      optionalFields: [] as string[],
      mapping: {} as Record<string, number>,
    };

    headers.forEach((header, index) => {
      Object.entries(fieldPatterns).forEach(([field, pattern]) => {
        if (pattern.test(header) && !detectedFields.mapping[field]) {
          detectedFields.mapping[field] = index;

          if (['date', 'merchant', 'amount'].includes(field)) {
            detectedFields.requiredFields.push(field);
          } else {
            detectedFields.optionalFields.push(field);
          }
        }
      });
    });

    return detectedFields;
  }
}
