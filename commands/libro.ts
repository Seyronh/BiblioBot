import {
	ActionRowBuilder,
	AttachmentBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	Channel,
	CommandInteractionOptionResolver,
	SlashCommandBuilder,
	TextChannel,
} from "discord.js";
import { Command } from "../interfaces";
import { DBManager } from "../Managers/DBManager";
import { bookembedhandle } from "../handlers/bookembed";

const db = DBManager.getInstance();

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("libro")
		.setDescription("Muestra un libro en concreto")
		.addStringOption((option) =>
			option
				.setName("busqueda")
				.setDescription("El nombre del libro o una descripcion empezada por d:")
				.setRequired(true)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		const db = DBManager.getInstance();
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const id = interactionOptions.getString("busqueda");
		const book = await db.getBookByTitle(id);
		if (!book) {
			await interaction.reply({
				content: "Libro no encontrado",
				ephemeral: true,
			});
			return;
		}
		const embed = bookembedhandle(
			book,
			"Puedes ayudar añadiendo libros con el comando /sugerirlibro"
		);
		const imageBuffer = Buffer.from(book.Imagen);
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `imagen.jpg`,
		});
		const leido = new ButtonBuilder()
			.setCustomId("libro|leido")
			.setLabel("Leido")
			.setStyle(ButtonStyle.Success);
		const enprgroeso = new ButtonBuilder()
			.setCustomId("libro|enprogreso")
			.setLabel("En progreso")
			.setStyle(ButtonStyle.Primary);
		const planeandoleer = new ButtonBuilder()
			.setCustomId("libro|planeandoleer")
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
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const busqueda = interactionOptions.getFocused();
		if (busqueda.startsWith("d:")) {
			const candidatos = await db.getBooksNameAutocomplete(
				busqueda.substring(2),
				false
			);
			const mapeado = candidatos.map((candidato) => ({
				name: candidato,
				value: candidato,
			}));
			// @ts-ignore
			await interaction.respond(mapeado);
			return;
		}
		const candidatos = await db.getBooksNameAutocomplete(busqueda, true);

		const mapeado = candidatos.map((candidato) => ({
			name: candidato,
			value: candidato,
		}));
		// @ts-ignore
		await interaction.respond(mapeado);
		return;
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
				ephemeral: true,
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
				ephemeral: true,
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
				ephemeral: true,
			});
		}
	},
};
export default comando;
