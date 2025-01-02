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

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("libroaleatorio")
		.setDescription("Muestra un libro aleatorio") as SlashCommandBuilder,
	execute: async (interaction) => {
		const db = DBManager.getInstance();
		const book = await db.getRandomBooks(1);
		if (!book[0]) return;
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
		await interaction.reply({
			embeds: [embed],
			files: [attachment],
			components: [row],
		});
	},
	buttons: async (interaction: ButtonInteraction) => {
		if (interaction.customId === "planeandoleer") {
			const channel: Channel = (await interaction.client.channels.fetch(
				interaction.channelId
			)) as TextChannel;
			const Message = await channel.messages.fetch(interaction.message.id);
			const title = Message.embeds[0].title;
			const db = DBManager.getInstance();
			db.markasWishtoRead(interaction.user.id, title);
			await interaction.reply({
				content: "Libro marcado como planeando leer",
				flags: MessageFlags.Ephemeral,
			});
		} else if (interaction.customId === "enprogreso") {
			const channel: Channel = (await interaction.client.channels.fetch(
				interaction.channelId
			)) as TextChannel;
			const Message = await channel.messages.fetch(interaction.message.id);
			const title = Message.embeds[0].title;
			const db = DBManager.getInstance();
			db.markasReading(interaction.user.id, title);
			await interaction.reply({
				content: "Libro marcado como en progreso",
				flags: MessageFlags.Ephemeral,
			});
		} else if (interaction.customId === "leido") {
			const channel: Channel = (await interaction.client.channels.fetch(
				interaction.channelId
			)) as TextChannel;
			const Message = await channel.messages.fetch(interaction.message.id);
			const title = Message.embeds[0].title;
			const db = DBManager.getInstance();
			db.markasRead(interaction.user.id, title);
			await interaction.reply({
				content: "Libro marcado como leido",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
export default comando;
