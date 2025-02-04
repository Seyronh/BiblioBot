import {
	AutocompleteInteraction,
	ButtonInteraction,
	CommandInteraction,
	ModalSubmitInteraction,
	StringSelectMenuInteraction,
	SlashCommandBuilder,
	ContextMenuCommandBuilder,
} from "discord.js";

export type Command = {
	guildOnly?: boolean;
	data: SlashCommandBuilder | ContextMenuCommandBuilder;
	execute: (interaction: CommandInteraction) => Promise<void>;
	autoComplete?: (interaction: AutocompleteInteraction) => Promise<void>;
	buttons?: (interaction: ButtonInteraction) => Promise<void>;
	modal?: (interaction: ModalSubmitInteraction) => Promise<void>;
	selectMenu?: (interaction: StringSelectMenuInteraction) => Promise<void>;
};
export type Book = {
	Titulo: string;
	Sinopsis: string;
	Autor: string;
	Generos: string;
	Paginas: number;
	Imagen?: Uint8Array;
};

export type Perms = {
	create: boolean;
	update: boolean;
	delete: boolean;
};

export enum Roles {
	Moderador = "1321948892090339452",
	Colaborador = "1321908587814981692",
}
export type Event = {
	name: string;
	execute: (...args: any[]) => Promise<void>;
	once?: boolean;
};
