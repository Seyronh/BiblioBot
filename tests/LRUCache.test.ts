import { describe, it, expect } from "bun:test";
import { LRUCache } from "../caches/base_caches/LRUCache";

describe("LRUCache", () => {
	it("should return undefined for non-existent keys", () => {
		const cache = new LRUCache<string, number>(2);
		expect(cache.get("key1")).toBeUndefined();
	});

	it("should store and retrieve values", () => {
		const cache = new LRUCache<string, number>(2);
		cache.put("key1", 1);
		expect(cache.get("key1")).toBe(1);
	});

	it("should evict the least recently used item when capacity is exceeded", () => {
		const cache = new LRUCache<string, number>(2);
		cache.put("key1", 1);
		cache.put("key2", 2);
		cache.put("key3", 3);
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key2")).toBe(2);
		expect(cache.get("key3")).toBe(3);
	});

	it("should update the value of an existing key", () => {
		const cache = new LRUCache<string, number>(2);
		cache.put("key1", 1);
		cache.put("key1", 2);
		expect(cache.get("key1")).toBe(2);
	});

	it("should delete a key", () => {
		const cache = new LRUCache<string, number>(2);
		cache.put("key1", 1);
		cache.delete("key1");
		expect(cache.get("key1")).toBeUndefined();
	});

	it("should delete all keys matching a regex", () => {
		const cache = new LRUCache<string, number>(2);
		cache.put("key1", 1);
		cache.put("key2", 2);
		cache.deleteAll(/key/);
		expect(cache.get("key1")).toBeUndefined();
		expect(cache.get("key2")).toBeUndefined();
	});
});
