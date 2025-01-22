Bun.build({
	entrypoints: ["./index.ts"],
	outdir: "./dist",
	external: ["discord.js", "@tensorflow/tfjs-node"],
	target: "bun",
	minify: true,
	sourcemap: "linked",
	env: "disable",
});
