import { describe, it, expect, beforeEach } from "bun:test";
import { PineconeCache } from "../../caches";

describe("PineconeCache", () => {
	beforeEach(() => {
		//@ts-ignore
		PineconeCache.instance = undefined;
	});
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
	it("should return undefined for non-existent Query", () => {
		const cache = PineconeCache.getInstance();
		expect(
			cache.query("non-existent", { topK: 10, vector: [] })
		).toBeUndefined();
	});

	it("should save and retrieve query", () => {
		const cache = PineconeCache.getInstance();
		const vector = [1, 2, 3];
		cache.saveQuery("test-query", { topK: 10, vector: [] }, vector);
		expect(cache.query("test-query", { topK: 10, vector: [] })).toEqual(vector);
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
	it("should save and retrieve Fetch", () => {
		const cache = PineconeCache.getInstance();
		const vector = [4, 5, 6];
		cache.saveFetch("test-passage", vector);
		expect(cache.fetch("test-passage")).toEqual(vector);
	});

	it("should return undefined for non-existent Fetch", () => {
		const cache = PineconeCache.getInstance();
		expect(cache.fetch("non-existent")).toBeUndefined();
	});
});
