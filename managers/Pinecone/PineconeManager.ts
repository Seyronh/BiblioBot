import {
	FetchResponse,
	Index,
	Pinecone,
	QueryByVectorValues,
	QueryResponse,
	RecordMetadata,
} from "@pinecone-database/pinecone";
import { Book } from "../../types";
import { PineconeCache } from "../../caches";

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
	async embedPassage(text: string): Promise<number[]> {
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
	async embedQuery(text: string): Promise<number[]> {
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
	async insertBook(book: Book): Promise<void> {
		const alltext = `Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`;
		await this.index.namespace(process.env.PINECONE_NAMESPACE).upsert([
			{
				id: removeSpaces(removeAccents(book.Titulo)),
				values: await this.embedPassage(alltext),
				metadata: { titulo: book.Titulo, text: alltext },
			},
		]);
	}
	async query(
		titulo: string,
		search: QueryByVectorValues
	): Promise<QueryResponse<RecordMetadata>> {
		const cacheResult = cache.query(titulo, search);
		if (cacheResult) return cacheResult;
		search.vector = await this.embedQuery(titulo);
		const results = await this.index
			.namespace(process.env.PINECONE_NAMESPACE)
			.query(search);
		cache.saveQuery(titulo, search, results);
		return results;
	}
	async fetch(title: string): Promise<FetchResponse<RecordMetadata>> {
		const cacheResult = cache.fetch(title);
		if (cacheResult) return cacheResult;
		const results = await this.index
			.namespace(process.env.PINECONE_NAMESPACE)
			.fetch([removeSpaces(removeAccents(title))]);
		cache.saveFetch(title, results);
		return results;
	}
	async fetchMultiple(
		titles: string[]
	): Promise<FetchResponse<RecordMetadata>[]> {
		const promises: Promise<FetchResponse<RecordMetadata>>[] = [];
		for (let i = 0; i < titles.length; i++) {
			promises.push(this.fetch(titles[i]));
		}
		const results = await Promise.all(promises);
		return results;
	}
	async getEmbedding(title: string): Promise<number[]> {
		const data = await this.fetch(title);
		return data.records[removeSpaces(removeAccents(title))].values;
	}
	async getEmbeddings(titles: string[]): Promise<number[][]> {
		const data = await this.fetchMultiple(titles);
		const result = data.map(
			(e) => e.records[Object.keys(e.records)[0]].values as number[]
		);
		return result;
	}
	async delete(title: string): Promise<void> {
		cache.delete(title);
		await this.index
			.namespace(process.env.PINECONE_NAMESPACE)
			.deleteOne(removeSpaces(removeAccents(title)));
	}
	async updateBook(titleinput: string, Book: Book): Promise<void> {
		await this.delete(titleinput);
		await this.insertBook(Book);
	}
	async similarBooks(
		book: Book,
		excludedTitles: string[] = []
	): Promise<string[]> {
		const alltext = `Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`;
		const similarTitles = await this.query(alltext, {
			topK: 5,
			includeMetadata: true,
			filter: {
				titulo: { $nin: excludedTitles.concat([book.Titulo]) },
			},
			vector: [],
		});
		return similarTitles.matches.map((e) => e.metadata.titulo as string);
	}
	async getBooksNameAutocomplete(
		title: string,
		limit: number = 25
	): Promise<string[]> {
		const results = await this.query(title, {
			topK: limit,
			includeMetadata: true,
			vector: [],
		});
		const titles = results.matches.map((e) => e.metadata.titulo as string);
		return titles;
	}
}
