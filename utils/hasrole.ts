import { Roles } from "../types";

function hasRole(interaction, role: Roles) {
	return interaction.member.roles.cache.some((r) => r.id == role);
}
export { hasRole };
