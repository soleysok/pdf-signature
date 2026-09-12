import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { friendlyPdfError, isEncryptedPdfError } from "./errors.ts";

describe("friendlyPdfError", () => {
  it("explains password-protected files", () => {
    const err = new Error("Input document to `PDFDocument.load` is encrypted");
    assert.equal(isEncryptedPdfError(err), true);
    assert.match(friendlyPdfError(err, "fail"), /password-protected/);
  });

  it("keeps the fallback for unknown errors", () => {
    assert.equal(friendlyPdfError(new Error("boom"), "Merge failed."), "Merge failed.");
  });
});
