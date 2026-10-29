import * as FileSystem from 'expo-file-system/legacy';

import { shareLocalFile } from '@/shared/utils';
import { downloadRiderInvoicePdf } from '../api/invoices.api';
import { GST_INVOICE_COPY } from '../constants';
import { gstInvoicePdfFileName, parseContentDispositionFilename } from './gstInvoiceDisplay';
import { isInvoicePdfNotReadyError, mapGstInvoiceError } from './gstInvoiceErrors';
import { arrayBufferToBase64, gstInvoiceDownloadGate, isPdfBytes } from './gstInvoicePdf';

export class GstInvoiceDownloadError extends Error {
  readonly code: 'busy' | 'not-ready' | 'failed';

  constructor(message: string, code: 'busy' | 'not-ready' | 'failed') {
    super(message);
    this.name = 'GstInvoiceDownloadError';
    this.code = code;
  }
}

export const downloadAndShareGstInvoicePdf = async (input: {
  invoiceId: string;
  invoiceNumber: string;
}): Promise<void> => {
  const invoiceId = input.invoiceId.trim();
  if (!gstInvoiceDownloadGate.tryBegin(invoiceId)) {
    throw new GstInvoiceDownloadError(GST_INVOICE_COPY.downloadingLabel, 'busy');
  }

  const fileName = gstInvoicePdfFileName(input.invoiceNumber);
  const directory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
  const path = directory ? `${directory}${fileName}` : null;

  try {
    const response = await downloadRiderInvoicePdf(invoiceId);
    if (!isPdfBytes(response.bytes)) {
      throw new GstInvoiceDownloadError(GST_INVOICE_COPY.notPdf, 'failed');
    }

    const headerName = parseContentDispositionFilename(response.contentDisposition);
    const writeName = headerName?.toLowerCase().endsWith('.pdf') ? headerName : fileName;
    const writePath = directory ? `${directory}${writeName.replace(/[/\\]/g, '-')}` : path;

    if (!writePath) {
      throw new GstInvoiceDownloadError(GST_INVOICE_COPY.downloadFailed, 'failed');
    }

    await FileSystem.writeAsStringAsync(writePath, arrayBufferToBase64(response.bytes), {
      encoding: FileSystem.EncodingType.Base64,
    });
    await shareLocalFile({
      path: writePath,
      mimeType: 'application/pdf',
      dialogTitle: GST_INVOICE_COPY.downloadLabel,
      uti: 'com.adobe.pdf',
    });
  } catch (error) {
    if (error instanceof GstInvoiceDownloadError) {
      throw error;
    }
    if (isInvoicePdfNotReadyError(error)) {
      throw new GstInvoiceDownloadError(mapGstInvoiceError(error), 'not-ready');
    }
    throw new GstInvoiceDownloadError(mapGstInvoiceError(error), 'failed');
  } finally {
    gstInvoiceDownloadGate.end(invoiceId);
  }
};
