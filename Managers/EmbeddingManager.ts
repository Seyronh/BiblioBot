import { VectorGenerator, EmbeddingModel, VectorTypes } from "vectorcore";

export class EmbeddingManager {
	private static instance: EmbeddingManager;
	private embeddingModel: VectorGenerator = null;

	public static getInstance() {
		if (!EmbeddingManager.instance) {
			EmbeddingManager.instance = new EmbeddingManager();
		}
		return EmbeddingManager.instance;
	}

	private constructor() {
		this.embeddingModel = new VectorGenerator(EmbeddingModel.AllMiniLML6V2);
		this.embeddingModel.initialize();
	}
	public isInitialized(): boolean {
		return this.embeddingModel !== null;
	}
	public async getQueryEmbedding(query: string): Promise<number[]> {
		if (!this.isInitialized()) return;

		return await this.embeddingModel.generateVector(query, VectorTypes.Query);
	}
	public async getPassageEmbedding(passage: string): Promise<number[]> {
		if (!this.isInitialized()) return;

		return await this.embeddingModel.generateVector(
			passage,
			VectorTypes.Passage
		);
	}
}
