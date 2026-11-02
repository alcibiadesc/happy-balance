import { describe, it, expect } from 'vitest';
import { parseCSV } from '../csv-parser';

const HEADER =
  '"Booking Date","Value Date","Partner Name","Partner Iban",Type,"Payment Reference","Account Name","Amount (EUR)","Original Amount","Original Currency","Exchange Rate"';

describe('parseCSV (N26)', () => {
  it('labels interest and tax rows that come without partner or reference', () => {
    const { transactions } = parseCSV(
      [
        HEADER,
        '2026-10-01,2026-10-01,,,Interest,,"Cuenta de Ahorro",7.67,,,',
        '2026-10-01,2026-10-01,,,Tax,,"Cuenta de Ahorro",-1.46,,,',
      ].join('\n')
    );

    expect(transactions.map((t) => [t.partner, t.description])).toEqual([
      ['Unknown Merchant', 'Intereses cuenta N26'],
      ['Unknown Merchant', 'Retención IRPF N26'],
    ]);
  });

  it('keeps the payment reference when there is one', () => {
    const { transactions } = parseCSV(
      [HEADER, '2026-10-01,2026-10-01,STRIPE,NL41,"Credit Transfer","RED OPOSITOR","Cuenta Autónomos",4376.73,,,'].join(
        '\n'
      )
    );

    expect(transactions[0].description).toBe('RED OPOSITOR');
    expect(transactions[0].type).toBe('Credit Transfer');
  });
});
