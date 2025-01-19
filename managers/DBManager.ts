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
		await Promise.all([
			this.sqlmanager.insertBook(book),
			this.pineconemanager.insertBook(book),
		]);
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
		await Promise.all([
			this.pineconemanager.updateBook(titleinput, book),
			this.sqlmanager.updateBookTitle(titleinput, newtitle),
		]);
		return;
	}
	public async updateBookAuthor(titleinput: string, newauthor: string) {
		const book = await this.getBookByTitle(titleinput);
		book.Autor = newauthor;
		await Promise.all([
			this.pineconemanager.updateBook(titleinput, book),
			this.sqlmanager.updateBookAuthor(titleinput, newauthor),
		]);
		return;
	}
	public async updateBookSinopsis(titleinput: string, newsinopsis: string) {
		const book = await this.getBookByTitle(titleinput);
		book.Sinopsis = newsinopsis;
		await Promise.all([
			this.pineconemanager.updateBook(titleinput, book),
			this.sqlmanager.updateBookSinopsis(titleinput, newsinopsis),
		]);
		return;
	}
	public async updateBookPages(titleinput: string, newpages: number) {
		const book = await this.getBookByTitle(titleinput);
		book.Paginas = newpages;
		await Promise.all([
			this.pineconemanager.updateBook(titleinput, book),
			this.sqlmanager.updateBookPages(titleinput, newpages),
		]);
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
		await Promise.all([
			this.pineconemanager.updateBook(titleinput, book),
			this.sqlmanager.updateBookGenres(titleinput, newgenres),
		]);
		return;
	}
	public async getSimilarBooks(
		book: Book,
		excludedTitles: string[] = []
	): Promise<Book[]> {
		const alltext = `Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`;
		const similarTitles = await this.pineconemanager.query(alltext, {
			topK: 5,
			includeMetadata: true,
			filter: {
				titulo: { $nin: excludedTitles.concat([book.Titulo]) },
			},
		});
		const promesas = [];
		for (let i = 0; i < similarTitles.matches.length; i++) {
			promesas.push(
				this.getBookByTitle(similarTitles.matches[i].metadata.titulo)
			);
		}
		const similarbooks = await Promise.all(promesas);
		return similarbooks;
	}
	public async titleLeidosOLeyendo(userid: string) {
		return await this.sqlmanager.titleLeidosOLeyendo(userid);
	}
	public async removeBook(title: string) {
		await Promise.all([
			this.pineconemanager.delete(title),
			this.sqlmanager.removeBook(title),
		]);
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
	public async getListNoOffset(
		userid: string,
		estado: number
	): Promise<string[]> {
		return await this.sqlmanager.getListNoOffset(userid, estado);
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
	public async getEmbedding(title: string) {
		return await this.pineconemanager.getEmbedding(title);
	}
	public async getEmbeddings(titles: string[]) {
		return await this.pineconemanager.getEmbeddings(titles);
	}
	public async getAllIds(): Promise<string[]> {
		return await this.sqlmanager.getAllIds();
	}
	public async getTitleNotaPairs() {
		return await this.sqlmanager.getTitleNotaPairs();
	}
}
