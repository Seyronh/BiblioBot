import { DBManager } from "../managers";
import tf from "@tensorflow/tfjs-node";

async function getInputById(userid: string): Promise<tf.Tensor> {
	const instancia = DBManager.getInstance();
	const [leidos, leyendo, planeando] = await Promise.all([
		instancia.getListNoOffset(userid, 0),
		instancia.getListNoOffset(userid, 1),
		instancia.getListNoOffset(userid, 2),
	]);
	const [embeddingsLeidos, embeddingsLeyendo, embeddingsPlaneando] =
		await Promise.all([
			instancia.getEmbeddings(leidos),
			instancia.getEmbeddings(leyendo),
			instancia.getEmbeddings(planeando),
		]);
	const averageEmbeddingsLeidos =
		embeddingsLeidos.length == 0
			? tf.zeros([1024])
			: tf.tensor(embeddingsLeidos).mean(0);
	const averageEmbeddingsLeyendo =
		embeddingsLeyendo.length == 0
			? tf.zeros([1024])
			: tf.tensor(embeddingsLeyendo).mean(0);
	const averageEmbeddingsPlaneando =
		embeddingsPlaneando.length == 0
			? tf.zeros([1024])
			: tf.tensor(embeddingsPlaneando).mean(0);
	const entrada = tf.concat([
		averageEmbeddingsLeidos,
		averageEmbeddingsLeyendo,
		averageEmbeddingsPlaneando,
	]);
	averageEmbeddingsLeidos.dispose();
	averageEmbeddingsLeyendo.dispose();
	averageEmbeddingsPlaneando.dispose();

	return entrada;
}
async function getInputByTitle(title: string) {
	const instancia = DBManager.getInstance();

	return tf.tensor(await instancia.getEmbedding(title));
}
export { getInputById, getInputByTitle };
