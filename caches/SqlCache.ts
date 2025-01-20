import { maxCacheSize } from "../config.json";
import { Book } from "../types";
import { LRUCache } from "./base_caches/LRUCache";

export class SqlCache {
	private bookbytitle: LRUCache<string, Book>;
	private booksnameautocomplete: LRUCache<string, string[]>;
	private exitsbook: LRUCache<string, boolean>;
	private AllBooks: string[];
	private existslist: LRUCache<string, boolean>;
	private ListCount: LRUCache<string, number>;
	private List: LRUCache<string, string[]>;
	private ListNoOffset: LRUCache<string, string[]>;
	private existslistBook: LRUCache<string, boolean>;
	private UserBookInfo: LRUCache<string, { Pagina: number; Nota: number }>;
	private notaMedia: LRUCache<string, { media: number; count: number }>;
	private static instance: SqlCache;

	public static getInstance(): SqlCache {
		if (!SqlCache.instance) {
			SqlCache.instance = new SqlCache();
		}
		return SqlCache.instance;
	}

	private constructor() {
		this.bookbytitle = new LRUCache(maxCacheSize);
		this.booksnameautocomplete = new LRUCache(maxCacheSize);
		this.exitsbook = new LRUCache(maxCacheSize);
		this.List = new LRUCache(maxCacheSize);
		this.existslist = new LRUCache(maxCacheSize);
		this.ListCount = new LRUCache(maxCacheSize);
		this.existslistBook = new LRUCache(maxCacheSize);
		this.UserBookInfo = new LRUCache(maxCacheSize);
		this.notaMedia = new LRUCache(maxCacheSize);
		this.ListNoOffset = new LRUCache(maxCacheSize);
		this.AllBooks = undefined;
	}

	getBookByTitle(titleinput: string): Book | undefined {
		return this.bookbytitle.get(titleinput);
	}

	saveBookByTitle(titleinput: string, book: Book): void {
		this.bookbytitle.put(titleinput, book);
	}

	getAllBooks(): string[] {
		return this.AllBooks;
	}

	setAllBooks(books: string[]): void {
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

	getExistsListBook(userID: string, title: string): boolean | undefined {
		return this.existslistBook.get(`${userID}|${title}`);
	}

	saveExistsListBook(userID: string, title: string, exists: boolean): void {
		this.existslistBook.put(`${userID}|${title}`, exists);
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
	resetList(userid: string) {
		this.List.deleteAll(new RegExp(`${userid}\\|`));
	}
	getListNoOffset(userid: string, estado: number): string[] {
		return this.ListNoOffset.get(`${userid}|${estado}`);
	}

	saveListNoOffset(userid: string, estado: number, list: string[]): void {
		this.ListNoOffset.put(`${userid}|${estado}`, list);
	}
	resetListNoOffset(userid: string) {
		this.ListNoOffset.deleteAll(new RegExp(`${userid}\\|`));
	}

	getNotaMedia(title: string): { media: number; count: number } | undefined {
		return this.notaMedia.get(title);
	}

	saveNotaMedia(title: string, result: { media: number; count: number }): void {
		this.notaMedia.put(title, result);
	}

	resetNotaMedia(title: string): void {
		this.notaMedia.delete(title);
	}

	deleteNota(userid: string, title: string): void {
		this.UserBookInfo.delete(`${userid}|${title}`);
		this.resetNotaMedia(title);
	}
	getUserBookInfo(
		userid: string,
		title: string
	): { Pagina: number; Nota: number } {
		return this.UserBookInfo.get(`${userid}|${title}`);
	}
	saveUserBookInfo(
		userid: string,
		title: string,
		info: { Pagina: number; Nota: number }
	): void {
		this.UserBookInfo.put(`${userid}|${title}`, info);
	}
	resetUserBookInfo(userid: string, title: string): void {
		this.UserBookInfo.delete(`${userid}|${title}`);
	}
	updateCachesInsert(book: string): void {
		if (this.AllBooks) this.AllBooks.push(book);
	}

	updateCachesDelete(title: string): void {
		this.bookbytitle.delete(title);
		this.booksnameautocomplete.delete(title);
		this.exitsbook.delete(title);
		this.notaMedia.delete(title);
		this.existslistBook.deleteAll(new RegExp(`\\|${title}$`));
		this.UserBookInfo.deleteAll(new RegExp(`\\|${title}$`));
		this.existslist = new LRUCache(maxCacheSize);
		this.ListCount = new LRUCache(maxCacheSize);
		this.List = new LRUCache(maxCacheSize);
		this.ListNoOffset = new LRUCache(maxCacheSize);
		this.AllBooks = undefined;
	}
	totalReset() {
		SqlCache.instance = undefined;
	}
}
