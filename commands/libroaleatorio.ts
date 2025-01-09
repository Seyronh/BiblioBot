import {
	ActionRowBuilder,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
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
		const embed = bookembed(
			book[0],
			"Libro aleatorio",
			await db.getNotaMedia(book[0].Titulo)
		);
		const imageBuffer = Buffer.from(book[0].Imagen);
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `imagen.jpg`,
		});
		const row = createButtonRow(comando.data.name);
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

// Function to create a row of buttons with dynamic labels and IDs
function createButtonRow(commandName: string) {
	const leido = new ButtonBuilder()
		.setCustomId(`${commandName}|leido`)
		.setLabel("Leido")
		.setStyle(ButtonStyle.Success);
	const enprogreso = new ButtonBuilder()
		.setCustomId(`${commandName}|enprogreso`)
		.setLabel("En progreso")
		.setStyle(ButtonStyle.Primary);
	const planeandoleer = new ButtonBuilder()
		.setCustomId(`${commandName}|planeandoleer`)
		.setLabel("Planeando leer")
		.setStyle(ButtonStyle.Secondary);
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		leido,
		enprogreso,
		planeandoleer
	);
}
