import { GST_INVOICE_COPY } from '../constants';
import { isInvoicePdfNotReadyError, mapGstInvoiceError } from './gstInvoiceErrors';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

assertEqual(
  mapGstInvoiceError({ status: 401, code: 'HTTP_401', message: 'Unauthorized' }),
  GST_INVOICE_COPY.sessionExpired,
  'auth expiry',
);
assertEqual(
  mapGstInvoiceError({ status: 0, code: 'NETWORK_ERROR', message: 'fail' }),
  GST_INVOICE_COPY.networkError,
  'network failure',
);
assertEqual(
  mapGstInvoiceError({
    status: 404,
    code: 'INVOICE_PDF_NOT_READY',
    message: 'Invoice PDF is not available yet',
  }),
  GST_INVOICE_COPY.pdfNotReadyBody,
  'pdf not ready uses pending copy',
);
assertEqual(
  mapGstInvoiceError({ status: 404, code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' }),
  GST_INVOICE_COPY.unavailableBody,
  'missing invoice is unavailable, not claimed as generated',
);
assertEqual(
  isInvoicePdfNotReadyError({ status: 404, code: 'INVOICE_PDF_NOT_READY', message: 'wait' }),
  true,
  'pdf-not-ready detector',
);

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('gstInvoiceErrors tests passed');
