import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { RepositoryFactory } from '$lib/infrastructure/factories/RepositoryFactory.js';

const categoryRepository = RepositoryFactory.createCategoryRepository();

export const POST: RequestHandler = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isPreview = formData.get('preview') === 'true';

    if (!file) {
      return json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      return json(
        { success: false, error: 'Only CSV files are supported' },
        { status: 400 }
      );
    }

    // Read file content
    const content = await file.text();
    
    // Parse CSV content
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return json(
        { success: false, error: 'Empty file' },
        { status: 400 }
      );
    }

    const headers = lines[0].split('\t');
    
    // Validate required columns for N26 format
    const requiredColumns = ['Booking Date', 'Partner Name', 'Amount (EUR)'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length > 0) {
      return json(
        { 
          success: false, 
          error: `Missing required columns: ${missingColumns.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Get existing categories for suggestion
    const categories = await categoryRepository.findAll();
    const categoriesMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat]));

    // Parse transactions
    const transactions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split('\t');
        const row: Record<string, string> = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Parse required fields
        const bookingDate = new Date(row['Booking Date']);
        const partnerName = row['Partner Name'] || '';
        const amountStr = row['Amount (EUR)'] || '0';
        const amount = parseFloat(amountStr.replace(',', '.'));

        if (isNaN(bookingDate.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format`);
          continue;
        }

        if (isNaN(amount)) {
          errors.push(`Row ${i + 1}: Invalid amount format`);
          continue;
        }

        // Suggest category based on partner name
        const suggestedCategory = suggestCategoryForTransaction(partnerName, categoriesMap);

        const transaction = {
          bookingDate: bookingDate.toISOString(),
          valueDate: row['Value Date'] ? new Date(row['Value Date']).toISOString() : bookingDate.toISOString(),
          partnerName,
          partnerIban: row['Partner Iban'] || '',
          type: row['Type'] || '',
          paymentReference: row['Payment Reference'] || '',
          accountName: row['Account Name'] || '',
          amount,
          originalAmount: row['Original Amount'] ? parseFloat(row['Original Amount'].replace(',', '.')) : amount,
          originalCurrency: row['Original Currency'] || 'EUR',
          exchangeRate: row['Exchange Rate'] ? parseFloat(row['Exchange Rate'].replace(',', '.')) : 1.0,
          suggestedCategory,
          categoryId: suggestedCategory?.id?.value || null,
          rowNumber: i + 1
        };

        transactions.push(transaction);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
      }
    }

    return json({
      success: true,
      data: {
        fileName: file.name,
        totalRows: lines.length - 1,
        transactions,
        errors,
        summary: {
          totalTransactions: transactions.length,
          errorCount: errors.length,
          parseSuccessRate: Math.round((transactions.length / (lines.length - 1)) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error analyzing import file:', error);
    return json(
      {
        success: false,
        error: 'Failed to analyze import file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

function suggestCategoryForTransaction(partnerName: string, categoriesMap: Map<string, any>) {
  if (!partnerName) return null;

  const name = partnerName.toLowerCase();
  
  // Direct match
  if (categoriesMap.has(name)) {
    return categoriesMap.get(name);
  }

  // Pattern matching for common merchants
  const patterns = [
    { keywords: ['mercadona', 'carrefour', 'lidl', 'aldi', 'dia'], category: 'alimentación' },
    { keywords: ['netflix', 'spotify', 'amazon prime', 'disney'], category: 'entretenimiento' },
    { keywords: ['repsol', 'cepsa', 'bp', 'shell', 'galp'], category: 'combustible' },
    { keywords: ['uber', 'cabify', 'blablacar'], category: 'transporte' },
    { keywords: ['zara', 'h&m', 'mango', 'el corte inglés'], category: 'ropa' },
    { keywords: ['farmacia', 'pharmacy'], category: 'salud' },
    { keywords: ['mcdonals', 'burger king', 'kfc', 'telepizza'], category: 'restaurantes' },
    { keywords: ['vodafone', 'movistar', 'orange', 'yoigo'], category: 'telecomunicaciones' },
    { keywords: ['iberdrola', 'endesa', 'naturgy', 'gas natural'], category: 'suministros' }
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some(keyword => name.includes(keyword))) {
      const category = categoriesMap.get(pattern.category);
      if (category) return category;
    }
  }

  return null;
}