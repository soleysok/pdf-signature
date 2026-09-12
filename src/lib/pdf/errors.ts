export function isEncryptedPdfError(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return /encrypt/i.test(msg) || /password/i.test(msg);
}

export function friendlyPdfError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : String(err);
  if (isEncryptedPdfError(err)) {
    return "This PDF is password-protected. Remove the password, then try again.";
  }
  if (/invalid pdf/i.test(msg) || /not a pdf/i.test(msg)) {
    return "That file is not a readable PDF.";
  }
  return fallback;
}
