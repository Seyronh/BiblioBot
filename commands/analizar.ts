import {
	ActionRowBuilder,
	ApplicationCommandType,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ContextMenuCommandBuilder,
	MessageContextMenuCommandInteraction,
	MessageFlags,
} from "discord.js";
import { Command } from "../types";
import { bookembed } from "../utils";
import { BookManager, ListManager } from "../managers";

const comando: Command = {
	data: new ContextMenuCommandBuilder()
		.setName("analizar")
		.setType(ApplicationCommandType.Message as any),
	execute: async (interaction: MessageContextMenuCommandInteraction) => {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		const message = interaction.targetMessage;
		if (!message.content || message.content.trim().length == 0) {
			await interaction.editReply("No hay contenido en el mensaje");
			return;
		}
		const candidatos = await BookManager.getInstance().getBooksNameAutocomplete(
			message.content,
			false,
			2
		);
		const vermas = createButton(candidatos[0], 1);
		const vermas2 = createButton(candidatos[1], 2);
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			vermas,
			vermas2
		);
		await interaction.editReply({
			content: `Los dos libros mas cercanos encontrados son: ${candidatos[0]} y ${candidatos[1]}`,
			components: [row],
		});
	},
	buttons: async (interaction: ButtonInteraction) => {
		const partes = interaction.customId.split("|");
		if (partes[0] == "vermas") {
			await interaction.deferUpdate();
			if (partes[1] == interaction.message.embeds[0].title) return;
			const Titulo = partes[1];
			const book = await BookManager.getInstance().getBookByTitle(Titulo);
			const embed = bookembed(
				book,
				"para mas información usa el comando /verlibro",
				await ListManager.getInstance().getNotaMedia(book.Titulo)
			);
			const imageBuffer = Buffer.from(book.Imagen);
			const attachment = new AttachmentBuilder(imageBuffer, {
				name: `imagen.jpg`,
			});
			await interaction.editReply({
				content: ``,
				embeds: [embed],
				files: [attachment],
			});
		}
	},
};
export default comando;

// Function to create a button with dynamic label and ID
function createButton(candidate: string, index: number) {
	return new ButtonBuilder()
		.setCustomId(`${comando.data.name}|vermas|${candidate}`)
		.setLabel(`Ver más ${index}`)
		.setStyle(ButtonStyle.Primary);
}
