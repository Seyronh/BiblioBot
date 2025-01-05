import {
	ActionRowBuilder,
	ApplicationCommandType,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ContextMenuCommandBuilder,
	MessageContextMenuCommandInteraction,
} from "discord.js";
import { Command } from "../interfaces";
import { DBManager } from "../Managers/DBManager";
import { bookembedhandle } from "../handlers/bookembed";

const db = DBManager.getInstance();
const comando: Command = {
	data: new ContextMenuCommandBuilder()
		.setName("analizar")
		.setType(ApplicationCommandType.Message as any),
	execute: async (interaction: MessageContextMenuCommandInteraction) => {
		await interaction.deferReply({ ephemeral: true });
		const message = interaction.targetMessage;
		if (!message.content || message.content.trim().length == 0) {
			await interaction.editReply("No hay contenido en el mensaje");
			return;
		}
		const candidatos = await db.getBooksNameAutocomplete(
			message.content,
			false,
			2
		);
		const vermas = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|vermas|${candidatos[0]}`)
			.setLabel("Ver más 1")
			.setStyle(ButtonStyle.Primary);
		const vermas2 = new ButtonBuilder()
			.setCustomId(`${comando.data.name}|vermas|${candidatos[1]}`)
			.setLabel("Ver más 2")
			.setStyle(ButtonStyle.Primary);
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
			const book = await db.getBookByTitle(Titulo);
			const embed = bookembedhandle(
				book,
				"para mas información usa el comando /verlibro",
				await db.getNotaMedia(book.Titulo)
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
