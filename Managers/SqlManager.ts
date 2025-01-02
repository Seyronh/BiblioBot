import { Database } from "@sqlitecloud/drivers";

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
	private database: Database;
	public static getInstance(): SqlManager {
		if (!SqlManager.instance) {
			SqlManager.instance = new SqlManager();
		}
		return SqlManager.instance;
	}
	public constructor() {
		this.database = new Database({
			connectionstring: process.env.SQLCLOUD_CONNECTION_STRING,
			usewebsocket: false,
		});
	}
	public async getAllBooks(): Promise<Book[]> {
		const books = await this.database.sql`SELECT * FROM Libros`;

		return books.map((e) => {
			return convertToBook(e);
		});
	}
	public async insertBook(book: Book) {
		await this.database
			.sql`INSERT INTO Libros (Titulo, Autor, Generos, Paginas, Sinopsis, Imagen) VALUES (${
			book.Titulo
		}, ${book.Autor}, ${book.Generos.join(",")}, ${book.Paginas}, ${
			book.Sinopsis
		}, ${arrayBufferToHex(book.Imagen)})`;
		return;
	}
	public async getBookByTitle(titleinput: string): Promise<Book> {
		const cache = SqlCache.getInstance().getBookByTitle(titleinput);
		if (cache !== -1) return cache;
		const books = await this.database.sql`
			SELECT * FROM Libros WHERE Titulo = ${titleinput}
		`;
		if (!books[0]) return;
		const book = convertToBook(books[0]);
		SqlCache.getInstance().saveBookByTitle(titleinput, book);
		return book;
	}
	public async existsBook(title: string): Promise<Boolean> {
		const books = await this.database
			.sql`SELECT 1 FROM Libros WHERE Titulo = ${title}`;
		return books.length > 0;
	}
	public async removeBook(title: string) {
		await this.database.sql`DELETE FROM Libros WHERE Titulo = ${title}`;
		return;
	}
	public async getRandomBooks(samples: number): Promise<Book[]> {
		const books = await this.database.sql`
			SELECT * FROM Libros ORDER BY RANDOM() LIMIT ${samples}
		`;
		return books.map((e) => {
			return convertToBook(e);
		});
	}
	public async getBooksNameAutocomplete(title: string): Promise<string[]> {
		const cache = SqlCache.getInstance().getBooksNameAutocomplete(title);
		if (cache !== -1) return cache;
		let books;
		if (title.trim() !== "") {
			title = `%${title}%`;
			books = await this.database
				.sql`SELECT Titulo FROM Libros WHERE Titulo LIKE ${title} ORDER BY Titulo ASC LIMIT 25`;
		} else {
			books = await this.database
				.sql`SELECT Titulo FROM Libros ORDER BY Titulo ASC LIMIT 25`;
		}
		const result = books.map((e) => {
			return e.Titulo;
		});
		SqlCache.getInstance().saveBooksNameAutocomplete(title, result);
		return result;
	}
	public async existsList(userid: string, title: string) {
		const listas = await this.database
			.sql`SELECT 1 FROM Listas WHERE userID = ${userid} AND TituloLibro = ${title}`;
		return listas.length > 0;
	}
	public async unmark(userid: string, title: string) {
		await this.database
			.sql`DELETE FROM Listas WHERE userID = ${userid} AND TituloLibro = ${title}`;

		return;
	}
	public async insertMark(userid: string, title: string, estado: number) {
		await this.database
			.sql`INSERT INTO Listas (TituloLibro, userID, Estado) VALUES (${title}, ${userid}, ${estado})`;
	}
	public async markasRead(userid: string, title: string) {
		await this.database
			.sql`UPDATE Listas SET Estado = 0 WHERE userID = ${userid} AND TituloLibro = ${title}`;
	}
	public async markasReading(userid: string, title: string) {
		await this.database
			.sql`UPDATE Listas SET Estado = 1 WHERE userID = ${userid} AND TituloLibro = ${title}`;
	}
	public async markasWishtoRead(userid: string, title: string) {
		await this.database
			.sql`UPDATE Listas SET Estado = 2 WHERE userID = ${userid} AND TituloLibro = ${title}`;
	}
	public async getList(userid: string, offset: number, estado: number) {
		const listas = await this.database.sql`
			SELECT * FROM Listas WHERE userID = ${userid} AND Estado = ${estado} LIMIT ${maxLibrosPorPagina} OFFSET ${offset}
		`;
		return listas.map((e) => {
			return e.TituloLibro;
		});
	}
	public async getListCount(userid: string, estado: number) {
		const listas = await this.database.sql`
			SELECT COUNT(*) FROM Listas WHERE userID = ${userid} AND Estado = ${estado}`;
		console.log(listas);
		return listas;
	}
}
