import { Request, Response } from 'express';
import { z } from 'zod';
import { ImportTransactionsCommand } from '@application/commands/ImportTransactionsCommand';
import { ImportTransactionsUseCase } from '@application/use-cases/ImportTransactionsUseCase';

const ImportConfigSchema = z.object({
  currency: z.string().min(3).max(3).default('EUR'),
  duplicateDetectionEnabled: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'string') {
      return val === 'true';
    }
    return val;
  }).default(true),
  skipDuplicates: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'string') {
      return val === 'true';
    }
    return val;
  }).default(true),
  autoCategorizationEnabled: z.union([z.boolean(), z.string()]).transform(val => {
    if (typeof val === 'string') {
      return val === 'true';
    }
    return val;
  }).default(true)
});

export class ImportController {
  constructor(
    private readonly importTransactionsUseCase: ImportTransactionsUseCase
  ) {}

  async importFromCsv(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const configValidation = ImportConfigSchema.safeParse(req.body);
      if (!configValidation.success) {
        return res.status(400).json({
          error: 'Invalid configuration',
          details: configValidation.error.errors
        });
      }

      const config = configValidation.data;
      const csvContent = req.file.buffer.toString('utf-8');

      if (!csvContent.trim()) {
        return res.status(400).json({ error: 'Empty CSV file' });
      }

      const command = new ImportTransactionsCommand(
        csvContent,
        config.currency,
        config.duplicateDetectionEnabled,
        config.skipDuplicates,
        config.autoCategorizationEnabled
      );

      const result = await this.importTransactionsUseCase.execute(command);
      if (result.isFailure()) {
        return res.status(400).json({ error: result.getError() });
      }

      res.json({
        success: true,
        data: result.getValue()
      });
    } catch (error) {
      res.status(500).json({
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async importFromExcel(req: Request, res: Response) {
    try {
      // TODO: Implement Excel import
      // For now, return a placeholder response
      res.status(501).json({
        error: 'Excel import not yet implemented',
        message: 'Please use CSV import for now'
      });
    } catch (error) {
      res.status(500).json({
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getImportHistory(req: Request, res: Response) {
    try {
      // TODO: Implement import history tracking
      // This would require implementing ImportLog repository
      res.json({
        success: true,
        data: {
          imports: [],
          totalCount: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get import history',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async validateCsv(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const csvContent = req.file.buffer.toString('utf-8');

      if (!csvContent.trim()) {
        return res.status(400).json({ error: 'Empty CSV file' });
      }

      const lines = csvContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({
          error: 'CSV must have header and at least one data row'
        });
      }

      const headerLine = lines[0];
      const headers = this.parseCSVLine(headerLine);

      // Basic field detection
      const detectedFields = this.detectFields(headers);

      const validation = {
        isValid: detectedFields.requiredFields.length >= 3, // date, merchant, amount minimum
        totalRows: lines.length - 1,
        headers,
        detectedFields,
        issues: []
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

      res.json({
        success: true,
        data: validation
      });
    } catch (error) {
      res.status(500).json({
        error: 'CSV validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
    const fieldPatterns = {
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
      mapping: {} as Record<string, number>
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