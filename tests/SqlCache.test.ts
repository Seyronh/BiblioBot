import { describe, it, expect } from "bun:test";
import { SqlCache } from "../Caches/SqlCache";
import { Book } from "../interfaces";

describe("SqlCache", () => {
  it("should return undefined for non-existent book titles", () => {
    const cache = SqlCache.getInstance();
    expect(cache.getBookByTitle("NonExistentTitle")).toBeUndefined();
  });

  it("should store and retrieve books by title", () => {
    const cache = SqlCache.getInstance();
    const book: Book = {
      Titulo: "TestTitle",
      Sinopsis: "TestSinopsis",
      Autor: "TestAutor",
      Generos: ["TestGenero"],
      Paginas: 100,
    };
    cache.saveBookByTitle("TestTitle", book);
    expect(cache.getBookByTitle("TestTitle")).toEqual(book);
  });

  it("should return undefined for non-existent all books", () => {
    const cache = SqlCache.getInstance();
    expect(cache.getAllBooks()).toBeUndefined();
  });

  it("should store and retrieve all books", () => {
    const cache = SqlCache.getInstance();
    const books: Book[] = [
      {
        Titulo: "TestTitle1",
        Sinopsis: "TestSinopsis1",
        Autor: "TestAutor1",
        Generos: ["TestGenero1"],
        Paginas: 100,
      },
      {
        Titulo: "TestTitle2",
        Sinopsis: "TestSinopsis2",
        Autor: "TestAutor2",
        Generos: ["TestGenero2"],
        Paginas: 200,
      },
    ];
    cache.setAllBooks(books);
    expect(cache.getAllBooks()).toEqual(books);
  });
});
