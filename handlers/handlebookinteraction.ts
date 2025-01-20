import { ButtonInteraction, TextChannel, MessageFlags } from "discord.js";
import { ListManager } from "../managers";

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
	await interaction.editReply({
		content: sucessMessage,
	});
	await ListManager.getInstance().markBook(interaction.user.id, title, state);
}
