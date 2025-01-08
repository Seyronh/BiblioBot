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

const db = DBManager.getInstance();

const comando: Command = {
	data: new SlashCommandBuilder()
		.setName("añadirlibro")
		.setDescription(" añadir un libro a la biblioteca")
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
		const modal = createModal();

		// @ts-ignore
		await interaction.showModal(modal);
		const collectorFilter = (i) => {
			return i.user.id === interaction.user.id;
		};
		 // @ts-ignore
		interaction.awaitModalSubmit({ time: 600_000, collectorFilter })
			.then(async (interaction2) => {
				await handleModalSubmit(interaction2, title, image);
			})
			.catch((err) => {});
	},
	buttons: async (interaction: ButtonInteraction) => {
		if (interaction.customId === "Confirm") {
			await handleConfirmButton(interaction);
		} else if (interaction.customId === "Cancel") {
			await handleCancelButton(interaction);
		}
	},
};
export default comando;

// Function to create the modal for adding a book
function createModal() {
	const modal = new ModalBuilder()
		.setTitle("Añadir libro")
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
	return modal;
}

// Function to handle the modal submit
async function handleModalSubmit(interaction2, title, image) {
	await interaction2.deferReply({ ephemeral: true });
	if (await db.existsBook(title)) {
		await interaction2.editReply({
			content: "Ya existe un libro con ese titulo",
		});
		return;
	}
	if (!image.contentType || !image.contentType.startsWith("image/")) {
		await interaction2.editReply({
			content: "El archivo debe ser una imagen",
		});
		return;
	}
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
		await interaction2.editReply({
			content:
				"El numero de páginas debe ser un numero entero mayor que 0",
		});
		return;
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
		`Enviado por: ${interaction2.user.tag} | ID:${interaction2.user.id}`,
		{
			media: -1,
			count: 0,
		}
	);
	const confirm = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Confirm`)
		.setLabel("Confirmar")
		.setStyle(ButtonStyle.Success);
	const cancel = new ButtonBuilder()
		.setCustomId(`${comando.data.name}|Cancel`)
		.setLabel("Cancelar")
		.setStyle(ButtonStyle.Danger);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		cancel,
		confirm
	);

	await interaction2.editReply({
		content: "Gracias por tu sugerencia",
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
}

// Function to handle the confirm button
async function handleConfirmButton(interaction) {
	// @ts-ignore
	const Channel: TextChannel = await interaction.client.channels.fetch(
		interaction.channelId
	);
	const Message = await Channel.messages.fetch(interaction.message.id);
	if (Message.deletable) {
		const title = Message.embeds[0].title;
		const bookTest = await db.getBookByTitle(title);
		if (bookTest) {
			await interaction.reply({
				content:
					"Ya existe un libro con ese titulo, eliminado de sugerencias.",
				flags: MessageFlags.Ephemeral,
			});
			await Message.delete();
			return;
		}
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
		await db.insertBook(book);
		await Message.delete();
		BookEventManager.getInstance().eventBook(
			book,
			`Libro Aceptado por <@${interaction.user.id}>`
		);
	}
}

// Function to handle the cancel button
async function handleCancelButton(interaction) {
	// @ts-ignore
	const Channel: TextChannel = await interaction.client.channels.fetch(
		interaction.channelId
	);
	const Message = await Channel.messages.fetch(interaction.message.id);
	if (Message.deletable) {
		await Message.delete();
	}
}
