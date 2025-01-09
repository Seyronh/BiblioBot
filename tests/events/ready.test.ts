import { describe, it, expect } from "bun:test";
import { Events } from "discord.js";
import ready from "../../events/ready";

describe("ready event", () => {
	it("should be named ClientReady", () => {
		expect(ready.name).toBe(Events.ClientReady);
	});
	it("should be once", () => {
		expect(ready.once).toBe(true);
	});

	it("should execute", async () => {
		const execute = ready.execute;
		await execute();
	});
});
