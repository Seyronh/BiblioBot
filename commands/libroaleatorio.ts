import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
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
		const embed = bookembedhandle(
			book[0],
			"Puedes buscar mas informacion sobre este libro con el comando /libro"
		);
		const imageBuffer = Buffer.from(book[0].Imagen);
		const attachment = new AttachmentBuilder(imageBuffer, {
			name: `imagen.jpg`,
		});
		await interaction.reply({
			embeds: [embed],
			files: [attachment],
		});
	},
};
export default comando;
