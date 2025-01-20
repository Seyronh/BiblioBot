import {
	AutocompleteInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command, Roles } from "../types";
import { BookEventManager, BookManager } from "../managers";
import { hasRole } from "../utils";

const comando: Command = {
	guildOnly: true,
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
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });
		if (!hasRole(interaction, Roles.Moderador)) {
			await interaction.editReply({
				content: "No tienes permiso para usar este comando",
			});
			return;
		}
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const id = interactionOptions.getString("busqueda");
		const book = await BookManager.getInstance().getBookByTitle(id);
		if (!book) {
			await interaction.editReply({
				content: "Libro no encontrado",
			});
			return;
		}
		await interaction.editReply({
			content: "Libro eliminado correctamente",
		});
		await BookManager.getInstance().removeBook(book.Titulo);
		BookEventManager.getInstance().eventBook(
			book,
			`Libro eliminado por <${interaction.user.id}>`
		);
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const candidatos = await BookManager.getInstance().getBooksNameAutocomplete(
			interactionOptions.getFocused(),
			true
		);
		const mapeado = candidatos.map((candidato) => ({
			name: candidato,
			value: candidato,
		}));

		await interaction.respond(mapeado);
	},
};
export default comando;
