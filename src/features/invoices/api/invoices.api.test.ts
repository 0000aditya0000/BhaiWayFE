import {
  formatInvoiceByIdPath,
  formatInvoicePdfPath,
  formatListInvoicesPath,
} from './invoices.unwrap';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

assertEqual(formatListInvoicesPath({ page: 1, limit: 20 }), '/invoices?page=1&limit=20', 'list path');
assertEqual(formatListInvoicesPath({ page: 0, limit: 500 }), '/invoices?page=1&limit=100', 'clamps page/limit');
assertEqual(formatInvoiceByIdPath('inv-1'), '/invoices/inv-1', 'detail path');
assertEqual(formatInvoicePdfPath('inv-1'), '/invoices/inv-1/pdf', 'pdf path');

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('invoices.api tests passed');
