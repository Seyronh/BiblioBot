import { QueryOptions } from "@pinecone-database/pinecone";

import { maxCacheSize } from "../config.json";

class LRUCache {
	private capacity: number;
	private cache: any[];
	constructor(capacity) {
		this.capacity = capacity;
		this.cache = [];
	}
	get(key) {
		const index = this.cache.findIndex((entry) => entry.key === key);

		if (index === -1) {
			return -1;
		}
		const item = this.cache.splice(index, 1)[0];
		this.cache.push(item);
		return item.value;
	}
	put(key, value) {
		const index = this.cache.findIndex((entry) => entry.key === key);

		if (index !== -1) {
			this.cache.splice(index, 1);
		} else if (this.cache.length >= this.capacity) {
			this.cache.shift();
		}
		this.cache.push({ key, value });
	}
}

export class PineconeCache {
	public static instance: PineconeCache;
	private embedQuerys: LRUCache = new LRUCache(maxCacheSize);
	private embedPassages: LRUCache = new LRUCache(maxCacheSize);
	private querys: LRUCache = new LRUCache(maxCacheSize);
	private fetches: LRUCache = new LRUCache(maxCacheSize);
	public static getInstance() {
		if (!PineconeCache.instance) {
			PineconeCache.instance = new PineconeCache();
		}
		return PineconeCache.instance;
	}
	embedQuery(text: string) {
		const busqueda = text.toLowerCase().trim();
		return this.embedQuerys.get(busqueda);
	}
	saveEmbedQuery(text: string, vector: number[]) {
		const busqueda = text.toLowerCase().trim();
		this.embedQuerys.put(busqueda, vector);
	}
	saveEmbedPassage(text: string, vector: number[]) {
		const busqueda = text.toLowerCase().trim();
		this.embedPassages.put(busqueda, vector);
	}
	embedPassage(text: string) {
		const busqueda = text.toLowerCase().trim();
		return this.embedPassages.get(busqueda);
	}
	saveQuery(title: string, query: QueryOptions, results: any) {
		let key = `${title}|${query.topK}|${query.includeMetadata}`;
		if (query.filter) key += `|${query.filter.toString()}`;
		// @ts-ignore
		this.querys.put(key, results);
	}
	query(title: string, query: QueryOptions) {
		let key = `${title}|${query.topK}|${query.includeMetadata}`;
		if (query.filter) key += `|${query.filter.toString()}`;
		return this.querys.get(key);
	}
	fetch(title: string) {
		return this.fetches.get(title);
	}
	saveFetch(title: string, results: any) {
		this.fetches.put(title, results);
	}
}
