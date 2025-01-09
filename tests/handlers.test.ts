import { describe, it, expect, vi } from "bun:test";
import { autocompletehandle } from "../handlers/autocomplete";
import { bookembedhandle } from "../handlers/bookembed";
import { buttonshandle } from "../handlers/buttons";
import { commandhandle } from "../handlers/command";
import { Interaction, ButtonInteraction, EmbedBuilder } from "discord.js";
import { SlashManager } from "../Managers/SlashManager";
import { Book } from "../interfaces";

vi.mock("../Managers/SlashManager");

describe("autocompletehandle", () => {
  it("should call SlashManager's autoComplete method", async () => {
    const interaction = {} as Interaction;
    await autocompletehandle(interaction);
    expect(SlashManager.getInstance().autoComplete).toHaveBeenCalledWith(interaction);
  });
});

describe("bookembedhandle", () => {
  it("should create an embed with the correct fields", () => {
    const book: Book = {
      Titulo: "Test Book",
      Sinopsis: "This is a test book.",
      Autor: "Test Author",
      Generos: ["Test Genre"],
      Paginas: 100,
      Imagen: new ArrayBuffer(8),
    };
    const footer = "Test Footer";
    const embed = bookembedhandle(book, footer);
    expect(embed).toBeInstanceOf(EmbedBuilder);
    expect(embed.data.title).toBe(book.Titulo);
    expect(embed.data.description).toBe(book.Sinopsis);
    expect(embed.data.author.name).toBe(book.Autor);
    expect(embed.data.footer.text).toBe(footer);
  });
});

describe("buttonshandle", () => {
  it("should call SlashManager's buttons method", async () => {
    const interaction = {} as ButtonInteraction;
    await buttonshandle(interaction);
    expect(SlashManager.getInstance().buttons).toHaveBeenCalledWith(interaction);
  });
});

describe("commandhandle", () => {
  it("should call SlashManager's execute method", async () => {
    const interaction = {} as Interaction;
    await commandhandle(interaction);
    expect(SlashManager.getInstance().execute).toHaveBeenCalledWith(interaction);
  });
});
