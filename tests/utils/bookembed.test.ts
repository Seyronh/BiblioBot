import { describe, it, expect } from "bun:test";
import { bookembed } from "../../utils/bookembed";
import { EmbedBuilder } from "discord.js";
import { Book } from "../../types";

describe("bookembed", () => {
	it("should return an EmbedBuilder with the correct info", () => {
		const book: Book = {
			Titulo: "TestTitle",
			Sinopsis: "TestSinopsis",
			Autor: "TestAutor",
			Generos: ["TestGenero"],
			Paginas: 100,
		};
		const footer = "TestFooter";
		const embed = bookembed(
			book,
			footer,
			{
				media: 5,
				count: 10,
			},
			50,
			5
		);
		expect(embed).toBeInstanceOf(EmbedBuilder);
		expect(embed.data.title).toBe(book.Titulo);
		expect(embed.data.description).toBe(book.Sinopsis);
		expect(embed.data.author.name).toBe(book.Autor);
		expect(embed.data.fields.length).toBe(5);
		expect(embed.data.fields[0].value).toBe(book.Generos.join(", "));
		expect(embed.data.fields[1].value).toBe(book.Paginas.toString());
		expect(embed.data.fields[2].value).toBe("5 segun 10 personas");
		expect(embed.data.fields[3].value).toBe("50");
		expect(embed.data.fields[4].value).toBe("5");
		expect(embed.data.footer.text).toBe(footer);
	});
});
