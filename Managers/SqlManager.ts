import { Client, createClient, ResultSet } from "@libsql/client";

import { maxLibrosPorPagina } from "../config.json";
import { Book } from "../interfaces";
import { SqlCache } from "../Caches/SqlCache";

function convertToBook(book: any): Book {
	book.Imagen = hexToArrayBuffer(book.Imagen);
	return {
		Titulo: book.Titulo as String,
		Autor: book.Autor as String,
		Generos: book.Generos.split(",") as String[],
		Paginas: book.Paginas as Number,
		Sinopsis: book.Sinopsis as String,
		Imagen: book.Imagen,
	} as Book;
}

function hexToArrayBuffer(input) {
	if (typeof input !== "string") {
		throw new TypeError("Expected input to be a string");
	}

	if (input.length % 2 !== 0) {
		throw new RangeError("Expected string to be an even number of characters");
	}

	const view = new Uint8Array(input.length / 2);

	for (let i = 0; i < input.length; i += 2) {
		view[i / 2] = parseInt(input.substring(i, i + 2), 16);
	}

	return view.buffer;
}
function arrayBufferToHex(arrayBuffer) {
	if (
		typeof arrayBuffer !== "object" ||
		arrayBuffer === null ||
		typeof arrayBuffer.byteLength !== "number"
	) {
		throw new TypeError("Expected input to be an ArrayBuffer");
	}

	var view = new Uint8Array(arrayBuffer);
	var result = "";
	var value;

	for (var i = 0; i < view.length; i++) {
		value = view[i].toString(16);
		result += value.length === 1 ? "0" + value : value;
	}

	return result;
}

const dbcache = SqlCache.getInstance();

export class SqlManager {
	private static instance: SqlManager;
	private database: Client;
	public static getInstance(): SqlManager {
		if (!SqlManager.instance) {
			SqlManager.instance = new SqlManager();
		}
		return SqlManager.instance;
	}
	public constructor() {
		this.database = createClient({
			url: process.env.TURSO_DB_URL,
			authToken: process.env.TURSO_AUTH_TOKEN,
		});
	}
	public async getAllBooks(): Promise<Book[]> {
		const cache = dbcache.getAllBooks();
		if (cache) return cache;
		const books: ResultSet = await this.database.execute(
			`SELECT * FROM Libros`
		);
		const converted: Book[] = books.rows.map(convertToBook);
		dbcache.setAllBooks(converted);
		return converted;
	}
	public async insertBook(book: Book) {
		await this.database.execute({
			sql: `INSERT INTO Libros (Titulo, Autor, Generos, Paginas, Sinopsis, Imagen) VALUES (?, ?, ?, ?, ?, ?)`,
			args: [
				book.Titulo,
				book.Autor,
				book.Generos.join(","),
				book.Paginas,
				book.Sinopsis,
				arrayBufferToHex(book.Imagen),
			],
		});
		dbcache.updateCaches(book.Titulo);
		return;
	}
	public async getBookByTitle(titleinput: string): Promise<Book | undefined> {
		const cache = dbcache.getBookByTitle(titleinput);
		if (cache) return cache;
		const books = await this.database.execute({
			sql: `SELECT * FROM Libros WHERE Titulo = ?`,
			args: [titleinput],
		});
		if (!books.rows[0]) return undefined;
		const book = convertToBook(books.rows[0]);
		dbcache.saveBookByTitle(titleinput, book);
		return book;
	}
	public async existsBook(title: string): Promise<Boolean> {
		const cache = dbcache.getExistsBook(title);
		if (cache) return cache;
		const books = await this.database.execute({
			sql: `SELECT Titulo FROM Libros WHERE Titulo = ?`,
			args: [title],
		});
		const exists = books.rows.length > 0;
		dbcache.saveExistsBook(title, exists);
		return exists;
	}
	public async removeBook(title: string) {
		await this.database.execute({
			sql: `DELETE FROM Libros WHERE Titulo = ?`,
			args: [title],
		});
		await this.database.execute({
			sql: `DELETE FROM Listas WHERE TituloLibro = ?`,
			args: [title],
		});
		dbcache.updateCaches(title);
		return;
	}
	public async getRandomBooks(samples: number): Promise<Book[]> {
		const books = await this.database.execute({
			sql: `SELECT * FROM Libros ORDER BY RANDOM() LIMIT ?`,
			args: [samples],
		});
		return books.rows.map(convertToBook);
	}
	public async getBooksNameAutocomplete(title: string): Promise<string[]> {
		const cache = dbcache.getBooksNameAutocomplete(title);
		if (cache) return cache;
		const empty = title.trim() !== "";
		const books = await this.database.execute({
			sql: empty
				? `SELECT Titulo FROM Libros WHERE Titulo LIKE ? ORDER BY Titulo ASC LIMIT 25`
				: `SELECT Titulo FROM Libros ORDER BY Titulo ASC LIMIT 25`,
			args: empty ? [`%${title}%`] : [],
		});
		const result = books.rows.map((e) => {
			return e.Titulo;
		}) as string[];
		dbcache.saveBooksNameAutocomplete(title, result);
		return result;
	}
	public async existsListBook(userid: number, title: string) {
		const listas = await this.database.execute({
			sql: `SELECT 1 FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});
		return listas.rows.length > 0;
	}
	public async existsList(userid: string) {
		const cache = dbcache.getExistsList(userid);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT 1 FROM Listas WHERE userID = ?`,
			args: [userid],
		});
		const exists = listas.rows.length > 0;
		dbcache.saveExistsList(userid, exists);
		return exists;
	}
	public async unmarkBook(userid: string, title: string) {
		await this.database.execute({
			sql: `DELETE FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});
		dbcache.resetExistsList(userid);
		return;
	}
	public async markBook(userid: string, title: string, estado: number) {
		await this.database.execute({
			sql: `INSERT INTO Listas (userID, TituloLibro, Estado) VALUES (?, ?, ?) ON CONFLICT (userID, TituloLibro) DO UPDATE SET Estado = excluded.Estado`,
			args: [userid, title, estado],
		});
		dbcache.saveExistsList(userid, true);
		return;
	}
	public async getList(
		userid: string,
		offset: number,
		estado: number
	): Promise<string[]> {
		const cache = dbcache.getList(userid, offset, estado);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT * FROM Listas WHERE userID = ? AND Estado = ? LIMIT ${maxLibrosPorPagina} OFFSET ${offset}`,
			args: [userid, estado],
		});
		const list = listas.rows.map((e) => {
			return e.TituloLibro;
		}) as string[];
		dbcache.saveList(userid, offset, estado, list);
		return list;
	}
	public async getListCount(userid: string, estado: number) {
		const cache = dbcache.getListCount(userid, estado);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT COUNT(*) FROM Listas WHERE userID = ? AND Estado = ?`,
			args: [userid, estado],
		});
		const count = listas.rows[0]["COUNT(*)"] as number;
		dbcache.saveListCount(userid, estado, count);
		return count;
	}
}
