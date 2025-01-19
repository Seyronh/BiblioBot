import tf from "@tensorflow/tfjs-node";

class Recommender {
	private capas: Array<number>;
	private modelo: tf.Sequential;
	private static instance: Recommender;
	static async getInstance() {
		if (!Recommender.instance) {
			Recommender.instance = await this.loadModel("./models/recommender");
		}
		return Recommender.instance;
	}
	constructor() {
		this.capas = [1218, 304, 76, 19, 1];
		this.modelo = this.createModelo();
		this.compile();
	}
	public setModelo(modelo: tf.Sequential) {
		this.modelo = modelo;
	}
	private createModelo() {
		const modelo = tf.sequential();
		for (let i = 1; i < this.capas.length; i++) {
			modelo.add(
				tf.layers.dense({
					units: this.capas[i],
					inputShape: i == 1 ? [this.capas[i - 1]] : undefined,
					activation: i == this.capas.length - 1 ? "sigmoid" : undefined,
				})
			);
		}
		return modelo;
	}
	compile() {
		this.modelo.compile({
			optimizer: "adam",
			loss: "meanSquaredError",
		});
	}
	async train(inputs: tf.Tensor, outputs: tf.Tensor) {
		await this.modelo.fit(inputs, outputs, {
			epochs: 100,
		});
	}
	async predict(data: tf.Tensor) {
		return this.modelo.predict(data);
	}
	async saveModel(path: string) {
		await this.modelo.save(`file://${path}`);
	}

	static async loadModel(path: string): Promise<Recommender> {
		const loadedModel = await tf.loadLayersModel(`file://${path}/model.json`);
		const recommender = new Recommender();
		recommender.setModelo(loadedModel as tf.Sequential);
		recommender.compile();
		return recommender;
	}
}
export { Recommender };
