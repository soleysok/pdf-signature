import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bytesPerPage,
  pickCompressedBytes,
  shouldRasterize,
} from "./compress-policy.ts";

const LARGE = 80 * 1024 * 1024;

describe("bytesPerPage", () => {
  it("uses at least one page", () => {
    assert.equal(bytesPerPage(100, 0), 100);
    assert.equal(bytesPerPage(200, 2), 100);
  });
});

describe("shouldRasterize", () => {
  it("skips raster for compact text PDFs", () => {
    assert.equal(
      shouldRasterize({
        preset: "high",
        fileSize: 20_000,
        pageCount: 2,
        largeFileBytes: LARGE,
      }),
      false,
    );
    assert.equal(
      shouldRasterize({
        preset: "small",
        fileSize: 20_000,
        pageCount: 2,
        largeFileBytes: LARGE,
      }),
      false,
    );
  });

  it("rasterizes photo scans", () => {
    assert.equal(
      shouldRasterize({
        preset: "high",
        fileSize: 4_000_000,
        pageCount: 4,
        largeFileBytes: LARGE,
      }),
      true,
    );
    assert.equal(
      shouldRasterize({
        preset: "small",
        fileSize: 2_000_000,
        pageCount: 2,
        largeFileBytes: LARGE,
      }),
      true,
    );
  });
});

describe("pickCompressedBytes", () => {
  it("never returns a larger file than the original", () => {
    const original = new Uint8Array(100);
    const raster = new Uint8Array(800);
    const picked = pickCompressedBytes({ original, lossless: null, raster });
    assert.equal(picked.strategy, "original");
    assert.equal(picked.bytes.byteLength, 100);
  });

  it("prefers the smallest candidate", () => {
    const original = new Uint8Array(1000);
    const lossless = new Uint8Array(800);
    const raster = new Uint8Array(200);
    const picked = pickCompressedBytes({ original, lossless, raster });
    assert.equal(picked.strategy, "raster");
    assert.equal(picked.bytes.byteLength, 200);
  });

  it("prefers lossless when sizes tie", () => {
    const original = new Uint8Array(50);
    const lossless = new Uint8Array(50);
    const picked = pickCompressedBytes({ original, lossless, raster: null });
    assert.equal(picked.strategy, "lossless");
  });
});
