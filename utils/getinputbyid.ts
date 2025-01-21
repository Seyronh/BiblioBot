import tf from "@tensorflow/tfjs-node";
import { ListManager, PineconeManager } from "../managers";
import { getInputByID as inputCache } from "../caches";

async function getInputById(userid: string): Promise<tf.Tensor> {
	const resultCache = inputCache.getInstance().getTensor(userid);
	if (resultCache) return resultCache;
	const [leidos, leyendo, planeando] = await Promise.all([
		ListManager.getInstance().getList(userid, 0),
		ListManager.getInstance().getList(userid, 1),
		ListManager.getInstance().getList(userid, 2),
	]);
	const [embeddingsLeidos, embeddingsLeyendo, embeddingsPlaneando] =
		await Promise.all([
			PineconeManager.getInstance().getEmbeddings(leidos),
			PineconeManager.getInstance().getEmbeddings(leyendo),
			PineconeManager.getInstance().getEmbeddings(planeando),
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
	inputCache.getInstance().setTensor(userid, entrada);
	return entrada;
}
async function getInputByTitle(title: string): Promise<tf.Tensor> {
	return tf.tensor(await PineconeManager.getInstance().getEmbedding(title));
}
export { getInputById, getInputByTitle };
