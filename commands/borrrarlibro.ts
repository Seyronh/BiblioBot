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
		if (!hasRole(interaction, moderadoresRolID)) {
			await interaction.reply({
				content: "No tienes permiso para usar este comando",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
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

// Function to check if the user has the required role
function hasRole(interaction, roleId) {
	return interaction.member.roles.cache.some((role) => role.id == roleId);
}
