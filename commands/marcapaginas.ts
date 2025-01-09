import {
	AutocompleteInteraction,
	CommandInteractionOptionResolver,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../types";
import { DBManager } from "../managers";

const db = DBManager.getInstance();

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("marcapaginas")
		.setDescription("Marca la página por la que vas de un libro")
		.addStringOption((option) =>
			option
				.setName("título")
				.setDescription("El nombre del libro")
				.setRequired(true)
				.setAutocomplete(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("página")
				.setDescription("La página por la que vas")
				.setRequired(true)
				.setAutocomplete(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		await interaction.deferReply({ ephemeral: true });
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const titulo = interactionOptions.getString("título");
		const book = await db.getBookByTitle(titulo);
		if (!book) {
			await interaction.editReply({
				content: "Libro no encontrado",
			});
			return;
		}
		if (!(await db.existsListBook(interaction.user.id, book.Titulo))) {
			await interaction.editReply({
				content: "Libro no encontrado en ninguna lista",
			});
			return;
		}
		const pagina = interactionOptions.getInteger("página");
		const validationError = validatePagina(pagina, book.Paginas);
		if (validationError) {
			await interaction.editReply({
				content: validationError,
			});
			return;
		}
		await db.markPage(interaction.user.id, titulo, pagina);
		await interaction.editReply({
			content: "Página marcada con exito",
		});
	},
	autoComplete: async (interaction: AutocompleteInteraction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const focusedOption = interactionOptions.getFocused(true);
		if (focusedOption.name == "título") {
			const candidatos = await db.getBooksNameAutocomplete(
				focusedOption.value,
				true
			);
			const mapeado = candidatos.map((candidato) => ({
				name: candidato,
				value: candidato,
			}));

			await interaction.respond(mapeado);
		} else if (focusedOption.name == "página") {
			const mapeado = [];
			setTimeout(async () => {
				if (!interaction.responded) {
					await interaction.respond(mapeado);
				}
			}, 2000);
			const book = await db.getBookByTitle(
				interactionOptions.getString("título")
			);
			if (!book && !interaction.responded) {
				await interaction.respond([]);
				return;
			}
			try {
				const marcada =
					focusedOption.value.trim().length == 0
						? 0
						: parseInt(focusedOption.value);
				for (let i = marcada; i <= book.Paginas && mapeado.length < 25; i++) {
					mapeado.push({
						name: `${i}`,
						value: i,
					});
				}
			} catch (error) {
				if (!interaction.responded) {
					await interaction.respond([]);
				}
			}
		}
	},
};
export default comando;

// Function to validate the pagina input
function validatePagina(pagina: number, totalPaginas: number): string | null {
	if (isNaN(pagina)) {
		return "Página no valida";
	}
	if (pagina < 0) {
		return "Página no valida debe ser un numero positivo";
	}
	if (pagina > totalPaginas) {
		return `Página no valida debe ser menor o igual que el total de paginas del libro en este caso ${totalPaginas} páginas`;
	}
	return null;
}
