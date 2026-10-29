import { GST_INVOICE_COPY } from '../constants';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const getApiErrorStatus = (error: unknown): number | null => {
  if (!isRecord(error) || typeof error.status !== 'number') {
    return null;
  }
  return error.status;
};

export const getApiErrorCode = (error: unknown): string => {
  if (!isRecord(error) || typeof error.code !== 'string') {
    return '';
  }
  return error.code.trim().toUpperCase();
};

export const mapGstInvoiceError = (error: unknown): string => {
  const status = getApiErrorStatus(error);
  const code = getApiErrorCode(error);
  if (status === 401 || code === 'HTTP_401') {
    return GST_INVOICE_COPY.sessionExpired;
  }
  if (status === 0 || code === 'NETWORK_ERROR' || code === 'TIMEOUT') {
    return GST_INVOICE_COPY.networkError;
  }
  if (code === 'INVOICE_PDF_NOT_READY') {
    return GST_INVOICE_COPY.pdfNotReadyBody;
  }
  if (status === 404 || code === 'INVOICE_NOT_FOUND' || code === 'HTTP_404') {
    return GST_INVOICE_COPY.unavailableBody;
  }
  if (isRecord(error) && typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }
  return GST_INVOICE_COPY.downloadFailed;
};

export const isInvoicePdfNotReadyError = (error: unknown): boolean =>
  getApiErrorCode(error) === 'INVOICE_PDF_NOT_READY';
