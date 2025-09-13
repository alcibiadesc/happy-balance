import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalCSVParser } from './UniversalCSVParser.js';

describe('UniversalCSVParser', () => {
  let parser: UniversalCSVParser;

  beforeEach(() => {
    parser = new UniversalCSVParser();
  });

  describe('CSV Parsing', () => {
    it('should parse simple CSV with standard headers', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,Test Income,Salary
2025-09-02,-25.30,Test Expense,Grocery Store`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.summary.validRows).toBe(2);
      expect(result.summary.errorRows).toBe(0);

      // Check first transaction
      const firstTx = result.transactions[0];
      expect(firstTx.amount.amount).toBe(100.50);
      expect(firstTx.description).toBe('Test Income');
      expect(firstTx.paymentReference).toBe('Salary');
      expect(firstTx.transactionDate.value.getTime()).toBe(new Date('2025-09-01').getTime());

      // Check second transaction
      const secondTx = result.transactions[1];
      expect(secondTx.amount.amount).toBe(-25.30);
      expect(secondTx.description).toBe('Test Expense');
    });

    it('should parse N26 format CSV', async () => {
      const csvContent = `Booking Date,Partner Name,Payment Reference,Amount (EUR)
2025-09-01,MERCADONA,COMPRA TARJETA,-45.67
2025-09-02,SALARY INC,NOMINA AGOSTO,2500.00`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(2);
      expect(result.errors).toHaveLength(0);

      const merchantTx = result.transactions[0];
      expect(merchantTx.amount.amount).toBe(-45.67);
      expect(merchantTx.description).toBe('MERCADONA');
      expect(merchantTx.paymentReference).toBe('COMPRA TARJETA');

      const salaryTx = result.transactions[1];
      expect(salaryTx.amount.amount).toBe(2500.00);
      expect(salaryTx.description).toBe('SALARY INC');
    });

    it('should handle CSV with missing description by using payment reference', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,,Salary Payment
2025-09-02,-25.30,   ,Grocery Store`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].description).toBe('Salary Payment');
      expect(result.transactions[1].description).toBe('Grocery Store');
    });

    it('should handle different date formats', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,ISO Format,Test
01.09.2025,200.00,European Format,Test
01/09/2025,300.00,Alternative Format,Test`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(3);
      expect(result.errors).toHaveLength(0);

      // All should be parsed to the same date
      const expectedDate = new Date('2025-09-01').getTime();
      result.transactions.forEach(tx => {
        expect(tx.transactionDate.value.getTime()).toBe(expectedDate);
      });
    });

    it('should handle different amount formats', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,Regular Amount,Test
2025-09-02,"1,234.56",Quoted Amount,Test
2025-09-03,-500.00,Negative Amount,Test
2025-09-04,(250.00),Parentheses Negative,Test`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(4);
      expect(result.transactions[0].amount.amount).toBe(100.50);
      expect(result.transactions[1].amount.amount).toBe(1234.56);
      expect(result.transactions[2].amount.amount).toBe(-500.00);
      expect(result.transactions[3].amount.amount).toBe(-250.00);
    });

    it('should detect and use appropriate delimiter', async () => {
      const tabSeparatedCSV = `Date\tAmount\tDescription\tReference
2025-09-01\t100.50\tTab Separated\tTest`;

      const result = await parser.parseWithDetails(tabSeparatedCSV);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].description).toBe('Tab Separated');
    });

    it('should handle quoted fields with commas', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,"Description, with comma",Test
2025-09-02,-25.30,"Another, complex, description","Reference, too"`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0].description).toBe('Description, with comma');
      expect(result.transactions[1].description).toBe('Another, complex, description');
      expect(result.transactions[1].paymentReference).toBe('Reference, too');
    });

    it('should handle errors gracefully', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,Valid Transaction,Test
invalid-date,abc,Invalid Transaction,Test
2025-09-03,300.00,Another Valid,Test`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(2); // 2 valid transactions
      expect(result.errors).toHaveLength(1); // 1 error
      expect(result.summary.validRows).toBe(2);
      expect(result.summary.errorRows).toBe(1);

      const error = result.errors[0];
      expect(error.row).toBe(3); // Second data row (after header)
      expect(error.message).toContain('Invalid');
    });

    it('should fail with empty CSV', async () => {
      const csvContent = '';

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('must have at least a header');
    });

    it('should fail when required columns are missing', async () => {
      const csvContent = `OnlyOneColumn
Data`;

      const result = await parser.parseWithDetails(csvContent);

      expect(result.transactions).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Could not identify required columns');
    });
  });

  describe('CSV Format Validation', () => {
    it('should validate correct CSV format', () => {
      const csvContent = `Date,Amount,Description
2025-09-01,100.50,Test`;

      const validation = UniversalCSVParser.validateCSVFormat(csvContent);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject empty CSV', () => {
      const validation = UniversalCSVParser.validateCSVFormat('');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('CSV content is empty');
    });

    it('should reject CSV with only headers', () => {
      const validation = UniversalCSVParser.validateCSVFormat('Date,Amount,Description');

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('CSV must contain at least a header row and one data row');
    });
  });

  describe('Legacy Interface Compatibility', () => {
    it('should work with the legacy parse() interface', async () => {
      const csvContent = `Date,Amount,Description,Reference
2025-09-01,100.50,Test Income,Salary`;

      const transactions = await parser.parse(csvContent);

      expect(transactions).toHaveLength(1);
      expect(transactions[0].amount.amount).toBe(100.50);
      expect(transactions[0].description).toBe('Test Income');
    });
  });
});
