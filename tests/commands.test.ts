import { describe, it, expect, vi } from "bun:test";
import { CommandInteraction, ButtonInteraction, AutocompleteInteraction } from "discord.js";
import añadirlibro from "../commands/añadirlibro";
import analizar from "../commands/analizar";
import borrarlibro from "../commands/borrrarlibro";
import calificar from "../commands/calificar";

describe("añadirlibro command", () => {
  it("should show a modal when executed", async () => {
    const interaction = {
      options: {
        getString: vi.fn().mockReturnValue("Test Title"),
        getAttachment: vi.fn().mockReturnValue({ url: "http://example.com/image.jpg" }),
      },
      showModal: vi.fn(),
      awaitModalSubmit: vi.fn().mockResolvedValue({
        fields: {
          getTextInputValue: vi.fn().mockReturnValue("Test Value"),
        },
        deferReply: vi.fn(),
        editReply: vi.fn(),
        user: { id: "123", tag: "TestUser#1234" },
        client: { channels: { fetch: vi.fn().mockResolvedValue({ send: vi.fn() }) } },
      }),
    };
    await añadirlibro.execute(interaction as unknown as CommandInteraction);
    expect(interaction.showModal).toHaveBeenCalled();
  });
});

describe("analizar command", () => {
  it("should reply with book candidates", async () => {
    const interaction = {
      targetMessage: { content: "Test Message" },
      deferReply: vi.fn(),
      editReply: vi.fn(),
    };
    const db = {
      getBooksNameAutocomplete: vi.fn().mockResolvedValue(["Book1", "Book2"]),
    };
    await analizar.execute(interaction as unknown as MessageContextMenuCommandInteraction);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Los dos libros mas cercanos encontrados son: Book1 y Book2",
      components: expect.any(Array),
    });
  });
});

describe("borrarlibro command", () => {
  it("should delete a book if user has permission", async () => {
    const interaction = {
      options: { getString: vi.fn().mockReturnValue("Test Book") },
      member: { roles: { cache: new Map([["moderadoresRolID", {}]]) } },
      deferReply: vi.fn(),
      editReply: vi.fn(),
    };
    const db = {
      getBookByTitle: vi.fn().mockResolvedValue({ Titulo: "Test Book" }),
      removeBook: vi.fn(),
    };
    await borrarlibro.execute(interaction as unknown as CommandInteraction);
    expect(db.removeBook).toHaveBeenCalledWith("Test Book");
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Libro eliminado correctamente",
    });
  });
});

describe("calificar command", () => {
  it("should set a rating for a book", async () => {
    const interaction = {
      options: {
        getString: vi.fn().mockReturnValue("Test Book"),
        getInteger: vi.fn().mockReturnValue(5),
      },
      deferReply: vi.fn(),
      editReply: vi.fn(),
      user: { id: "123" },
    };
    const db = {
      getBookByTitle: vi.fn().mockResolvedValue({ Titulo: "Test Book" }),
      existsListBook: vi.fn().mockResolvedValue(true),
      setNota: vi.fn(),
    };
    await calificar.execute(interaction as unknown as CommandInteraction);
    expect(db.setNota).toHaveBeenCalledWith("123", "Test Book", 5);
    expect(interaction.editReply).toHaveBeenCalledWith({
      content: "Nota puesta con exito",
    });
  });
});
