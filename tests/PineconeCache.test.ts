import { describe, it, expect } from "bun:test";
import { PineconeCache } from "../Caches/PineconeCache";

describe("PineconeCache", () => {
  it("should return undefined for non-existent embedQuery", () => {
    const cache = PineconeCache.getInstance();
    expect(cache.embedQuery("non-existent")).toBeUndefined();
  });

  it("should save and retrieve embedQuery", () => {
    const cache = PineconeCache.getInstance();
    const vector = [1, 2, 3];
    cache.saveEmbedQuery("test-query", vector);
    expect(cache.embedQuery("test-query")).toEqual(vector);
  });

  it("should save and retrieve embedPassage", () => {
    const cache = PineconeCache.getInstance();
    const vector = [4, 5, 6];
    cache.saveEmbedPassage("test-passage", vector);
    expect(cache.embedPassage("test-passage")).toEqual(vector);
  });

  it("should return undefined for non-existent embedPassage", () => {
    const cache = PineconeCache.getInstance();
    expect(cache.embedPassage("non-existent")).toBeUndefined();
  });
});
