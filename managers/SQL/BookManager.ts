import { SQLConnection } from "./SQLConnection";
import { SqlCache } from "../../caches";
import { Book } from "../../types";
import { arrayBufferToHex, hexToArrayBuffer } from "../../utils";
import { PineconeManager } from "../Pinecone/PineconeManager";
import { ListManager } from "./ListManager";

export class BookManager {
	private static instance: BookManager;
	private constructor() {}
	public static getInstance() {
		if (!BookManager.instance) {
			BookManager.instance = new BookManager();
		}
		return BookManager.instance;
	}
	public async getAllBooks(): Promise<string[]> {
		const cache = SqlCache.getInstance().getAllBooks();
		if (cache) return cache;
		const books = await SQLConnection.getInstance().executeQuery<{
			Titulo: string;
		}>("SELECT Titulo FROM Libros");
		const titulos = books.map((e) => e.Titulo);
		SqlCache.getInstance().setAllBooks(titulos);
		return titulos;
	}
	public async insertBook(book: Book): Promise<void> {
		await Promise.all([
			SQLConnection.getInstance().executeQuery<void>(
				`INSERT INTO Libros (Titulo, Autor, Generos, Paginas, Sinopsis, Imagen) VALUES (?, ?, ?, ?, ?, ?)`,
				[
					book.Titulo,
					book.Autor,
					book.Generos.split(","),
					book.Paginas,
					book.Sinopsis,
					arrayBufferToHex(book.Imagen),
				]
			),
			PineconeManager.getInstance().insertBook(book),
		]);
		SqlCache.getInstance().updateCachesInsert(book.Titulo);
		return;
	}
	public async getBookByTitle(titleinput: string): Promise<Book | undefined> {
		const cache = SqlCache.getInstance().getBookByTitle(titleinput);
		if (cache) return cache;
		const books = await SQLConnection.getInstance().executeQuery<Book>(
			`SELECT * FROM Libros WHERE Titulo = ?`,
			[titleinput]
		);
		const book = books[0];
		if (!book) return undefined;
		book.Imagen = hexToArrayBuffer(book.Imagen);
		SqlCache.getInstance().saveBookByTitle(titleinput, book);
		return book;
	}
	public async updateBookField<T extends keyof Book>(
		title: string,
		field: T,
		value: Book[T]
	): Promise<void> {
		const book = await this.getBookByTitle(title);
		if (!book) {
			throw new Error(`Book with title "${title}" not found in update.`);
		}
		book[field] = value;
		const promesas = [
			PineconeManager.getInstance().updateBook(title, book),
			SQLConnection.getInstance().executeQuery<void>(
				`UPDATE Libros SET ? = ? WHERE Titulo = ?`,
				[field, value, title]
			),
		];
		if (field === "Titulo" && typeof value === "string") {
			promesas.push(ListManager.getInstance().updateBook(title, value));
		}
		await Promise.all(promesas);
		SqlCache.getInstance().updateCachesDelete(title);
		return;
	}
	public async getSimilarBooks(
		book: Book,
		excludedTitles: string[] = []
	): Promise<Book[]> {
		const titles = await PineconeManager.getInstance().similarBooks(
			book,
			excludedTitles
		);
		const promesas: Promise<Book>[] = [];
		for (let i = 0; i < titles.length; i++) {
			promesas.push(this.getBookByTitle(titles[i]));
		}
		const similarbooks = await Promise.all(promesas);
		return similarbooks;
	}
	public async removeBook(title: string): Promise<void> {
		await Promise.all([
			PineconeManager.getInstance().delete(title),
			SQLConnection.getInstance().executeQuery<void>(
				`DELETE FROM Libros WHERE Titulo = ?`,
				[title]
			),
			ListManager.getInstance().deleteBook(title),
		]);
		SqlCache.getInstance().updateCachesDelete(title);
		return;
	}
	public async randomBooks(samples: number): Promise<Book[]> {
		const books = await SQLConnection.getInstance().executeQuery<Book>(
			`SELECT * FROM Libros ORDER BY RANDOM() LIMIT ?`,
			[samples]
		);
		return books.map((b) => {
			b.Imagen = hexToArrayBuffer(b.Imagen);
			return b;
		});
	}
	public async getBooksNameAutocomplete(
		title: string,
		plaintext: boolean,
		limit?: number
	): Promise<string[]> {
		limit = limit ?? 25;
		if (!plaintext) {
			return await PineconeManager.getInstance().getBooksNameAutocomplete(
				title,
				limit
			);
		}
		const cache = SqlCache.getInstance().getBooksNameAutocomplete(title);
		if (cache) return cache;
		const empty = title.trim() !== "";
		const books = await SQLConnection.getInstance().executeQuery<{
			Titulo: string;
		}>(
			empty
				? `SELECT Titulo FROM Libros WHERE Titulo LIKE ? ORDER BY Titulo ASC LIMIT 25`
				: `SELECT Titulo FROM Libros ORDER BY Titulo ASC LIMIT 25`,
			empty ? [`%${title}%`] : []
		);
		const result = books.map((e) => {
			return e.Titulo;
		}) as string[];
		SqlCache.getInstance().saveBooksNameAutocomplete(title, result);
		return result;
	}
}
