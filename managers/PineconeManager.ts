import { Index, Pinecone } from "@pinecone-database/pinecone";
import { Book } from "../types";
import { PineconeCache } from "../caches";

const removeAccents = (str) => {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};
const removeSpaces = (str) => {
	return str.replaceAll(" ", "-");
};
const cache = PineconeCache.getInstance();

export class PineconeManager {
	private static instance: PineconeManager;
	private pinecone: Pinecone;
	private index: Index;
	public static getInstance(): PineconeManager {
		if (!PineconeManager.instance) {
			PineconeManager.instance = new PineconeManager();
		}
		return PineconeManager.instance;
	}
	private constructor() {
		this.pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
		this.index = this.pinecone.index(process.env.PINECONE_INDEX);
	}
	async embedPassage(text: string) {
		const cacheResult = cache.embedPassage(text);
		if (cacheResult) return cacheResult;
		const results = (
			await this.pinecone.inference.embed(process.env.PINECONE_MODEL, [text], {
				inputType: "passage",
				truncate: "END",
			})
		)[0].values;
		cache.saveEmbedPassage(text, results);
		return results;
	}
	async embedQuery(text: string) {
		const cacheResult = cache.embedQuery(text);
		if (cacheResult) return cacheResult;
		const results = (
			await this.pinecone.inference.embed(process.env.PINECONE_MODEL, [text], {
				inputType: "query",
				truncate: "END",
			})
		)[0].values;
		cache.saveEmbedQuery(text, results);
		return results;
	}
	async insertBook(book: Book) {
		const alltext = `Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`;
		await this.index.namespace(process.env.PINECONE_NAMESPACE).upsert([
			{
				id: removeSpaces(removeAccents(book.Titulo)),
				values: await this.embedPassage(alltext),
				metadata: { titulo: book.Titulo, text: alltext },
			},
		]);
	}
	async query(titulo: string, search: any) {
		const cacheResult = cache.query(titulo, search);
		if (cacheResult) return cacheResult;
		search.vector = await this.embedQuery(titulo);
		const results = await this.index
			.namespace(process.env.PINECONE_NAMESPACE)
			.query(search);
		cache.saveQuery(titulo, search, results);
		return results;
	}
	async fetch(title: string) {
		const cacheResult = cache.fetch(title);
		if (cacheResult) return cacheResult;
		const results = await this.index
			.namespace(process.env.PINECONE_NAMESPACE)
			.fetch([removeSpaces(removeAccents(title))]);
		cache.saveFetch(title, results);
		return results;
	}
	async fetchMultiple(titles: string[]) {
		const promises = [];
		for (let i = 0; i < titles.length; i++) {
			promises.push(this.fetch(titles[i]));
		}
		const results = await Promise.all(promises);
		return results;
	}
	async getEmbedding(title: string) {
		const data = await this.fetch(title);
		return data.records[removeSpaces(removeAccents(title))].values;
	}
	async getEmbeddings(titles: string[]) {
		const data = await this.fetchMultiple(titles);
		const result = data.map((e) => e.records[Object.keys(e.records)[0]].values);
		return result;
	}
	async delete(title: string) {
		cache.delete(title);
		await this.index
			.namespace(process.env.PINECONE_NAMESPACE)
			.deleteOne(removeSpaces(removeAccents(title)));
	}
	async updateBook(titleinput: string, Book: Book) {
		const uno = this.delete(titleinput);
		const dos = this.insertBook(Book);
		await Promise.all([uno, dos]);
	}
}
