import { maxCacheSize } from "../config.json";
import { Book } from "../interfaces";
import { LRUCache } from "./LRUCache";
export class SqlCache {
	private bookbytitle: LRUCache<string, Book>;
	private booksnameautocomplete: LRUCache<string, string[]>;
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
