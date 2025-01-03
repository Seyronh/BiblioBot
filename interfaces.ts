import {
	AutocompleteInteraction,
	ButtonInteraction,
	CommandInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
	SlashCommandBuilder,
	ContextMenuCommandBuilder,
} from "discord.js";

export interface Command {
	data: SlashCommandBuilder | ContextMenuCommandBuilder;
	execute: (interaction: CommandInteraction) => Promise<void>;
	autoComplete?: (interaction: AutocompleteInteraction) => Promise<void>;
	buttons?: (interaction: ButtonInteraction) => Promise<void>;
	modal?: (interaction: ModalSubmitInteraction) => Promise<void>;
	selectMenu?: (interaction: StringSelectMenuInteraction) => Promise<void>;
}
export interface Book {
	Titulo: string;
	Sinopsis: string;
	Autor: string;
	Generos: string[];
	Paginas: number;
	Imagen?: ArrayBuffer;
}

export interface Perms {
	create: boolean;
	update: boolean;
	delete: boolean;
}
