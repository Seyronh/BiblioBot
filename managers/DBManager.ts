import { Book } from "../types";

import { PineconeManager } from "./PineconeManager";
import { SqlManager } from "./SqlManager";

export class DBManager {
	private static instance: DBManager;
	private sqlmanager = SqlManager.getInstance();
	private pineconemanager = PineconeManager.getInstance();
	private constructor() {}

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
		const uno = this.sqlmanager.insertBook(book);
		const dos = this.pineconemanager.insertBook(book);
		await Promise.all([uno, dos]);
		return;
	}
	public async existsBook(title: string): Promise<Boolean> {
		return await this.sqlmanager.existsBook(title);
	}
	public async getBookByTitle(titleinput: string): Promise<Book> {
		return await this.sqlmanager.getBookByTitle(titleinput);
	}
	public async updateBookTitle(titleinput: string, newtitle: string) {
		const book = await this.getBookByTitle(titleinput);
		book.Titulo = newtitle;
		const uno = this.pineconemanager.updateBook(titleinput, book);
		const dos = this.sqlmanager.updateBookTitle(titleinput, newtitle);
		await Promise.all([uno, dos]);
		return;
	}
	public async updateBookAuthor(titleinput: string, newauthor: string) {
		const book = await this.getBookByTitle(titleinput);
		book.Autor = newauthor;
		const uno = this.pineconemanager.updateBook(titleinput, book);
		const dos = this.sqlmanager.updateBookAuthor(titleinput, newauthor);
		await Promise.all([uno, dos]);
		return;
	}
	public async updateBookSinopsis(titleinput: string, newsinopsis: string) {
		const book = await this.getBookByTitle(titleinput);
		book.Sinopsis = newsinopsis;
		const uno = this.pineconemanager.updateBook(titleinput, book);
		const dos = this.sqlmanager.updateBookSinopsis(titleinput, newsinopsis);
		await Promise.all([uno, dos]);
		return;
	}
	public async updateBookPages(titleinput: string, newpages: number) {
		const book = await this.getBookByTitle(titleinput);
		book.Paginas = newpages;
		const uno = this.pineconemanager.updateBook(titleinput, book);
		const dos = this.sqlmanager.updateBookPages(titleinput, newpages);
		await Promise.all([uno, dos]);
		return;
	}
	public async updateBookImage(titleinput: string, newimage: ArrayBuffer) {
		const book = await this.getBookByTitle(titleinput);
		book.Imagen = newimage;
		await this.sqlmanager.updateBookImage(titleinput, newimage);
		return;
	}
	public async updateBookGenres(titleinput: string, newgenres: string[]) {
		const book = await this.getBookByTitle(titleinput);
		book.Generos = newgenres;
		const uno = this.pineconemanager.updateBook(titleinput, book);
		const dos = this.sqlmanager.updateBookGenres(titleinput, newgenres);
		await Promise.all([uno, dos]);
		return;
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
		const uno = this.pineconemanager.delete(title);
		const dos = this.sqlmanager.removeBook(title);
		await Promise.all([uno, dos]);
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
	public async markPage(userid: string, title: string, pagina: number) {
		await this.sqlmanager.markPage(userid, title, pagina);
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
	public async getPaginasLeidas(userid: string, title: string) {
		const result = await this.sqlmanager.getPaginasLeidas(userid, title);
		if (result) return result;
		return -1;
	}
	public async getNota(userid: string, title: string) {
		const result = await this.sqlmanager.getNota(userid, title);
		if (result) return result;
		return -1;
	}
	public async getNotaMedia(
		title: string
	): Promise<{ media: number; count: number }> {
		const result = await this.sqlmanager.getNotaMedia(title);
		if (result) return result;
		return { media: -1, count: 0 };
	}
	public async setNota(userid: string, title: string, nota: number) {
		await this.sqlmanager.setNota(userid, title, nota);
	}
	public async deleteNota(userid: string, title: string) {
		await this.sqlmanager.deleteNota(userid, title);
	}
}
