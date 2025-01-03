import { Book } from "../interfaces";

import { PineconeManager } from "./PineconeManager";
import { SqlManager } from "./SqlManager";

export class DBManager {
	private static instance: DBManager;
	private sqlmanager = SqlManager.getInstance();
	private pineconemanager = PineconeManager.getInstance();
	constructor() {}

	public static getInstance(): DBManager {
		if (!DBManager.instance) {
			DBManager.instance = new DBManager();
		}
		return DBManager.instance;
	}
	public async getAllBooks(): Promise<Book[]> {
		return await this.sqlmanager.getAllBooks();
	}
	public async insertBook(book: Book) {
		await this.sqlmanager.insertBook(book);
		await this.pineconemanager.insertBook(book);
		return;
	}
	public async existsBook(title: string): Promise<Boolean> {
		return await this.sqlmanager.existsBook(title);
	}
	public async getBookByTitle(titleinput: string): Promise<Book> {
		return await this.sqlmanager.getBookByTitle(titleinput);
	}
	public async getSimilarBooks(
		book: Book,
		excludedTitles: string[]
	): Promise<Book[]> {
		const alltext = `Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`;
		const similarTitles = await this.pineconemanager.query(alltext, {
			topK: 5,
			includeMetadata: true,
			filter: {
				titulo: { $nin: excludedTitles.concat([book.Titulo]) },
			},
		});
		let similarbooks: Book[] = [];
		for (let i = 0; i < similarTitles.matches.length; i++) {
			similarbooks.push(
				await this.getBookByTitle(similarTitles.matches[i].metadata.titulo)
			);
		}
		return similarbooks;
	}
	public async removeBook(title: string) {
		await this.pineconemanager.delete(title);
		await this.sqlmanager.removeBook(title);

		return;
	}
	public async getRandomBooks(samples: number): Promise<Book[]> {
		return await this.sqlmanager.getRandomBooks(samples);
	}
	public async getBooksNameAutocomplete(
		title: string,
		plaintext: boolean,
		limit?: number
	): Promise<string[]> {
		limit = limit ?? 25;
		if (!plaintext) {
			const titles = (
				await this.pineconemanager.query(title, {
					topK: limit,
					includeMetadata: true,
				})
			).matches.map((e) => e.metadata.titulo as string);
			return titles;
		}
		return await this.sqlmanager.getBooksNameAutocomplete(title);
	}
	public async existsListBook(userid: string, title: string) {
		return await this.sqlmanager.existsListBook(userid, title);
	}
	public async existsList(userid: string) {
		return await this.sqlmanager.existsList(userid);
	}
	public async unmarkBook(userid: string, title: string) {
		if (!(await this.existsListBook(userid, title))) return;
		await this.sqlmanager.unmarkBook(userid, title);
	}
	public async markBook(userid: string, title: string, estado: number) {
		await this.sqlmanager.markBook(userid, title, estado);
	}
	public async getList(
		userid: string,
		offset: number,
		estado: number
	): Promise<string[]> {
		return await this.sqlmanager.getList(userid, offset, estado);
	}
	public async getListCount(userid: string, estado: number) {
		return await this.sqlmanager.getListCount(userid, estado);
	}
}
