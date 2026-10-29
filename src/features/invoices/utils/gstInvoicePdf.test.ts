import { arrayBufferToBase64, createInFlightGate, isPdfBytes } from './gstInvoicePdf';

const failed: string[] = [];

const assertEqual = (actual: unknown, expected: unknown, label: string): void => {
  if (actual !== expected) {
    failed.push(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
};

const assertTrue = (value: boolean, label: string): void => {
  if (!value) {
    failed.push(`${label}: expected true`);
  }
};

const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]).buffer;
const jsonBytes = new TextEncoder().encode('{"id":"not-a-pdf"}').buffer;

assertTrue(isPdfBytes(pdfHeader), 'PDF magic is accepted');
assertEqual(isPdfBytes(jsonBytes), false, 'JSON body is not treated as a PDF');

const encoded = arrayBufferToBase64(new Uint8Array([1, 2, 3]).buffer);
assertTrue(encoded.length > 0, 'base64 encoder produces output');

const gate = createInFlightGate();
assertTrue(gate.tryBegin('inv-1'), 'first download starts');
assertEqual(gate.tryBegin('inv-1'), false, 'duplicate tap does not start a second download');
assertTrue(gate.isBusy('inv-1'), 'in-flight id is busy');
gate.end('inv-1');
assertTrue(gate.tryBegin('inv-1'), 'download can start again after the first finishes');

if (failed.length > 0) {
  console.error(failed.join('\n'));
  process.exit(1);
}

console.log('gstInvoicePdf tests passed');
