import { maxCacheSize } from "../config.json";
import { Book } from "../interfaces";

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

export class SqlCache {
	private bookbytitle: LRUCache;
	private booksnameautocomplete: LRUCache;
	private static instance: SqlCache;
	public static getInstance(): SqlCache {
		if (!SqlCache.instance) {
			SqlCache.instance = new SqlCache();
		}
		return SqlCache.instance;
	}
	constructor() {
		this.bookbytitle = new LRUCache(maxCacheSize);
		this.booksnameautocomplete = new LRUCache(maxCacheSize);
	}
	getBookByTitle(titleinput: string) {
		return this.bookbytitle.get(titleinput);
	}
	saveBookByTitle(titleinput: string, book: Book) {
		this.bookbytitle.put(titleinput, book);
	}
	getBooksNameAutocomplete(title: string) {
		return this.booksnameautocomplete.get(title);
	}
	saveBooksNameAutocomplete(title: string, books: string[]) {
		this.booksnameautocomplete.put(title, books);
	}
}
