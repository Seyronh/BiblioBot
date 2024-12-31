import { DataBase } from "vectorcore";

import { Book } from "../interfaces";

import { EmbeddingManager } from "./EmbeddingManager";
import { Database as sqliteDatabase, SQLQueryBindings } from "bun:sqlite";
import { maxLibrosPorPagina } from "../config.json";

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
export class DBManager {
	private embeddingDatabase: DataBase;
	private static instance: DBManager;
	private database: sqliteDatabase;
	constructor() {
		this.embeddingDatabase = new DataBase("./data");
		this.database = new sqliteDatabase("./data/database.sqlite", {
			strict: true,
		});
		this.embeddingDatabase.initialize();
	}
	public static getInstance(): DBManager {
		if (!DBManager.instance) {
			DBManager.instance = new DBManager();
		}
		return DBManager.instance;
	}
	public async getAllBooks(): Promise<Book[]> {
		const books = await this.database.query("SELECT * FROM Libros");
		return books.all().map((e) => {
			return convertToBook(e);
		});
	}
	public async insertBook(book: Book) {
		this.database
			.query(
				`INSERT INTO Libros (Titulo, Autor, Generos, Paginas, Sinopsis, Imagen) VALUES ($title, $author, $genres, $paginas, $synopsis, $image)`
			)
			.run({
				title: book.Titulo,
				author: book.Autor,
				genres: book.Generos.join(","),
				paginas: book.Paginas,
				synopsis: book.Sinopsis,
				image: arrayBufferToHex(book.Imagen),
			} as any);
		const alltext = `Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`;
		const embedding = await EmbeddingManager.getInstance().getPassageEmbedding(
			alltext
		);
		this.embeddingDatabase.addItem(embedding, {
			id: book.Titulo,
			metadata: { title: book.Titulo },
		});
		return;
	}
	public existsBook(title: string): Boolean {
		const books = this.database
			.query("SELECT * FROM Libros WHERE Titulo = $title")
			.all({ title: title });
		return books.length > 0;
	}
	public async getBookByTitle(titleinput: string): Promise<Book> {
		const books = this.database
			.query("SELECT * FROM Libros WHERE Titulo = $title")
			.all({ title: titleinput });
		if (!books[0]) return;
		return convertToBook(books[0]);
	}
	public async getSimilarBooks(
		book: Book,
		excludedTitles: string[]
	): Promise<Book[]> {
		const embedding = await this.embeddingDatabase.getAllItems({
			$title: {
				$eq: book.Titulo,
			},
		})[0].vector;
		const similarTitles = (
			await this.embeddingDatabase.getItems(embedding, 10, {
				$title: {
					$nin: excludedTitles,
				},
			})
		).map((e) => e.item.id);
		const similarbooks = this.database
			.query("SELECT * FROM Libros WHERE Titulo = '$title'")
			.all({ title: similarTitles } as unknown as SQLQueryBindings);

		return similarbooks.map((e) => {
			return convertToBook(e);
		});
	}
	public async removeBook(title: string) {
		await this.embeddingDatabase.deleteItem(title);
		this.database
			.query("DELETE FROM Libros WHERE Titulo = $title")
			.run({ title: title });
		return;
	}
	public async getRandomBooks(samples: number): Promise<Book[]> {
		const books = await this.database.query(
			`SELECT * FROM Libros ORDER BY RANDOM() LIMIT $samples`
		);
		return books.all({ samples: samples }).map((e) => {
			return convertToBook(e);
		});
	}
	public async getBooksNameAutocomplete(
		title: string,
		plaintext: boolean
	): Promise<string[]> {
		if (!plaintext) {
			const embedding = await EmbeddingManager.getInstance().getQueryEmbedding(
				title
			);
			const titles = (await this.embeddingDatabase.getItems(embedding, 25)).map(
				(e) => e.item.id
			);
			return titles;
		}
		const titles = this.database
			.query(
				`SELECT Titulo FROM Libros WHERE Titulo LIKE $title ORDER BY Titulo ASC LIMIT 25`
			)
			.all({ title: `%${title}%` });
		return titles.map((e) => (e as any).Titulo);
	}
	public exitsList(userid: string, title: string) {
		const listas = this.database
			.query(
				"SELECT * FROM Listas WHERE TituloLibro = $title AND userID = $userid"
			)
			.all({ title: title, userid: userid });
		return listas.length > 0;
	}
	public unmark(userid: string, title: string) {
		if (!this.exitsList(userid, title)) return;

		this.database
			.query(
				"DELETE FROM Listas WHERE TituloLibro = $title AND userID = $userid"
			)
			.run({ title: title, userid: userid });
	}
	public insertMark(userid: string, title: string, estado: number) {
		this.database
			.query(
				"INSERT INTO Listas (TituloLibro, userID, Estado) VALUES ($title, $userid, $estado)"
			)
			.run({ title: title, userid: userid, estado: estado });
	}
	public markasRead(userid: string, title: string) {
		if (!this.exitsList(userid, title)) {
			this.insertMark(userid, title, 0);
			return;
		}
		this.database
			.query(
				"UPDATE Listas SET Estado = 0 WHERE TituloLibro = $title AND userID = $userid"
			)
			.run({ title: title, userid: userid });
	}
	public markasReading(userid: string, title: string) {
		if (!this.exitsList(userid, title)) {
			this.insertMark(userid, title, 1);
			return;
		}
		this.database
			.query(
				"UPDATE Listas SET Estado = 1 WHERE TituloLibro = $title AND userID = $userid"
			)
			.run({ title: title, userid: userid });
	}
	public markasWishtoRead(userid: string, title: string) {
		if (!this.exitsList(userid, title)) {
			this.insertMark(userid, title, 2);
			return;
		}
		this.database
			.query(
				"UPDATE Listas SET Estado = 2 WHERE TituloLibro = $title AND userID = $userid"
			)
			.run({ title: title, userid: userid });
	}
	public getList(userid: string, offset: number, estado: number) {
		const listas = this.database
			.query(
				"SELECT TituloLibro FROM Listas WHERE userID = $userid AND Estado = $estado LIMIT $limit OFFSET $offset"
			)
			.all({
				userid: userid,
				limit: maxLibrosPorPagina,
				offset: offset,
				estado: estado,
			});
		return listas.map((e) => (e as any).TituloLibro) as string[];
	}
	public getListCount(userid: string, estado: number) {
		const listas = this.database
			.query("SELECT * FROM Listas WHERE userID = $userid AND Estado = $estado")
			.all({ userid: userid, estado: estado });
		return listas.length;
	}
}
