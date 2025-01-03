import { Client, createClient } from "@libsql/client";

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
		const books = await this.database.execute(`SELECT * FROM Libros`);
		return books.rows.map((e) => {
			return convertToBook(e);
		});
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
		return;
	}
	public async getBookByTitle(titleinput: string): Promise<Book> {
		const cache = SqlCache.getInstance().getBookByTitle(titleinput);
		if (cache) return cache;
		const books = await this.database.execute({
			sql: `SELECT * FROM Libros WHERE Titulo = ?`,
			args: [titleinput],
		});
		if (!books.rows[0]) return;
		const book = convertToBook(books.rows[0]);
		SqlCache.getInstance().saveBookByTitle(titleinput, book);
		return book;
	}
	public async existsBook(title: string): Promise<Boolean> {
		const books = await this.database.execute({
			sql: `SELECT Titulo FROM Libros WHERE Titulo = ?`,
			args: [title],
		});
		return books.rows.length > 0;
	}
	public async removeBook(title: string) {
		await this.database.execute({
			sql: `DELETE FROM Libros WHERE Titulo = ?`,
			args: [title],
		});
		return;
	}
	public async getRandomBooks(samples: number): Promise<Book[]> {
		const books = await this.database.execute({
			sql: `SELECT * FROM Libros ORDER BY RANDOM() LIMIT ?`,
			args: [samples],
		});
		return books.rows.map((e) => {
			return convertToBook(e);
		});
	}
	public async getBooksNameAutocomplete(title: string): Promise<string[]> {
		const cache = SqlCache.getInstance().getBooksNameAutocomplete(title);
		if (cache) return cache;
		let books;
		if (title.trim() !== "") {
			title = `%${title}%`;
			books = await this.database.execute({
				sql: `SELECT Titulo FROM Libros WHERE Titulo LIKE ? ORDER BY Titulo ASC LIMIT 25`,
				args: [title],
			});
		} else {
			books = await this.database.execute(
				`SELECT Titulo FROM Libros ORDER BY Titulo ASC LIMIT 25`
			);
		}
		const result = books.rows.map((e) => {
			return e.Titulo;
		});
		SqlCache.getInstance().saveBooksNameAutocomplete(title, result);
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
		const listas = await this.database.execute({
			sql: `SELECT 1 FROM Listas WHERE userID = ?`,
			args: [userid],
		});
		return listas.rows.length > 0;
	}
	public async unmarkBook(userid: string, title: string) {
		await this.database.execute({
			sql: `DELETE FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});

		return;
	}
	public async markBook(userid: string, title: string, estado: number) {
		await this.database.execute({
			sql: `INSERT INTO Listas (userID, TituloLibro, Estado) VALUES (?, ?, ?) ON CONFLICT (userID, TituloLibro) DO UPDATE SET Estado = excluded.Estado`,
			args: [userid, title, estado],
		});
		return;
	}
	public async getList(
		userid: string,
		offset: number,
		estado: number
	): Promise<string[]> {
		const listas = await this.database.execute({
			sql: `SELECT * FROM Listas WHERE userID = ? AND Estado = ? LIMIT ${maxLibrosPorPagina} OFFSET ${offset}`,
			args: [userid, estado],
		});
		return listas.rows.map((e) => {
			return e.TituloLibro;
		}) as string[];
	}
	public async getListCount(userid: string, estado: number) {
		const listas = await this.database.execute({
			sql: `SELECT COUNT(*) FROM Listas WHERE userID = ? AND Estado = ?`,
			args: [userid, estado],
		});
		return listas.rows[0]["COUNT(*)"] as number;
	}
}
