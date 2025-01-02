import {
	SlashCommandBuilder,
	CommandInteractionOptionResolver,
	MessageFlags,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ModalBuilder,
	TextInputStyle,
	TextInputBuilder,
	ModalActionRowComponentBuilder,
	TextChannel,
	AttachmentBuilder,
	ButtonInteraction,
} from "discord.js";
import { Book, Command } from "../interfaces";
import { canal_sugerencias } from "../config.json";
import { bookembedhandle } from "../handlers/bookembed";
import { DBManager } from "../Managers/DBManager";
import { BookEventManager } from "../Managers/BookEventManager";
import { PermManager } from "../Managers/PermManager";

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("sugerirlibro")
		.setDescription("Sugiere añadir un libro")
		.addStringOption((option) =>
			option
				.setName("titulo")
				.setDescription("El titulo del libro")
				.setRequired(true)
		)
		.addAttachmentOption((option) =>
			option
				.setName("imagen")
				.setDescription("La imagen del libro")
				.setRequired(true)
		) as SlashCommandBuilder,
	execute: async (interaction) => {
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;

		const title = interactionOptions.getString("titulo").trim();
		const image = interactionOptions.getAttachment("imagen");
		if (await DBManager.getInstance().existsBook(title)) {
			await interaction.reply({
				content: "Ya existe un libro con ese titulo",
				ephemeral: true,
			});
			return;
		}
		if (!image.contentType || !image.contentType.startsWith("image/")) {
			await interaction.reply({
				content: "El archivo debe ser una imagen",
				ephemeral: true,
			});
			return;
		}
		const modal = new ModalBuilder()
			.setTitle("Sugerir libro")
			.setCustomId("sugerirlibroModal");

		const paginas = new TextInputBuilder()
			.setCustomId("paginas")
			.setLabel("Páginas")
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setPlaceholder("El numero de páginas del libro")
			.setMaxLength(1024);

		const sinopsis = new TextInputBuilder()
			.setCustomId("sinopsis")
			.setLabel("Sinopsis")
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true)
			.setPlaceholder("La sinopsis del libro");

		const author = new TextInputBuilder()
			.setCustomId("autor")
			.setLabel("Autor")
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setPlaceholder("El autor del libro")
			.setMaxLength(1024);

		const genres = new TextInputBuilder()
			.setCustomId("generos")
			.setLabel("Géneros")
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setPlaceholder("Los géneros del libro separados por comas")
			.setMaxLength(1024);

		const firstRow =
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				paginas
			);

		const secondRow =
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				sinopsis
			);

		const fourthRow =
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				author
			);

		const fifthRow =
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
				genres
			);

		modal.addComponents(fifthRow, secondRow, fourthRow, firstRow);
		// @ts-ignore
		await interaction.showModal(modal);

		const collectorFilter = (i) => {
			return i.user.id === interaction.user.id;
		};
		interaction // @ts-ignore
			.awaitModalSubmit({ time: 600_000, collectorFilter })
			.then(async (interaction2) => {
				const sinopsis = interaction2.fields.getTextInputValue("sinopsis");
				const autor = interaction2.fields.getTextInputValue("autor");
				const generos = interaction2.fields.getTextInputValue("generos");
				let paginas;
				try {
					paginas = parseInt(
						interaction2.fields.getTextInputValue("paginas").trim()
					);
					if (paginas <= 0) throw new Error();
				} catch (err) {
					return interaction2.reply({
						content:
							"El numero de páginas debe ser un numero entero mayor que 0",
						flags: MessageFlags.Ephemeral,
					});
				}
				const response = await fetch(image.url);
				const buffer = await response.arrayBuffer();
				const book: Book = {
					Titulo: title,
					Sinopsis: sinopsis.trim(),
					Autor: autor.trim(),
					Generos: generos
						.split(",")
						.map((genero) => genero.trim().toLowerCase()),
					Paginas: paginas,
					Imagen: buffer,
				};
				const embed = bookembedhandle(
					book,
					`Enviado por: ${interaction.user.tag} | ID:${interaction.user.id}`
				);
				const confirm = new ButtonBuilder()
					.setCustomId("sugerirlibro|Confirm")
					.setLabel("Confirmar")
					.setStyle(ButtonStyle.Success);
				const cancel = new ButtonBuilder()
					.setCustomId("sugerirlibro|Cancel")
					.setLabel("Cancelar")
					.setStyle(ButtonStyle.Danger);

				const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
					cancel,
					confirm
				);

				await interaction2.reply({
					content: "Gracias por tu sugerencia",
					ephemeral: true,
				});
				const Channel = (await interaction2.client.channels.fetch(
					canal_sugerencias
				)) as TextChannel;
				if (Channel) {
					const imageBuffer = Buffer.from(book.Imagen);
					const attachment = new AttachmentBuilder(imageBuffer, {
						name: `imagen.jpg`,
					});
					await Channel.send({
						embeds: [embed],
						components: [row],
						files: [attachment],
					});
				}
			})
			.catch((err) => {
				console.log(err);
			});
	},
	buttons: async (interaction: ButtonInteraction) => {
		const permsManager = PermManager.getInstance();
		if (!permsManager.getPermissions(interaction.user.id).create) return;
		if (interaction.customId === "Confirm") {
			// @ts-ignore
			const Channel: Channel = (await interaction.client.channels.fetch(
				interaction.channelId
			)) as TextChannel;
			const Message = await Channel.messages.fetch(interaction.message.id);
			if (Message.deletable) {
				const title = Message.embeds[0].title;
				const author = Message.embeds[0].author.name;
				const genres = Message.embeds[0].fields[0].value;
				const synopsis = Message.embeds[0].description;
				const image = Message.embeds[0].image.url;
				const response = await fetch(image);
				const buffer = await response.arrayBuffer();
				const paginas = parseInt(Message.embeds[0].fields[1].value);

				const book: Book = {
					Titulo: title,
					Autor: author,
					Generos: genres.split(",").map((e) => e.trim()),
					Paginas: paginas,
					Sinopsis: synopsis,
					Imagen: buffer,
				};

				// Insert the book in the database
				const db = DBManager.getInstance();
				await db.insertBook(book);
				await Message.delete();
				BookEventManager.getInstance().eventBook(
					book,
					`Libro Aceptado por <@${interaction.user.id}>`
				);
			}
		} else if (interaction.customId === "Cancel") {
			// @ts-ignore
			const Channel: TextChannel = await interaction.client.channels.fetch(
				interaction.channelId
			);
			const Message = await Channel.messages.fetch(interaction.message.id);
			if (Message.deletable) {
				await Message.delete();
			}
		}
	},
};
export default comando;
