import { maxCacheSize } from "../config.json";
import { Book } from "../interfaces";
import { LRUCache } from "./LRUCache";
export class SqlCache {
	private bookbytitle: LRUCache<string, Book>;
	private booksnameautocomplete: LRUCache<string, string[]>;
	private exitsbook: LRUCache<string, boolean>;
	private AllBooks: Book[];
	private existslist: LRUCache<string, boolean>;
	private ListCount: LRUCache<string, number>;
	private List: LRUCache<string, string[]>;
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
		this.exitsbook = new LRUCache(maxCacheSize);
		this.List = new LRUCache(maxCacheSize);
		this.existslist = new LRUCache(maxCacheSize);
		this.ListCount = new LRUCache(maxCacheSize);
		this.AllBooks = undefined;
	}
	getBookByTitle(titleinput: string): Book | undefined {
		return this.bookbytitle.get(titleinput);
	}
	saveBookByTitle(titleinput: string, book: Book): void {
		this.bookbytitle.put(titleinput, book);
	}
	getAllBooks(): Book[] {
		return this.AllBooks;
	}
	setAllBooks(books: Book[]): void {
		this.AllBooks = books;
	}
	getBooksNameAutocomplete(title: string): string[] | undefined {
		return this.booksnameautocomplete.get(title);
	}
	saveBooksNameAutocomplete(title: string, books: string[]): void {
		this.booksnameautocomplete.put(title, books);
	}
	getExistsBook(title: string): boolean | undefined {
		return this.exitsbook.get(title);
	}
	saveExistsBook(title: string, exists: boolean): void {
		this.exitsbook.put(title, exists);
	}
	getExistsList(userID: string): boolean | undefined {
		return this.existslist.get(userID);
	}
	saveExistsList(userID: string, exists: boolean): void {
		this.existslist.put(userID, exists);
	}
	resetExistsList(userID: string): void {
		this.existslist.delete(userID);
	}
	getListCount(userid: string, estado: number): number {
		return this.ListCount.get(`${userid}|${estado}`);
	}
	saveListCount(userid: string, estado: number, count: number): void {
		this.ListCount.put(`${userid}|${estado}`, count);
	}
	getList(userid: string, offset: number, estado: number): string[] {
		return this.List.get(`${userid}|${offset}|${estado}`);
	}
	saveList(
		userid: string,
		offset: number,
		estado: number,
		list: string[]
	): void {
		this.List.put(`${userid}|${offset}|${estado}`, list);
	}
	updateCaches(title: string): void {
		this.bookbytitle.delete(title);
		this.booksnameautocomplete.delete(title);
		this.exitsbook.delete(title);
		this.AllBooks = null;
		this.existslist = new LRUCache(maxCacheSize);
		this.ListCount = new LRUCache(maxCacheSize);
		this.List = new LRUCache(maxCacheSize);
	}
}
