import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Channel,
	MessageFlags,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";
import { Command } from "../interfaces";
import { DBManager } from "../Managers/DBManager";
import { bookembedhandle } from "../handlers/bookembed";
import { handleBookInteraction } from "../handlers/handlebookinteraction";

const db = DBManager.getInstance();

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("libroaleatorio")
		.setDescription("Muestra un libro aleatorio") as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply();
		const book = await db.getRandomBooks(1);
		if (!book[0]) {
			await interaction.followUp({
				content: "No hay libros disponibles",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		const embed = bookembedhandle(book[0], "Libro aleatorio");
		const imageBuffer = Buffer.from(book[0].Imagen);
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `imagen.jpg`,
		});
		const leido = new ButtonBuilder()
			.setCustomId("libroaleatorio|leido")
			.setLabel("Leido")
			.setStyle(ButtonStyle.Success);
		const enprgroeso = new ButtonBuilder()
			.setCustomId("libroaleatorio|enprogreso")
			.setLabel("En progreso")
			.setStyle(ButtonStyle.Primary);
		const planeandoleer = new ButtonBuilder()
			.setCustomId("libroaleatorio|planeandoleer")
			.setLabel("Planeando leer")
			.setStyle(ButtonStyle.Secondary);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			leido,
			enprgroeso,
			planeandoleer
		);
		await interaction.editReply({
			embeds: [embed],
			files: [attachment],
			components: [row],
		});
	},
	buttons: async (interaction: ButtonInteraction) => {
		if (interaction.customId === "planeandoleer") {
			handleBookInteraction(interaction, "Libro marcado como planeando leer");
		} else if (interaction.customId === "enprogreso") {
			handleBookInteraction(interaction, "Libro marcado como en progreso");
		} else if (interaction.customId === "leido") {
			handleBookInteraction(interaction, "Libro marcado como leido");
		}
	},
};
export default comando;
