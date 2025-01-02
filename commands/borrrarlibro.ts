import {
	AutocompleteInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces";
import { DBManager } from "../Managers/DBManager";

import { BookEventManager } from "../Managers/BookEventManager";
import { PermManager } from "../Managers/PermManager";

const db = DBManager.getInstance();

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("borrarlibro")
		.setDescription("Elimina un libro")
		.addStringOption((option) =>
			option
				.setName("busqueda")
				.setDescription("El nombre del libro o una descripción")
				.setRequired(true)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		if (!PermManager.getInstance().getPermissions(interaction.user.id).delete)
			return;
		await interaction.deferReply({ ephemeral: true });
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const id = interactionOptions.getString("busqueda");
		const book = await db.getBookByTitle(id);
		if (!book) {
			await interaction.editReply({
				content: "Libro no encontrado",
			});
			return;
		}
		await db.removeBook(book.Titulo);
		BookEventManager.getInstance().eventBook(
			book,
			`Libro eliminado por <${interaction.user.id}>`
		);
		await db.removeBook(id);
		await interaction.editReply({
			content: "Libro eliminado correctamente",
		});
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const candidatos = await db.getBooksNameAutocomplete(
			interactionOptions.getFocused(),
			true
		);
		const mapeado = candidatos.map((candidato) => ({
			name: candidato,
			value: candidato,
		}));
		// @ts-ignore
		await interaction.respond(mapeado);
	},
};
export default comando;
