import { EmbedBuilder, AttachmentBuilder } from "discord.js";
import { Book } from "../interfaces";

export function bookembedhandle(book: Book, footer: string): EmbedBuilder {
	const attachmentURL = `attachment://imagen.jpg`;
	const embed = new EmbedBuilder()
		.setColor("#a0522d")
		.setTitle(book.Titulo)
		.setDescription(book.Sinopsis)
		.setAuthor({
			name: book.Autor,
			iconURL: attachmentURL,
		})
		.setFields(
			{
				name: "Generos",
				value: book.Generos.join(", "),
				inline: true,
			},
			{
				name: "Páginas",
				value: book.Paginas.toString(),
				inline: true,
			}
		)
		.setImage(attachmentURL)
		.setFooter({
			text: footer,
		});

	return embed;
}
