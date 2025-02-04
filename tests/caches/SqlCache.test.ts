import { describe, it, expect, beforeEach } from "bun:test";
import { SqlCache } from "../../caches";
import { Book } from "../../types";

describe("SqlCache", () => {
	beforeEach(() => {
		SqlCache.getInstance().totalReset();
	});

	it("should return undefined for non-existent book titles", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getBookByTitle("NonExistentTitle")).toBeUndefined();
	});

	it("should store and retrieve books by title", () => {
		const cache = SqlCache.getInstance();
		const book: Book = {
			Titulo: "TestTitle",
			Sinopsis: "TestSinopsis",
			Autor: "TestAutor",
			Generos: "TestGenero",
			Paginas: 100,
		};
		cache.saveBookByTitle("TestTitle", book);
		expect(cache.getBookByTitle("TestTitle")).toEqual(book);
	});

	it("should return undefined for non-existent all books", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getAllBooks()).toBeUndefined();
	});

	it("should store and retrieve all books", () => {
		const cache = SqlCache.getInstance();
		const books: string[] = ["TestTitle1", "TestTitle2"];
		cache.setAllBooks(books);
		expect(cache.getAllBooks()).toEqual(books);
	});

	it("should return undefined for non-existent booksnameautocomplete", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getBooksNameAutocomplete("non-existent")).toBeUndefined();
	});

	it("should store and retrieve booksnameautocomplete", () => {
		const cache = SqlCache.getInstance();
		const books: string[] = ["TestTitle1", "TestTitle2"];
		cache.saveBooksNameAutocomplete("Test", books);
		expect(cache.getBooksNameAutocomplete("Test")).toEqual(books);
	});
	it("should return undefined for non-existent exists book", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getExistsBook("NonExistentTitle")).toBeUndefined();
	});

	it("should store and retrieve exists book", () => {
		const cache = SqlCache.getInstance();
		cache.saveExistsBook("TestTitle", true);
		expect(cache.getExistsBook("TestTitle")).toEqual(true);
	});
	it("should return undefined for non-existent exists list book", () => {
		const cache = SqlCache.getInstance();
		expect(
			cache.getExistsListBook("userID", "NonExistentTitle")
		).toBeUndefined();
	});

	it("should store and retrieve exists list book", () => {
		const cache = SqlCache.getInstance();
		cache.saveExistsListBook("userID", "TestTitle", true);
		expect(cache.getExistsListBook("userID", "TestTitle")).toEqual(true);
	});
	it("should return undefined for non-existent exists list", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getExistsList("userID")).toBeUndefined();
	});

	it("should store and retrieve exists list", () => {
		const cache = SqlCache.getInstance();
		cache.saveExistsList("userID", true);
		expect(cache.getExistsList("userID")).toEqual(true);
	});

	it("should return undefined for non-existent list count", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getListCount("userID", 1)).toBeUndefined();
	});

	it("should store and retrieve list count", () => {
		const cache = SqlCache.getInstance();
		cache.saveListCount("userID", 1, 10);
		expect(cache.getListCount("userID", 1)).toEqual(10);
	});

	it("should return undefined for non-existent list", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getList("userID", 0, 1)).toBeUndefined();
	});

	it("should store and retrieve list", () => {
		const cache = SqlCache.getInstance();
		const list: string[] = ["TestTitle1", "TestTitle2"];
		cache.saveList("userID", 0, 1, list);
		expect(cache.getList("userID", 0, 1)).toEqual(list);
	});

	it("should return undefined for non-existent userInfo", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getUserBookInfo("userID", "TestTitle")).toBeUndefined();
	});
	it("should reset exists list", () => {
		const cache = SqlCache.getInstance();
		cache.saveExistsList("userID", true);
		cache.resetExistsList("userID");
		expect(cache.getExistsList("userID")).toBeUndefined();
	});
	it("should return undefined for non-existent nota media", () => {
		const cache = SqlCache.getInstance();
		expect(cache.getNotaMedia("TestTitle")).toBeUndefined();
	});

	it("should store and retrieve nota media", () => {
		const cache = SqlCache.getInstance();
		const notaMedia: { media: number; count: number } = { media: 10, count: 1 };
		cache.saveNotaMedia("TestTitle", notaMedia);
		expect(cache.getNotaMedia("TestTitle")).toEqual(notaMedia);
	});

	it("should delete nota media", () => {
		const cache = SqlCache.getInstance();
		cache.saveNotaMedia("TestTitle", { media: 10, count: 1 });
		cache.resetNotaMedia("TestTitle");
		expect(cache.getNotaMedia("TestTitle")).toBeUndefined();
	});

	it("should update caches on insert", () => {
		const cache = SqlCache.getInstance();
		cache.updateCachesInsert("TestTitle");
		if (cache.getAllBooks()) expect(cache.getAllBooks()).toBe(["TestTitle"]);
	});

	it("should update caches on delete", () => {
		const cache = SqlCache.getInstance();
		const book: Book = {
			Titulo: "TestTitle",
			Sinopsis: "TestSinopsis",
			Autor: "TestAutor",
			Generos: "TestGenero",
			Paginas: 100,
		};
		cache.updateCachesDelete(book.Titulo);
		expect(cache.getBookByTitle(book.Titulo)).toBeUndefined();
		expect(cache.getBooksNameAutocomplete(book.Titulo)).toBeUndefined();
		expect(cache.getExistsBook(book.Titulo)).toBeUndefined();
		expect(cache.getNotaMedia(book.Titulo)).toBeUndefined();
	});
});
