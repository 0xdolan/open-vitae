/** Save a file to the person's device. Nothing leaves the browser. */
export function downloadFile(fileName: string, content: BlobPart, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser time to start the download before releasing the data.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export type DownloadFn = typeof downloadFile;
