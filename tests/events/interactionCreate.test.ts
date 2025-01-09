import { describe, it, expect } from "bun:test";
import { CommandInteraction, Events } from "discord.js";
import event from "../../events/interactionCreate";

describe("interactionCreate event", () => {
	it("should be named InteractionCreate", () => {
		expect(event.name).toBe(Events.InteractionCreate);
	});
	it("should be once", () => {
		expect(event.once).toBeFalsy();
	});

	it("should execute isCommand", async () => {
		const execute = event.execute;
		const interaction = {
			isCommand: () => true,
			isAutocomplete: () => false,
			isButton: () => false,
			isStringSelectMenu: () => false,
		} as unknown as CommandInteraction;
		await execute(interaction);
	});
});
