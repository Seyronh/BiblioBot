import {
	AutocompleteInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../interfaces";
import { DBManager } from "../Managers/DBManager";
import { moderadores as moderadoresRolID } from "../config.json";
import { BookEventManager } from "../Managers/BookEventManager";

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
		if (
			//@ts-ignore
			!interaction.member.roles.cache.some(
				(role) => role.id == moderadoresRolID
			)
		)
			return;
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
		await db.removeBook(book.Titulo);
		BookEventManager.getInstance().eventBook(
			book,
			`Libro eliminado por <${interaction.user.id}>`
		);
		await db.removeBook(id);
		await interaction.reply({
			content: "Libro eliminado correctamente",
			flags: MessageFlags.Ephemeral,
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
