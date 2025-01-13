import { maxCacheSize } from "../config.json";
import { Book } from "../types";
import { LRUCache } from "./base_caches/LRUCache";

export class SqlCache {
	private bookbytitle: LRUCache<string, Book>;
	private booksnameautocomplete: LRUCache<string, string[]>;
	private exitsbook: LRUCache<string, boolean>;
	private AllBooks: Book[];
	private existslist: LRUCache<string, boolean>;
	private ListCount: LRUCache<string, number>;
	private List: LRUCache<string, string[]>;
	private existslistBook: LRUCache<string, boolean>;
	private paginasLeidas: LRUCache<string, number>;
	private nota: LRUCache<string, number>;
	private notaMedia: LRUCache<string, { media: number; count: number }>;
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
		this.existslistBook = new LRUCache(maxCacheSize);
		this.paginasLeidas = new LRUCache(maxCacheSize);
		this.nota = new LRUCache(maxCacheSize);
		this.notaMedia = new LRUCache(maxCacheSize);
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

	getPaginasLeidas(userID: string, title: string): number {
		return this.paginasLeidas.get(`${userID}|${title}`);
	}

	savePaginasLeidas(userID: string, title: string, count: number): void {
		this.paginasLeidas.put(`${userID}|${title}`, count);
	}

	getNota(userID: string, title: string): number {
		return this.nota.get(`${userID}|${title}`);
	}

	saveNota(userID: string, title: string, count: number): void {
		this.nota.put(`${userID}|${title}`, count);
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
		this.nota.delete(`${userid}|${title}`);
		this.resetNotaMedia(title);
	}

	updateCachesInsert(book: Book): void {
		if (this.AllBooks) this.AllBooks.push(book);
	}
	updateBookTitle(titleinput: string, newtitle: string): void {
		const book = this.bookbytitle.get(titleinput);
		if (book) {
			book.Titulo = newtitle;
			this.bookbytitle.put(newtitle, book);
		}
		this.updateCachesDelete(titleinput);
	}

	updateBookAuthor(titleinput: string, newauthor: string): void {
		const book = this.bookbytitle.get(titleinput);
		if (book) {
			book.Autor = newauthor;
			this.bookbytitle.put(titleinput, book);
		}
		if (this.AllBooks)
			this.AllBooks = this.AllBooks.map((book) => {
				if (book.Titulo === titleinput) {
					book.Autor = newauthor;
				}
				return book;
			});
	}
	updateBookSinopsis(titleinput: string, newsinopsis: string): void {
		const book = this.bookbytitle.get(titleinput);
		if (book) {
			book.Sinopsis = newsinopsis;
			this.bookbytitle.put(titleinput, book);
		}

		if (this.AllBooks)
			this.AllBooks = this.AllBooks.map((book) => {
				if (book.Titulo === titleinput) {
					book.Sinopsis = newsinopsis;
				}
				return book;
			});
	}
	updateBookPages(titleinput: string, newpages: number): void {
		const book = this.bookbytitle.get(titleinput);
		if (book) {
			book.Paginas = newpages;
			this.bookbytitle.put(titleinput, book);
		}
		if (this.AllBooks)
			this.AllBooks = this.AllBooks.map((book) => {
				if (book.Titulo === titleinput) {
					book.Paginas = newpages;
				}
				return book;
			});
	}
	updateBookImage(titleinput: string, newimage: ArrayBuffer): void {
		const book = this.bookbytitle.get(titleinput);
		if (book) {
			book.Imagen = newimage;
			this.bookbytitle.put(titleinput, book);
		}
		if (this.AllBooks)
			this.AllBooks = this.AllBooks.map((book) => {
				if (book.Titulo === titleinput) {
					book.Imagen = newimage;
				}
				return book;
			});
	}
	updateBookGenres(titleinput: string, newgenres: string[]): void {
		const book = this.bookbytitle.get(titleinput);
		if (book) {
			book.Generos = newgenres;
			this.bookbytitle.put(titleinput, book);
		}
		if (this.AllBooks)
			this.AllBooks = this.AllBooks.map((book) => {
				if (book.Titulo === titleinput) {
					book.Generos = newgenres;
				}
				return book;
			});
	}

	updateCachesDelete(title: string): void {
		this.bookbytitle.delete(title);
		this.booksnameautocomplete.delete(title);
		this.exitsbook.delete(title);
		this.notaMedia.delete(title);
		this.existslistBook.deleteAll(new RegExp(`\\|${title}$`));
		this.paginasLeidas.deleteAll(new RegExp(`\\|${title}$`));
		this.nota.deleteAll(new RegExp(`\\|${title}$`));
		this.existslist = new LRUCache(maxCacheSize);
		this.ListCount = new LRUCache(maxCacheSize);
		this.List = new LRUCache(maxCacheSize);
		if (this.AllBooks)
			this.AllBooks = this.AllBooks.filter((book) => book.Titulo !== title);
	}
	totalReset() {
		SqlCache.instance = undefined;
	}
}
