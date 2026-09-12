import { PDFDocument } from "pdf-lib";
import { friendlyPdfError, isEncryptedPdfError } from "./errors";

export async function loadPdfDocument(bytes: Uint8Array) {
  try {
    return await PDFDocument.load(bytes);
  } catch (err) {
    if (isEncryptedPdfError(err)) {
      try {
        return await PDFDocument.load(bytes, { ignoreEncryption: true });
      } catch {
        throw new Error("This PDF is password-protected. Remove the password, then try again.");
      }
    }
    throw new Error(friendlyPdfError(err, "Could not read this PDF."));
  }
}

export function copyBytes(data: Uint8Array) {
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy;
}

export function bytesToFile(data: Uint8Array, name: string) {
  return new File([copyBytes(data)], name, { type: "application/pdf" });
}
