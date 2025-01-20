import { ListManager } from "../managers";
import { getInputById, getInputByTitle } from "../utils";
import { AutoEncoder } from "./autoencoder";

import { Recommender } from "./recommender";
import tf from "@tensorflow/tfjs-node";

(async () => {
	const autoencoder = await AutoEncoder.getInstance();
	const recommender = await Recommender.getInstance();
	const trios = await ListManager.getInstance().getTitleNotaPairs();
	const datosIds = [];
	for (let i = 0; i < trios.length; i++) {
		if (datosIds.indexOf((e) => e.id == trios[i].id) == -1) {
			const inputEncoder = await getInputById(trios[i].id);
			datosIds.push({
				id: trios[i].id,
				encoded: (
					(await autoencoder.encode(
						inputEncoder.reshape([1, 3072])
					)) as tf.Tensor
				).reshape([194]),
			});
		}
	}
	const datos = [];
	const salidas = [];
	for (let i = 0; i < trios.length; i++) {
		const libro = await getInputByTitle(trios[i].titulo);
		const datosid = datosIds.find((e) => e.id == trios[i].id).encoded;
		const entrada = tf.concat([libro, datosid]);
		datos.push(entrada);
		salidas.push([trios[i].nota / 10]);
	}
	const entrada = tf.stack(datos);
	const salida = tf.tensor(salidas);
	await recommender.train(entrada, salida);
	await recommender.saveModel("./models/recommender");
	console.log("Recomendador guardado");
})();
