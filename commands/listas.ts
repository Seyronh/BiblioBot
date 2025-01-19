import {
	ActionRowBuilder,
	AttachmentBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonComponent,
	ButtonInteraction,
	ButtonStyle,
	Channel,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuComponent,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder,
	TextChannel,
} from "discord.js";
import { Command } from "../types";
import { DBManager } from "../managers";
import { bookembed } from "../utils";
import { maxLibrosPorPagina, maxPaginas } from "../config.json";

const Estados = ["leidos", "en progreso", "planeandos para leer"];
const IndexEstados = ["leidos", "enprogreso", "planeandoleer"];

async function responder(
	interaction: ButtonInteraction | StringSelectMenuInteraction,
	libro: number,
	pagina: number,
	type: string,
	eliminado?: boolean
) {
	const tempEmbed = new EmbedBuilder(interaction.message.embeds[0]);
	const footer = tempEmbed.data.footer.text;
	const footerSplited = footer.split(" | ");
	if (footerSplited[2].trim().split(" ")[1] !== interaction.user.id) return;
	const estado = IndexEstados.indexOf(type);

	const books = await db.getList(
		interaction.user.id,
		pagina * maxLibrosPorPagina,
		estado
	);

	if (books.length == 0 && !eliminado) {
		await interaction.editReply({
			content: `No tienes libros ${Estados[estado]}`,
		});
		return;
	} else if (eliminado && books.length == 0) {
		await interaction.editReply({
			content: `Ya no te quedan libros ${Estados[estado]}`,
			embeds: [],
			components: [],
			files: [],
		});
		return;
	}
	const totallibros = await db.getListCount(interaction.user.id, estado);

	const paginastotal = Math.ceil(totallibros / maxLibrosPorPagina);
	const paginastotalEmbed = parseInt(
		footerSplited[1].trim().split(" ")[1].split("/")[1]
	);
	if (paginastotalEmbed != paginastotal && !eliminado) return;
	let paginactual =
		parseInt(footerSplited[1].trim().split(" ")[1].split("/")[0]) - 1;
	if (paginactual > paginastotal) {
		paginactual = paginastotal;
	}
	const row1 = interaction.message.components[0];
	// @ts-ignore
	row1.components[2] = ButtonBuilder.from(
		row1.components[2] as unknown as ButtonComponent
	).setDisabled(false);
	// @ts-ignore
	row1.components[0] = ButtonBuilder.from(
		row1.components[0] as unknown as ButtonComponent
	).setDisabled(false);

	if (libro == 0 && pagina == 0) {
		// @ts-ignore
		row1.components[0] = ButtonBuilder.from(
			row1.components[0] as unknown as ButtonComponent
		).setDisabled(true);
	}
	if (libro + pagina * maxLibrosPorPagina == totallibros - 1) {
		// @ts-ignore
		row1.components[2] = ButtonBuilder.from(
			row1.components[2] as unknown as ButtonComponent
		).setDisabled(true);
	}
	const book = await db.getBookByTitle(books[libro]);
	const imageBuffer = Buffer.from(book.Imagen);
	const attachment = new AttachmentBuilder(imageBuffer, {
		name: `imagen.jpg`,
	});
	const [notaMedia, PaginasLeidas, NotaPersonal] = await Promise.all([
		db.getNotaMedia(book.Titulo),
		db.getPaginasLeidas(interaction.user.id, book.Titulo),
		db.getNota(interaction.user.id, book.Titulo),
	]);
	const embednuevo = bookembed(
		book,
		`Libro: ${libro + 1}/${books.length} | Pagina: ${
			pagina + 1
		}/${paginastotal} | userid: ${interaction.user.id}`,
		notaMedia,
		PaginasLeidas,
		NotaPersonal
	);
	const row2 = interaction.message.components[1];
	const selectmenu = StringSelectMenuBuilder.from(
		row2.components[0] as unknown as StringSelectMenuComponent
	);
	selectmenu.options.forEach((option, index) => {
		if (option.data.default) {
			option.setDefault(false);
		}
		if (index == pagina) {
			option.setDefault(true);
		}
	});
	// @ts-ignore
	row2.components[0] = selectmenu;

	await interaction.editReply({
		content: eliminado ? `Libro eliminado de la lista` : undefined,
		embeds: [embednuevo],
		files: [attachment],
		components: [row1, row2],
	});
}

const db = DBManager.getInstance();
const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("listas")
		.setDescription("Muestra tus listas de libros")
		.addStringOption((option) =>
			option
				.setName("categoria")
				.setDescription("Categoria de la lista")
				.setRequired(true)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply();
		const db = DBManager.getInstance();
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const categorialista = interactionOptions
			.getString("categoria")
			.toLowerCase()
			.split(" ")
			.join("");
		const estado = IndexEstados.indexOf(categorialista);
		if (estado == -1) {
			await interaction.followUp({
				content: "Categoria no encontrada",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		if (!(await db.existsList(interaction.user.id))) {
			await interaction.followUp({
				content: `No tienes libros ${Estados[estado]}`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const books = await db.getList(interaction.user.id, 0, estado);

		if (books.length == 0) {
			await interaction.followUp({
				content: `No tienes libros ${Estados[estado]}`,
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		const book = await db.getBookByTitle(books[0]);
		const imageBuffer = Buffer.from(book.Imagen);
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `imagen.jpg`,
		});
		const totallibros = await db.getListCount(interaction.user.id, estado);
		const paginastotal = Math.ceil(totallibros / maxLibrosPorPagina);
		const [notaMedia, PaginasLeidas, NotaPersonal] = await Promise.all([
			db.getNotaMedia(book.Titulo),
			db.getPaginasLeidas(interaction.user.id, book.Titulo),
			db.getNota(interaction.user.id, book.Titulo),
		]);
		const embed = bookembed(
			book,
			`Libro: 1/${books.length} | Pagina: 1/${paginastotal} | userid: ${interaction.user.id}`,
			notaMedia,
			PaginasLeidas,
			NotaPersonal
		);
		const atras = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|${categorialista}|atras`)
			.setLabel("Anterior")
			.setStyle(ButtonStyle.Secondary)
			.setDisabled(true);
		let paginas = [];

		for (let i = 0; i < paginastotal && i < maxPaginas; i++) {
			paginas.push(
				new StringSelectMenuOptionBuilder()
					.setLabel(`Pagina ${i + 1}`)
					.setValue(`${i + 1}`)
			);
		}
		paginas[0].setDefault(true);
		const Pagina = new StringSelectMenuBuilder()
			.setCustomId(`${comando.data.name}|${categorialista}|pagina`)
			.setPlaceholder("Pagina")
			.addOptions(...paginas);
		const siguiente = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|${categorialista}|siguiente`)
			.setLabel("Siguiente")
			.setStyle(ButtonStyle.Success);
		const borrar = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|eliminarlista|${categorialista}`)
			.setLabel("Eliminar de la lista")
			.setStyle(ButtonStyle.Danger);
		if (totallibros == 1) {
			siguiente.setDisabled(true);
		}
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			atras,
			borrar,
			siguiente
		);
		if (Pagina.options.length == 1) {
			Pagina.setDisabled(true);
		}
		const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			Pagina
		);
		await interaction.editReply({
			embeds: [embed],
			files: [attachment],
			components: [row, row2],
		});
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const Opciones = ["Leidos", "En progreso", "Planeando leer"];
		const candidatos = Opciones.filter((candidato) => {
			return candidato
				.toLowerCase()
				.startsWith(interactionOptions.getFocused().toLowerCase());
		});
		const mapeado = candidatos.map((candidato) => ({
			name: candidato,
			value: candidato.toLowerCase().split(" ").join(""),
		}));
		// @ts-ignore
		await interaction.respond(mapeado);
	},
	buttons: async (interaction: ButtonInteraction) => {
		await interaction.deferUpdate();
		try {
			const partes = interaction.customId.split("|");
			if (partes[0] === "eliminarlista") {
				if (!partes[1]) return;
				const channel: Channel = (await interaction.client.channels.fetch(
					interaction.channelId
				)) as TextChannel;
				const Message = await channel.messages.fetch(interaction.message.id);
				const title = Message.embeds[0].title;
				const footerSplited = Message.embeds[0].footer.text.split(" | ");
				if (footerSplited[2].trim().split(" ")[1] !== interaction.user.id)
					return;
				const db = DBManager.getInstance();
				await db.unmarkBook(interaction.user.id, title);
				await responder(interaction, 0, 0, partes[1], true);
			} else {
				const estado = Estados.indexOf(partes[0]);
				if (estado == -1) return;

				const books = await db.getList(interaction.user.id, 0, estado);
				if (books.length == 0) {
					await interaction.reply({
						content: "No tienes libros " + partes[0],
						flags: MessageFlags.Ephemeral,
					});
					return;
				}
				const tempEmbed = new EmbedBuilder(interaction.message.embeds[0]);
				const footer = tempEmbed.data.footer.text;
				const footerSplited = footer.split(" | ");

				const totallibros = await db.getListCount(interaction.user.id, estado);

				const paginastotal = Math.ceil(totallibros / maxLibrosPorPagina);
				const paginastotalEmbed = parseInt(
					footerSplited[1].trim().split(" ")[1].split("/")[1]
				);
				if (paginastotalEmbed != paginastotal) return;
				let libroactual =
					parseInt(footerSplited[0].trim().split(" ")[1].split("/")[0]) - 1;
				let paginactual =
					parseInt(footerSplited[1].trim().split(" ")[1].split("/")[0]) - 1;
				if (partes[1] == "siguiente") {
					if (libroactual == maxLibrosPorPagina - 1) {
						libroactual = 0;
						paginactual++;
						if (paginactual > paginastotal) return;
					} else {
						libroactual++;
					}
					await responder(interaction, libroactual, paginactual, partes[0]);
				} else if (partes[1] == "atras") {
					if (libroactual == 0) {
						libroactual = maxLibrosPorPagina - 1;
						paginactual--;
						if (paginactual < 0) return;
					} else {
						libroactual--;
					}
					await responder(interaction, libroactual, paginactual, partes[0]);
				}
			}
		} catch (error) {
			console.error(error);
		}
	},
	selectMenu: async (interaction: StringSelectMenuInteraction) => {
		const partes = interaction.customId.split("|");
		const pagina = parseInt(interaction.values[0]) - 1;
		await responder(interaction, 0, pagina, partes[0]);
	},
};
export default comando;
