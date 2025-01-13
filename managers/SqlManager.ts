import { Client, createClient, ResultSet } from "@libsql/client";

import { maxLibrosPorPagina } from "../config.json";
import { Book } from "../types";
import { SqlCache } from "../caches";
import { convertToBook, arrayBufferToHex } from "../utils";

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
	private constructor() {
		this.database = createClient({
			url: process.env.TURSO_DB_URL || ":memory:",
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
		dbcache.updateCachesInsert(book);
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
		dbcache.updateCachesDelete(title);
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
	public async existsListBook(userid: string, title: string) {
		const cache = dbcache.getExistsListBook(userid, title);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT 1 FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});
		const exists = listas.rows.length > 0;
		dbcache.saveExistsListBook(userid, title, exists);
		return exists;
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
		dbcache.resetList(userid);
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
	public async markPage(userid: string, title: string, pagina: number) {
		await this.database.execute({
			sql: `UPDATE Listas SET Pagina = ? WHERE userID = ? AND TituloLibro = ?`,
			args: [pagina, userid, title],
		});
		dbcache.resetExistsList(userid);
		return;
	}
	public async getPaginasLeidas(userid: string, title: string) {
		const cache = dbcache.getPaginasLeidas(userid, title);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT Pagina FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});
		if (listas.rows.length == 0) {
			dbcache.savePaginasLeidas(userid, title, -1);
			return;
		}
		const count = listas.rows[0]["Pagina"] as number;
		dbcache.savePaginasLeidas(userid, title, count);
		return count;
	}
	public async getNota(userid: string, title: string) {
		const cache = dbcache.getNota(userid, title);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT Nota FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});
		if (listas.rows.length == 0) {
			dbcache.saveNota(userid, title, -1);
			return;
		}
		const count = listas.rows[0]["Nota"] as number;
		dbcache.saveNota(userid, title, count);
		return count;
	}
	public async setNota(userid: string, title: string, nota: number) {
		await this.database.execute({
			sql: `UPDATE Listas SET Nota = ? WHERE userID = ? AND TituloLibro = ?`,
			args: [nota, userid, title],
		});
		dbcache.saveNota(userid, title, nota);
		dbcache.resetNotaMedia(title);
		return;
	}
	public async getNotaMedia(
		title: string
	): Promise<{ media: number; count: number }> {
		const cache = dbcache.getNotaMedia(title);
		if (cache) return cache;
		const listas = await this.database.execute({
			sql: `SELECT AVG(Nota), COUNT(Nota) FROM Listas WHERE TituloLibro = ?`,
			args: [title],
		});
		const count = {
			media: listas.rows[0]["AVG(Nota)"] as number,
			count: listas.rows[0]["COUNT(Nota)"] as number,
		};
		dbcache.saveNotaMedia(title, count);
		return count;
	}
	public async deleteNota(userid: string, title: string) {
		await this.database.execute({
			sql: `DELETE FROM Listas WHERE userID = ? AND TituloLibro = ?`,
			args: [userid, title],
		});
		dbcache.deleteNota(userid, title);
		return;
	}
	public async updateBookTitle(titleinput: string, newtitle: string) {
		const update1 = this.database.execute({
			sql: `UPDATE Libros SET Titulo = ? WHERE Titulo = ?`,
			args: [newtitle, titleinput],
		});
		const update2 = this.database.execute({
			sql: `UPDATE Listas SET TituloLibro = ? WHERE TituloLibro = ?`,
			args: [newtitle, titleinput],
		});
		await Promise.all([update1, update2]);
		dbcache.updateBookTitle(titleinput, newtitle);
	}
	public async updateBookAuthor(titleinput: string, newauthor: string) {
		await this.database.execute({
			sql: `UPDATE Libros SET Autor = ? WHERE Titulo = ?`,
			args: [newauthor, titleinput],
		});
		dbcache.updateBookAuthor(titleinput, newauthor);
	}
	public async updateBookSinopsis(titleinput: string, newsinopsis: string) {
		await this.database.execute({
			sql: `UPDATE Libros SET Sinopsis = ? WHERE Titulo = ?`,
			args: [newsinopsis, titleinput],
		});
		dbcache.updateBookSinopsis(titleinput, newsinopsis);
	}
	public async updateBookPages(titleinput: string, newpages: number) {
		await this.database.execute({
			sql: `UPDATE Libros SET Paginas = ? WHERE Titulo = ?`,
			args: [newpages, titleinput],
		});
		dbcache.updateBookPages(titleinput, newpages);
	}
	public async updateBookImage(titleinput: string, newimage: ArrayBuffer) {
		await this.database.execute({
			sql: `UPDATE Libros SET Imagen = ? WHERE Titulo = ?`,
			args: [arrayBufferToHex(newimage), titleinput],
		});
		dbcache.updateBookImage(titleinput, newimage);
	}
	public async updateBookGenres(titleinput: string, newgenres: string[]) {
		await this.database.execute({
			sql: `UPDATE Libros SET Generos = ? WHERE Titulo = ?`,
			args: [newgenres.join(","), titleinput],
		});
		dbcache.updateBookGenres(titleinput, newgenres);
	}
	public async titleLeidosOLeyendo(userid: string) {
		const listas = await this.database.execute({
			sql: `SELECT TituloLibro FROM Listas WHERE userID = ? AND (Estado = 1 OR Estado = 0)`,
			args: [userid],
		});
		return listas.rows.map((e) => {
			return e.TituloLibro;
		}) as string[];
	}
}
