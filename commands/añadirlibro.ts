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
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	ModalSubmitInteraction,
} from "discord.js";
import { Book, Command, Roles } from "../types";
import { canal_sugerencias } from "../config.json";
import {
	bookembed,
	hasRole,
	createMenuGenerosOptions,
	extraerGeneros,
	insertTextInMiddle,
} from "../utils";
import { DBManager, BookEventManager } from "../managers";

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
		interaction.deferReply();
		const interactionOptions =
			interaction.options as CommandInteractionOptionResolver;

		const title = interactionOptions.getString("titulo").trim();
		const image = interactionOptions.getAttachment("imagen");
		if (title.indexOf("|") !== -1 || title.indexOf("\n") !== -1) {
			await interaction.editReply({
				content: "El titulo no debe contener '|' ni saltos de linea",
			});
			return;
		}
		if (await db.existsBook(title)) {
			await interaction.editReply({
				content: "Ya existe un libro con ese titulo",
			});
			return;
		}
		if (!image.contentType || !image.contentType.startsWith("image/")) {
			await interaction.editReply({
				content: "El archivo debe ser una imagen",
			});
			return;
		}
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
			content: `Elige los generos del libro y pulsa Continuar\n\n|${title}|${image.url}`,
			components: [row1, row2],
		});
	},
	buttons: async (interaction: ButtonInteraction) => {
		const partes = interaction.customId.split("|");
		if (partes[0] === "Continuar") {
			if (interaction.user.id !== interaction.customId.split("|")[1]) return;
			await handleContinuarButton(interaction);
		}
		if (hasRole(interaction, Roles.Colaborador)) {
			await interaction.deferReply();
			if (interaction.customId === "Confirm") {
				await handleConfirmButton(interaction);
			} else if (interaction.customId === "Cancel") {
				await handleCancelButton(interaction);
			}
		}
	},
	selectMenu: async (interaction: StringSelectMenuInteraction) => {
		if (interaction.user.id !== interaction.customId.split("|")[1]) return;
		const selected = interaction.values.join(",");
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
};
export default comando;

async function handleContinuarButton(interaction: ButtonInteraction) {
	if (interaction.user.id !== interaction.customId.split("|")[1]) return;
	const message = interaction.message;
	const titleImageLine = message.content.split("\n");
	const titleImage = titleImageLine[2].split("|");
	const title = titleImage[1];
	const image = titleImage[2];
	const generos = extraerGeneros(message.content);
	const modal = createModal();

	// @ts-ignore
	await interaction.showModal(modal);
	const collectorFilter = (i) => {
		return i.user.id === interaction.user.id;
	};
	// @ts-ignore
	interaction
		.awaitModalSubmit({ time: 600_000, filter: collectorFilter })
		.then(async (interaction2) => {
			await handleModalSubmit(interaction, interaction2, title, image, generos);
		})
		.catch((err) => {
			console.log(err);
		});
}

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
	modal.addComponents(secondRow, fourthRow, firstRow);
	return modal;
}

// Function to handle the modal submit
async function handleModalSubmit(
	interactionButton: ButtonInteraction,
	interactionModal: ModalSubmitInteraction,
	title: string,
	image: string,
	generos: string
) {
	await interactionModal.deferReply({ flags: MessageFlags.Ephemeral });
	const sinopsis = interactionModal.fields.getTextInputValue("sinopsis");
	const autor = interactionModal.fields.getTextInputValue("autor");
	let paginas;
	try {
		paginas = parseInt(
			interactionModal.fields.getTextInputValue("paginas").trim()
		);
		if (paginas <= 0) throw new Error();
	} catch (err) {
		await interactionModal.editReply({
			content: "El numero de páginas debe ser un numero entero mayor que 0",
		});
		return;
	}

	const response = await fetch(image);

	const buffer = await response.arrayBuffer();

	const book: Book = {
		Titulo: title,
		Sinopsis: sinopsis.trim(),
		Autor: autor.trim(),
		Generos: generos.split(","),
		Paginas: paginas,
		Imagen: buffer,
	};
	const embed = bookembed(
		book,
		`Enviado por: ${interactionModal.user.tag} | ID:${interactionModal.user.id}`,
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
	const channel = (await interactionButton.client.channels.fetch(
		interactionButton.channelId
	)) as TextChannel;
	const message = await channel.messages.fetch(interactionButton.message.id);
	if (message.deletable) message.delete();
	await interactionModal.editReply({
		content: "Gracias por tu sugerencia",
	});
	const Channel = (await interactionModal.client.channels.fetch(
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
				content: "Ya existe un libro con ese titulo, eliminado de sugerencias.",
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
