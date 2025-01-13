import { ButtonInteraction, TextChannel, MessageFlags } from "discord.js";
import { DBManager } from "../managers";
const db = DBManager.getInstance();
const IndexEstados = ["leido", "enprogreso", "planeandoleer"];

export async function handleBookInteraction(
	interaction: ButtonInteraction,
	sucessMessage: string
) {
	await interaction.deferReply({ flags: MessageFlags.Ephemeral });
	const channel: TextChannel = (await interaction.client.channels.fetch(
		interaction.channelId
	)) as TextChannel;
	const Message = await channel.messages.fetch(interaction.message.id);
	const title = Message.embeds[0].title;
	if (!title) {
		await interaction.editReply({
			content: "Libro no encontrado",
		});
		return;
	}
	const state = IndexEstados.indexOf(interaction.customId);
	await db.markBook(interaction.user.id, title, state);
	await interaction.editReply({
		content: sucessMessage,
	});
}
