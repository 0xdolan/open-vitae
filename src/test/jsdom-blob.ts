/**
 * Test setup. jsdom's Blob and File have no arrayBuffer() or text()
 * (jsdom/jsdom#2524), while browsers and Node have both and the app uses them.
 * In jsdom test files this adds them using jsdom's own FileReader. In the node
 * environment there is no FileReader and Node's Blob already has both.
 */
if (typeof Blob !== 'undefined' && typeof FileReader !== 'undefined') {
  const read = <T>(blob: Blob, start: (reader: FileReader, blob: Blob) => void) =>
    new Promise<T>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as T);
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the blob.'));
      start(reader, blob);
    });

  if (!('arrayBuffer' in Blob.prototype)) {
    Object.defineProperty(Blob.prototype, 'arrayBuffer', {
      configurable: true,
      writable: true,
      value(this: Blob) {
        return read<ArrayBuffer>(this, (reader, blob) => reader.readAsArrayBuffer(blob));
      },
    });
  }
  if (!('text' in Blob.prototype)) {
    Object.defineProperty(Blob.prototype, 'text', {
      configurable: true,
      writable: true,
      value(this: Blob) {
        return read<string>(this, (reader, blob) => reader.readAsText(blob));
      },
    });
  }
}

export {};
