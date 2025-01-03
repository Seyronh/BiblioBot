import { Book } from "../interfaces";

import { PineconeManager } from "./PineconeManager";
import { SqlManager } from "./SqlManager";

export class DBManager {
	private static instance: DBManager;
	constructor() {}
	public static getInstance(): DBManager {
		if (!DBManager.instance) {
			DBManager.instance = new DBManager();
		}
		return DBManager.instance;
	}

	public async getAllBooks(): Promise<Book[]> {
		return await SqlManager.getInstance().getAllBooks();
	}
	public async insertBook(book: Book) {
		await SqlManager.getInstance().insertBook(book);
		return;
	}
	public async existsBook(title: string): Promise<Boolean> {
		return await SqlManager.getInstance().existsBook(title);
	}
	public async getBookByTitle(titleinput: string): Promise<Book> {
		return await SqlManager.getInstance().getBookByTitle(titleinput);
	}
	public async getSimilarBooks(
		book: Book,
		excludedTitles: string[]
	): Promise<Book[]> {
		const similarTitles = await PineconeManager.getInstance().query(
			book.Titulo,
			{
				topK: 5,
				includeMetadata: true,
				filter: {
					titulo: { $nin: excludedTitles },
				},
			}
		);
		let similarbooks: Book[] = [];
		for (let i = 0; i < similarTitles.matches.length; i++) {
			similarbooks.push(
				await this.getBookByTitle(similarTitles.matches[i].metadata.titulo)
			);
		}
		return similarbooks;
	}
	public async removeBook(title: string) {
		await PineconeManager.getInstance().delete(title);
		await SqlManager.getInstance().removeBook(title);

		return;
	}
	public async getRandomBooks(samples: number): Promise<Book[]> {
		return await SqlManager.getInstance().getRandomBooks(samples);
	}
	public async getBooksNameAutocomplete(
		title: string,
		plaintext: boolean
	): Promise<string[]> {
		if (!plaintext) {
			const titles = (
				await PineconeManager.getInstance().query(title, {
					topK: 25,
					includeMetadata: true,
				})
			).matches.map((e) => e.metadata.titulo as string);
			return titles;
		}
		return await SqlManager.getInstance().getBooksNameAutocomplete(title);
	}
	public async existsListBook(userid: string, title: string) {
		return await SqlManager.getInstance().existsListBook(
			parseInt(userid),
			title
		);
	}
	public async existsList(userid: string) {
		return await SqlManager.getInstance().existsList(userid);
	}
	public async unmarkBook(userid: string, title: string) {
		if (!(await this.existsListBook(userid, title))) return;

		await SqlManager.getInstance().unmarkBook(userid, title);
	}
	public async markBook(userid: string, title: string, estado: number) {
		await SqlManager.getInstance().markBook(userid, title, estado);
	}
	public async getList(
		userid: string,
		offset: number,
		estado: number
	): Promise<string[]> {
		return await SqlManager.getInstance().getList(userid, offset, estado);
	}
	public async getListCount(userid: string, estado: number) {
		return await SqlManager.getInstance().getListCount(userid, estado);
	}
}
