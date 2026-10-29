import {
  formatGstInvoiceAmount,
  formatGstInvoiceRoute,
  formatGstRideTypeLabel,
  gstInvoicePdfFileName,
  parseContentDispositionFilename,
  shouldShowGstEmailSent,
} from './gstInvoiceDisplay';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

assertEqual(formatGstRideTypeLabel('REGULAR'), 'Outstation', 'regular ride type label');
assertEqual(formatGstRideTypeLabel('COMMUTE'), 'Daily Office Commute', 'commute ride type label');
assertEqual(
  formatGstInvoiceAmount('INR', '210.50'),
  'INR 210.50',
  'amount is concatenated from backend fields — no local GST math',
);
assertEqual(
  formatGstInvoiceAmount('INR', '95.00'),
  'INR 95.00',
  'commute amount is backend invoiceTotal',
);
assertEqual(formatGstInvoiceRoute('Hauz Khas', 'Connaught Place'), 'Hauz Khas → Connaught Place', 'route');
assertEqual(gstInvoicePdfFileName('BW-2526/000001'), 'BhaiWay-Invoice-BW-2526-000001.pdf', 'safe filename');
assertEqual(shouldShowGstEmailSent('SENT'), true, 'email sent can be shown');
assertEqual(shouldShowGstEmailSent('FAILED'), false, 'failed email is not shown as a blocking state');
assertEqual(
  parseContentDispositionFilename('attachment; filename="BhaiWay-Tax-Invoice-BW-1.pdf"'),
  'BhaiWay-Tax-Invoice-BW-1.pdf',
  'content-disposition filename',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('gstInvoiceDisplay tests passed');
