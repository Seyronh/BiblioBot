import { describe, it, expect, mock, beforeEach, spyOn } from "bun:test";
import { DiscordBot } from "../index";

describe("DiscordBot", () => {
	beforeEach(() => {
		//
		DiscordBot.instance = undefined;
	});
	it("should create a DiscordBot instance", () => {
		const bot = DiscordBot.getInstance();
		expect(bot).toBeInstanceOf(DiscordBot);
	});
	it("should call the login method", () => {
		//@ts-ignore
		const spy = spyOn(DiscordBot.prototype, "login");
		expect(spy).toHaveBeenCalledTimes(0);
		DiscordBot.getInstance();
		expect(spy).toHaveBeenCalledTimes(1);
	});
	it("should call the createClient method", () => {
		//@ts-ignore
		const spy = spyOn(DiscordBot.prototype, "createClient");
		expect(spy).toHaveBeenCalledTimes(0);
		DiscordBot.getInstance();
		expect(spy).toHaveBeenCalledTimes(1);
	});
	it("should call the loadEvents method", () => {
		//@ts-ignore
		const spy = spyOn(DiscordBot.prototype, "loadEvents");
		expect(spy).toHaveBeenCalledTimes(0);
		DiscordBot.getInstance();
		expect(spy).toHaveBeenCalledTimes(1);
	});
});
