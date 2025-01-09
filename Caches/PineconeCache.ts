import { QueryOptions } from "@pinecone-database/pinecone";
import { LRUCache } from "./LRUCache";
import { maxCacheSize } from "../config.json";

export class PineconeCache {
	public static instance: PineconeCache;
	private embedQuerys: LRUCache<string, number[]> = new LRUCache(maxCacheSize);
	private embedPassages: LRUCache<string, number[]> = new LRUCache(
		maxCacheSize
	);
	private querys: LRUCache<string, any> = new LRUCache(maxCacheSize);
	private fetches: LRUCache<string, any> = new LRUCache(maxCacheSize);
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
