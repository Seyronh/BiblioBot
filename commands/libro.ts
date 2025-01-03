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
	TextChannel,
} from "discord.js";
import { Command } from "../interfaces";
import { DBManager } from "../Managers/DBManager";
import { bookembedhandle } from "../handlers/bookembed";

const db = DBManager.getInstance();

const IndexEstados = ["leido", "enprogreso", "planeandoleer"];

async function handleBookInteraction(
	interaction: ButtonInteraction,
	sucessMessage: string
) {
	const channel: TextChannel = (await interaction.client.channels.fetch(
		interaction.channelId
	)) as TextChannel;
	const Message = await channel.messages.fetch(interaction.message.id);
	const title = Message.embeds[0].title;
	if (!title) {
		await interaction.reply({
			content: "Libro no encontrado",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	const state = IndexEstados.indexOf(title);
	await db.markBook(interaction.user.id, title, state);
	await interaction.reply({
		content: sucessMessage,
		flags: MessageFlags.Ephemeral,
	});
}

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
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const id = interactionOptions.getString("busqueda");
		const book = await db.getBookByTitle(id);
		if (!book) {
			await interaction.reply({
				content: "Libro no encontrado",
				flags: MessageFlags.Ephemeral,
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
			// @ts-ignore
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
