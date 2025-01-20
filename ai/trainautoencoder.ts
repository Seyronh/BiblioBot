import { ListManager } from "../managers";
import { getInputById } from "../utils";

import { AutoEncoder } from "./autoencoder";
import tf from "@tensorflow/tfjs-node";

(async () => {
	const ids = await ListManager.getInstance().getAllIds();
	const autoencoder = await AutoEncoder.getInstance();
	const promesas = [];
	for (let i = 0; i < ids.length; i++) {
		promesas.push(getInputById(ids[i]));
	}
	const datos = await Promise.all(promesas);
	const entrada = tf.stack(datos);
	await autoencoder.train(entrada);
	await autoencoder.saveModel("./models/autoencoder");
	console.log("Autoencoder guardado");
})();
