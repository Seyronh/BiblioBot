import { EmbedBuilder } from "discord.js";
import { Book } from "../types";

function createEmbedFields(
	book: Book,
	notaMedia?: { media: number; count: number },
	paginasLeidas?: number,
	nota?: number
) {
	const fields = [
		{
			name: "Generos",
			value: book.Generos.join(", "),
			inline: true,
		},
		{
			name: "Páginas",
			value: book.Paginas.toString(),
			inline: true,
		},
	];

	if (notaMedia && notaMedia.count !== 0) {
		fields.push({
			name: "Nota media",
			value: `${notaMedia.media.toString()} segun ${notaMedia.count} persona${
				notaMedia.count == 1 ? "" : "s"
			}`,
			inline: true,
		});
	}

	if (paginasLeidas && paginasLeidas != -1) {
		fields.push({
			name: "Páginas leidas",
			value: paginasLeidas.toString(),
			inline: true,
		});
	}

	if (nota && nota != -1) {
		fields.push({
			name: "Nota personal",
			value: nota.toString(),
			inline: true,
		});
	}

	return fields;
}

function createDefaultEmbed(book: Book, footer: string): EmbedBuilder {
	const attachmentURL = `attachment://imagen.jpg`;
	const embed = new EmbedBuilder()
		.setColor("#a0522d")
		.setTitle(book.Titulo)
		.setDescription(book.Sinopsis)
		.setAuthor({
			name: book.Autor,
			iconURL: attachmentURL,
		})
		.setImage(attachmentURL)
		.setFooter({
			text: footer,
		});

	return embed;
}

export function bookembed(
	book: Book,
	footer: string,
	notaMedia?: {
		media: number;
		count: number;
	},
	paginasLeidas?: number,
	nota?: number
): EmbedBuilder {
	const embed = createDefaultEmbed(book, footer);
	embed.addFields(createEmbedFields(book, notaMedia, paginasLeidas, nota));
	return embed;
}
