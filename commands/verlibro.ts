import {
	ActionRowBuilder,
	AttachmentBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CommandInteractionOptionResolver,
	EmbedBuilder,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { bookembed } from "../utils";
import { handleBookInteraction } from "../handlers";
import { BookManager, ListManager } from "../managers";

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("verlibro")
		.setDescription("Ver un libro en concreto")
		.addStringOption((option) =>
			option
				.setName("busqueda")
				.setDescription("El nombre del libro o una descripcion empezada por d:")
				.setRequired(true)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply();
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const id = interactionOptions.getString("busqueda");
		const book = await BookManager.getInstance().getBookByTitle(id);
		if (!book) {
			await interaction.followUp({
				content: "Libro no encontrado",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const listmanager = ListManager.getInstance();
		const [notaMedia, info] = await Promise.all([
			listmanager.getNotaMedia(book.Titulo),
			listmanager.getUserBookInfo(interaction.user.id, book.Titulo),
		]);
		const embed = bookembed(
			book,
			"Puedes ayudar añadiendo libros con el comando /añadirlibro",
			notaMedia,
			info.Pagina,
			info.Nota
		);
		const imageBuffer = Buffer.from(book.Imagen);
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `imagen.jpg`,
		});
		const leido = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|leido`)
			.setLabel("Leido")
			.setStyle(ButtonStyle.Success);
		const enprgroeso = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|enprogreso`)
			.setLabel("En progreso")
			.setStyle(ButtonStyle.Primary);
		const planeandoleer = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|planeandoleer`)
			.setLabel("Planeando leer")
			.setStyle(ButtonStyle.Secondary);
		const similares = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|similares`)
			.setLabel("Libros similares")
			.setStyle(ButtonStyle.Danger);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			leido,
			enprgroeso,
			planeandoleer,
			similares
		);
		await interaction.editReply({
			embeds: [embed],
			files: [attachment],
			components: [row],
		});
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const busqueda = interactionOptions.getFocused();
		const avanzada = busqueda.startsWith("d:");
		const candidatos = await BookManager.getInstance().getBooksNameAutocomplete(
			avanzada ? busqueda.substring(2) : busqueda,
			!avanzada
		);
		const mapeado = candidatos.map((candidato) => ({
			name: candidato,
			value: candidato,
		}));
		try {
			await interaction.respond(mapeado);
		} catch (error) {}
		return;
	},
	buttons: async (interaction: ButtonInteraction) => {
		if (interaction.customId === "planeandoleer") {
			await handleBookInteraction(
				interaction,
				"Libro marcado como planeando leer"
			);
		} else if (interaction.customId === "enprogreso") {
			await handleBookInteraction(
				interaction,
				"Libro marcado como en progreso"
			);
		} else if (interaction.customId === "leido") {
			await handleBookInteraction(interaction, "Libro marcado como leido");
		} else if (interaction.customId === "similares") {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });
			await handleSimilares(interaction);
		} else if (interaction.customId.split("|")[0] === "Similares") {
			await interaction.deferUpdate();
			const partes = interaction.message.embeds[0].footer.text.split(" | ");
			if (partes[1].split(" ")[1] !== interaction.user.id) return;
			const boton = interaction.customId.split("|")[1];
			const titulo = partes[2];
			const libroTexto = partes[0];
			const libro = libroTexto.split(" ")[1];
			const dividido = libro.split("/");
			let libroactual = parseInt(dividido[0]);
			const libromaximo = parseInt(dividido[1]);
			if (boton === "siguiente") {
				if (libroactual < libromaximo) {
					libroactual++;
				}
			} else if (boton === "atras") {
				if (libroactual > 1) {
					libroactual--;
				}
			}
			await responder(interaction, libroactual - 1, titulo);
		}
	},
};
export default comando;

async function responder(
	interaction: ButtonInteraction,
	libroactual: number,
	titulo: string
) {
	const tempEmbed = new EmbedBuilder(interaction.message.embeds[0]);
	const footer = tempEmbed.data.footer.text;
	const footerSplited = footer.split(" | ");
	if (footerSplited[1].trim().split(" ")[1] !== interaction.user.id) return;
	const book = await BookManager.getInstance().getBookByTitle(titulo);
	const similares = await BookManager.getInstance().getSimilarBooks(book);

	const embed = bookembed(
		similares[libroactual],
		`Libro: ${libroactual + 1}/${similares.length} | userid: ${
			interaction.user.id
		} | ${titulo}`,
		await ListManager.getInstance().getNotaMedia(similares[libroactual].Titulo)
	);
	const imageBuffer = Buffer.from(similares[libroactual].Imagen);
	const attachment = new AttachmentBuilder(imageBuffer, {
		name: `imagen.jpg`,
	});
	const atras = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Similares|atras`)
		.setLabel("Anterior")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(libroactual === 0);
	const siguiente = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Similares|siguiente`)
		.setLabel("Siguiente")
		.setStyle(ButtonStyle.Success)
		.setDisabled(libroactual === similares.length - 1);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
		atras,
		siguiente,
	]);
	await interaction.editReply({
		embeds: [embed],
		files: [attachment],
		components: [row],
	});
}

async function handleSimilares(interaction: ButtonInteraction) {
	const title = interaction.message.embeds[0].title;
	if (!title) {
		await interaction.editReply({
			content: "Libro no encontrado",
		});
		return;
	}
	const book = await BookManager.getInstance().getBookByTitle(title);
	if (!book) {
		await interaction.editReply({
			content: "Libro no encontrado",
		});
		return;
	}
	const similares = await BookManager.getInstance().getSimilarBooks(book);
	if (!similares) {
		await interaction.editReply({
			content: "No se encontraron libros similares",
		});
		return;
	}
	const embed = bookembed(
		similares[0],
		`Libro: 1/${similares.length} | userid: ${interaction.user.id} | ${title}`,
		await ListManager.getInstance().getNotaMedia(similares[0].Titulo)
	);
	const imageBuffer = Buffer.from(similares[0].Imagen);
	const attachment = new AttachmentBuilder(imageBuffer, {
		name: `imagen.jpg`,
	});
	const atras = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Similares|atras`)
		.setLabel("Anterior")
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);
	const siguiente = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Similares|siguiente`)
		.setLabel("Siguiente")
		.setStyle(ButtonStyle.Success);
	const row = new ActionRowBuilder<ButtonBuilder>().addComponents([
		atras,
		siguiente,
	]);
	await interaction.editReply({
		embeds: [embed],
		files: [attachment],
		components: [row],
	});
}
