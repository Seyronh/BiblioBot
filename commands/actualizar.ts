import {
	ActionRowBuilder,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	CommandInteraction,
	CommandInteractionOptionResolver,
	MessageFlags,
	ModalActionRowComponentBuilder,
	ModalBuilder,
	SlashCommandBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { Command, Roles } from "../types";

import {
	createMenuGenerosOptions,
	extraerGeneros,
	hasRole,
	insertTextInMiddle,
} from "../utils";
import { BookManager } from "../managers";

const comando: Command = {
	guildOnly: true,
	data: new SlashCommandBuilder()
		.setName("actualizar")
		.setDescription("Actualizar información de un libro")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("titulo")
				.setDescription("Actualizar el titulo de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addStringOption((option) =>
					option
						.setName("nuevotitulo")
						.setDescription("El nuevo titulo del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("imagen")
				.setDescription("Actualizar la imagen de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addAttachmentOption((option) =>
					option
						.setName("nuevaimagen")
						.setDescription("La nueva imagen del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("autor")
				.setDescription("Actualizar el autor de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addStringOption((option) =>
					option
						.setName("nuevoautor")
						.setDescription("El nuevo autor del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("sinopsis")
				.setDescription("Actualizar la sinopsis de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("paginas")
				.setDescription("Actualizar el numero de paginas de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
				.addIntegerOption((option) =>
					option
						.setName("nuevaspaginas")
						.setDescription("El nuevo numero de paginas del libro")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("generos")
				.setDescription("Actualizar los generos de un libro")
				.addStringOption((option) =>
					option
						.setName("titulo")
						.setDescription("El titulo del libro")
						.setRequired(true)
						.setAutocomplete(true)
				)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		if (!hasRole(interaction, Roles.Moderador)) {
			await interaction.editReply({
				content: "No tienes permiso para usar este comando",
			});
			return;
		}
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;
		const subcommand = interactionOptions.getSubcommand();
		const titulo = interactionOptions.getString("titulo");
		const book = await BookManager.getInstance().getBookByTitle(titulo);
		if (!book) {
			await interaction.editReply({
				content: "Libro no encontrado",
			});
			return;
		}
		switch (subcommand) {
			case "titulo":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				await cambiarTitulo(interaction, titulo);
				break;
			case "autor":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				await cambiarAutor(interaction, titulo);
				break;
			case "sinopsis":
				await cambiarSinopsis(interaction, titulo);
				break;
			case "paginas":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				await cambiarPaginas(interaction, titulo);
				break;
			case "imagen":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				await cambiarImagen(interaction, titulo);
				break;
			case "generos":
				await interaction.deferReply({ flags: MessageFlags.Ephemeral });
				await cambiarGeneros(interaction, titulo);
				break;
			default:
				await interaction.editReply({
					content: "Comando no reconocido",
				});
		}
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
	selectMenu: async (interaction: StringSelectMenuInteraction) => {
		if (interaction.user.id !== interaction.customId.split("|")[1]) return;
		const selected = interaction.values.sort().join(",");
		const row1 = interaction.message.components[0];
		const row2 = interaction.message.components[1];
		if (interaction.message.components[1].components[0].disabled) {
			row2.components[0] = ButtonBuilder.from(
				row2.components[0] as any
			).setDisabled(false) as any;
		}
		await interaction.update({
			content: insertTextInMiddle(
				interaction.message.content,
				`generos seleccionados: ${selected}`
			),
			components: [row1, row2],
		});
	},
	buttons: async (interaction: ButtonInteraction) => {
		const partes = interaction.customId.split("|");
		if (partes[0] === "Continuar") {
			if (interaction.user.id !== interaction.customId.split("|")[1]) return;
			await handleContinuarButton(interaction);
		}
	},
};
export default comando;

async function cambiarTitulo(interaction: CommandInteraction, titulo: string) {
	const interactionOptions =
		interaction.options as CommandInteractionOptionResolver;
	const nuevotitulo = interactionOptions.getString("nuevotitulo");
	if (!nuevotitulo && nuevotitulo.trim().length == 0) {
		await interaction.editReply({
			content: `El nuevo titulo no puede ser vacio`,
		});
		return;
	}
	const book = await BookManager.getInstance().getBookByTitle(nuevotitulo);
	if (book) {
		await interaction.editReply({
			content: `Ya existe un libro con el nuevo titulo.`,
		});
		return;
	}
	await BookManager.getInstance().updateBookField(
		titulo,
		"Titulo",
		nuevotitulo
	);
	await interaction.editReply({
		content: `Titulo actualizado con exito`,
	});
}
async function cambiarAutor(interaction: CommandInteraction, titulo: string) {
	const interactionOptions =
		interaction.options as CommandInteractionOptionResolver;
	const nuevoautor = interactionOptions.getString("nuevoautor");
	if (!nuevoautor && nuevoautor.trim().length == 0) {
		await interaction.editReply({
			content: `El nuevo autor no puede ser vacio`,
		});
		return;
	}
	await BookManager.getInstance().updateBookField(titulo, "Autor", nuevoautor);
	await interaction.editReply({
		content: `Autor actualizado con exito`,
	});
}
function createModal() {
	const modal = new ModalBuilder()
		.setTitle("Actualizar libro")
		.setCustomId("actualizarLibroModal");
	const sinopsis = new TextInputBuilder()
		.setCustomId("sinopsis")
		.setLabel("Sinopsis")
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true)
		.setPlaceholder("La sinopsis del libro");
	const secondRow =
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
			sinopsis
		);
	modal.addComponents(secondRow);
	return modal;
}
async function cambiarSinopsis(
	interaction: CommandInteraction,
	titulo: string
) {
	const modal = createModal();
	await interaction.showModal(modal);
	const collectorFilter = (i) => {
		return i.user.id === interaction.user.id;
	};
	interaction
		.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
		.then(async (interaction2) => {
			await interaction2.deferReply({ flags: MessageFlags.Ephemeral });
			const sinopsis = interaction2.fields.getTextInputValue("sinopsis");
			if (!sinopsis && sinopsis.trim().length == 0) {
				await interaction2.editReply({
					content: `La nueva sinopsis no puede ser vacia`,
				});
				return;
			}
			await BookManager.getInstance().updateBookField(
				titulo,
				"Sinopsis",
				sinopsis
			);
			await interaction2.editReply({
				content: `Sinopsis actualizada con exito`,
			});
		})
		.catch((err) => {
			console.log(err);
		});
}
async function cambiarPaginas(interaction: CommandInteraction, titulo: string) {
	const interactionOptions =
		interaction.options as CommandInteractionOptionResolver;
	const nuevaspaginas = interactionOptions.getInteger("nuevaspaginas");
	if (!nuevaspaginas) {
		await interaction.editReply({
			content: `El nuevo numero de paginas no puede ser vacio`,
		});
		return;
	}
	if (nuevaspaginas <= 0) {
		await interaction.editReply({
			content: `El nuevo numero de paginas debe ser mayor que 0`,
		});
		return;
	}
	await BookManager.getInstance().updateBookField(
		titulo,
		"Paginas",
		nuevaspaginas
	);
	await interaction.editReply({
		content: `Paginas actualizadas con exito`,
	});
}
async function cambiarImagen(interaction: CommandInteraction, titulo: string) {
	const interactionOptions =
		interaction.options as CommandInteractionOptionResolver;
	const nuevaimagen = interactionOptions.getAttachment("nuevaimagen");
	if (!nuevaimagen) {
		await interaction.editReply({
			content: `La nueva imagen no puede ser vacia`,
		});
		return;
	}
	if (
		!nuevaimagen.contentType ||
		!nuevaimagen.contentType.startsWith("image/")
	) {
		await interaction.editReply({
			content: "El archivo debe ser una imagen",
		});
		return;
	}

	const response = await fetch(nuevaimagen.url);
	const buffer = new Uint8Array(await response.arrayBuffer());
	await BookManager.getInstance().updateBookField(titulo, "Imagen", buffer);
	await interaction.editReply({
		content: `Imagen actualizada con exito`,
	});
}
async function cambiarGeneros(interaction: CommandInteraction, titulo: string) {
	const Generos = new StringSelectMenuBuilder()
		.setCustomId(`${comando.data.name}|generos|${interaction.user.id}`)
		.setPlaceholder("Elige los generos del libro")
		.setMinValues(1)
		.setMaxValues(25)
		.addOptions(createMenuGenerosOptions());
	const botonContinuar = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Continuar|${interaction.user.id}`)
		.setLabel("Continuar")
		.setStyle(ButtonStyle.Primary)
		.setDisabled(true);
	const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
		Generos
	);
	const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
		botonContinuar
	);
	await interaction.editReply({
		content: `Elige los generos del libro y pulsa Continuar\n\n|${titulo}`,
		components: [row1, row2],
	});
}
async function handleContinuarButton(interaction: ButtonInteraction) {
	await interaction.deferUpdate();
	if (interaction.user.id !== interaction.customId.split("|")[1]) return;
	const generos = extraerGeneros(interaction.message.content);
	await BookManager.getInstance().updateBookField(
		interaction.message.content.split("|")[1],
		"Generos",
		generos
	);
	await interaction.editReply({
		content: `Generos actualizados con exito`,
		components: [],
	});
}
