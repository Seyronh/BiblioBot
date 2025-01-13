import { Book } from "../types";
import { hexToArrayBuffer } from "./buffermanagement";

export function convertToBook(book: any): Book {
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
