import { BookManager, PineconeManager } from "./managers";

import { Book } from "./types";
//Genera una funcion que tome un string y devuelva un objeto del tipo Book el string sera asi:`Titulo: ${book.Titulo}\nSinopsis: ${book.Sinopsis}\nAutor: ${book.Autor}\nGeneros: ${book.Generos}\nPaginas: ${book.Paginas}`
function parseBook(text: string): Book {
	const lines = text.split("\n");
	const book: Book = {
		Titulo: "",
		Sinopsis: "",
		Autor: "",
		Generos: "",
		Paginas: 0,
	};
	for (const line of lines) {
		const [key, value] = line.split(": ");
		if (key === "Titulo") book.Titulo = value;
		if (key === "Sinopsis") book.Sinopsis = value;
		if (key === "Autor") book.Autor = value;
		if (key === "Generos") book.Generos = value;
		if (key === "Paginas") book.Paginas = parseInt(value);
	}
	return book;
}
//@ts-ignore
const index = PineconeManager.getInstance().index;
index
	.namespace(process.env.PINECONE_NAMESPACE)
	.query({
		topK: 100,
		vector: new Array(1024).fill(0),
		includeMetadata: true,
	})
	.then((r) => {
		r.matches.forEach(async (match) => {
			const book = parseBook(match.metadata.text as string);
			await BookManager.getInstance().insertBook(book);
		});
	});
