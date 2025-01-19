import { AttachmentBuilder, Client, TextChannel } from "discord.js";
import { Book } from "../types";
import { canal_eventolibros } from "../config.json";
import { bookembed } from "../utils";

export class BookEventManager {
	private static instance: BookEventManager;
	private client;
	private stagedEvents = [];
	public static getInstance(): BookEventManager {
		if (!BookEventManager.instance) {
			BookEventManager.instance = new BookEventManager();
		}
		return BookEventManager.instance;
	}
	setClient(client: Client) {
		this.client = client;
	}
	eventBook(book: Book, message: string) {
		this.stagedEvents.push({
			book: book,
			message: message,
		});
		if (!this.client) return;
		this.ConsumeStaged();
	}
	private async ConsumeStaged() {
		let eventos = [...this.stagedEvents];
		this.stagedEvents = [];
		const Channel: TextChannel = await this.client.channels.fetch(
			canal_eventolibros
		);
		for (const evento of eventos) {
			if (Channel) {
				const imageBuffer = Buffer.from(evento.book.Imagen);
				const attachment = new AttachmentBuilder(imageBuffer, {
					name: `imagen.jpg`,
				});
				Channel.send({
					content: evento.message,
					embeds: [
						bookembed(
							evento.book,
							"Puedes buscar mas informacion sobre este libro con el comando /verlibro"
						),
					],
					files: [attachment],
				});
			}
		}
	}
}
