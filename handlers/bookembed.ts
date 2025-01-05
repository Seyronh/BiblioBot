import { EmbedBuilder } from "discord.js";
import { Book } from "../interfaces";

export function bookembedhandle(
	book: Book,
	footer: string,
	notaMedia?: {
		media: number;
		count: number;
	},
	paginasLeidas?: number,
	nota?: number
): EmbedBuilder {
	const attachmentURL = `attachment://imagen.jpg`;
	const embed = new EmbedBuilder()
		.setColor("#a0522d")
		.setTitle(book.Titulo)
		.setDescription(book.Sinopsis)
		.setAuthor({
			name: book.Autor,
			iconURL: attachmentURL,
		})
		.addFields(
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
	if (notaMedia && notaMedia.count !== 0) {
		embed.addFields({
			name: "Nota media",
			value: `${notaMedia.media.toString()} segun ${notaMedia.count} persona${
				notaMedia.count == 1 ? "" : "s"
			}`,
			inline: true,
		});
	}
	if (paginasLeidas && paginasLeidas != -1) {
		embed.addFields({
			name: "Páginas leidas",
			value: paginasLeidas.toString(),
			inline: true,
		});
	}

	if (nota && nota != -1) {
		embed.addFields({
			name: "Nota personal",
			value: nota.toString(),
			inline: true,
		});
	}
	return embed;
}
