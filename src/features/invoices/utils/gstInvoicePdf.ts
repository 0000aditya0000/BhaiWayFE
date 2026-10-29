export const createInFlightGate = () => {
  const ids = new Set<string>();
  return {
    tryBegin(id: string): boolean {
      const key = id.trim();
      if (!key || ids.has(key)) {
        return false;
      }
      ids.add(key);
      return true;
    },
    end(id: string): void {
      ids.delete(id.trim());
    },
    isBusy(id: string): boolean {
      return ids.has(id.trim());
    },
  };
};

export const gstInvoiceDownloadGate = createInFlightGate();

export const isPdfBytes = (bytes: ArrayBuffer): boolean => {
  if (bytes.byteLength < 4) {
    return false;
  }
  const header = new Uint8Array(bytes, 0, 4);
  return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
};

export const arrayBufferToBase64 = (bytes: ArrayBuffer): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const data = new Uint8Array(bytes);
  let output = '';
  for (let i = 0; i < data.length; i += 3) {
    const a = data[i]!;
    const b = i + 1 < data.length ? data[i + 1]! : 0;
    const c = i + 2 < data.length ? data[i + 2]! : 0;
    const triple = (a << 16) | (b << 8) | c;
    output += chars[(triple >> 18) & 63];
    output += chars[(triple >> 12) & 63];
    output += i + 1 < data.length ? chars[(triple >> 6) & 63] : '=';
    output += i + 2 < data.length ? chars[triple & 63] : '=';
  }
  return output;
};
