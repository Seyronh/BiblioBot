import tf, { Rank } from "@tensorflow/tfjs-node";
import { AutoencoderCache } from "../caches";
class AutoEncoder {
	private capas: Array<number>;
	private encoder: tf.Sequential;
	private decoder: tf.Sequential;
	private autoencoder: tf.Sequential;
	private static instance: AutoEncoder;
	static async getInstance() {
		if (!AutoEncoder.instance) {
			AutoEncoder.instance = await this.loadModel("./models/autoencoder");
		}
		return AutoEncoder.instance;
	}
	constructor() {
		//1024 AVG_READED_EMBEDDING + 1024 AVG_READING_EMBEDDING + 1024 AVG_PLAN_EMBEDDING = 3072
		this.capas = [3072, 774, 194];
		this.encoder = this.createEncoder();
		this.decoder = this.createDecoder();
		this.autoencoder = this.createAutoEncoder();
		this.compile();
	}
	compile(): void {
		this.autoencoder.compile({
			optimizer: "adam",
			loss: "meanSquaredError",
		});
	}
	setEncoder(encoder: tf.Sequential): void {
		this.encoder = encoder;
	}
	setDecoder(decoder: tf.Sequential): void {
		this.decoder = decoder;
	}
	setAutoEncoder(autoencoder: tf.Sequential): void {
		this.autoencoder = autoencoder;
	}
	private createEncoder(): tf.Sequential {
		const encoder = tf.sequential();
		for (let i = 1; i < this.capas.length; i++) {
			encoder.add(
				tf.layers.dense({
					units: this.capas[i],
					inputShape: i == 1 ? [this.capas[i - 1]] : undefined,
				})
			);
		}
		return encoder;
	}
	private createDecoder(): tf.Sequential {
		const decoder = tf.sequential();
		const start = this.capas.length - 2;
		for (let i = start; i >= 0; i--) {
			decoder.add(
				tf.layers.dense({
					units: this.capas[i],
					inputShape: i == start ? [this.capas[i + 1]] : undefined,
				})
			);
		}
		return decoder;
	}
	private createAutoEncoder(): tf.Sequential {
		const autoEncoder = tf.sequential();
		autoEncoder.add(this.encoder);
		autoEncoder.add(this.decoder);
		return autoEncoder;
	}
	async train(data: tf.Tensor): Promise<void> {
		await this.autoencoder.fit(data, data, {
			epochs: 100,
		});
	}
	async encode(data: tf.Tensor): Promise<tf.Tensor<Rank> | tf.Tensor<Rank>[]> {
		const result = AutoencoderCache.getInstance().getEncoded(data);
		if (result) return result;
		const prediction = this.encoder.predict(data);
		AutoencoderCache.getInstance().saveEncoded(data, prediction as tf.Tensor);
		return prediction;
	}
	async decode(data: tf.Tensor) {
		return this.decoder.predict(data);
	}
	async encodeDecode(data: tf.Tensor) {
		return this.autoencoder.predict(data);
	}
	async saveModel(path: string) {
		await this.autoencoder.save(`file://${path}`);
	}

	static async loadModel(path: string): Promise<AutoEncoder> {
		const loadedModel = await tf.loadLayersModel(`file://${path}/model.json`);
		const autoEncoder = new AutoEncoder();
		autoEncoder.setAutoEncoder(loadedModel as tf.Sequential);
		autoEncoder.setEncoder(loadedModel.layers[0] as tf.Sequential);
		autoEncoder.setDecoder(loadedModel.layers[1] as tf.Sequential);
		autoEncoder.compile();
		return autoEncoder;
	}
}
export { AutoEncoder };
