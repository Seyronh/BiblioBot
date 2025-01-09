import { describe, it, expect } from "bun:test";
import { Roles } from "../../types";
import { hasRole } from "../../utils/hasrole";

describe("hasRole", () => {
	it("should return true if the user has the role", () => {
		const interaction = {
			member: {
				roles: {
					cache: [{ id: "1321948892090339452" }, { id: "1321908587814981692" }],
				},
			},
		};
		expect(hasRole(interaction, Roles.Moderador)).toBe(true);
	});

	it("should return false if the user does not have the role", () => {
		const interaction = {
			member: {
				roles: {
					cache: [{ id: "1321948892090339452" }],
				},
			},
		};
		expect(hasRole(interaction, Roles.Colaborador)).toBe(false);
	});
});
