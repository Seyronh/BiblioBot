import {
	ActionRowBuilder,
	AttachmentBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { DBManager } from "../managers";
import { bookembed } from "../utils";
import { handleBookInteraction } from "../handlers";

const db = DBManager.getInstance();

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
		const book = await db.getBookByTitle(id);
		if (!book) {
			await interaction.followUp({
				content: "Libro no encontrado",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const embed = bookembed(
			book,
			"Puedes ayudar añadiendo libros con el comando /añadirlibro",
			await db.getNotaMedia(book.Titulo),
			await db.getPaginasLeidas(interaction.user.id, book.Titulo),
			await db.getNota(interaction.user.id, book.Titulo)
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
			planeandoleer
			//similares
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
		const candidatos = await db.getBooksNameAutocomplete(
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
		}
	},
};
export default comando;
