class CacheItem<V> {
	value: V;
	TTL: number;
	private initialTTL: number;

	constructor(value: V, TTL: number) {
		this.value = value;
		this.TTL = TTL;
		this.initialTTL = TTL;
	}
	public resetTTL() {
		this.TTL = this.initialTTL;
	}
}

const duracionHoras = 1;
const duracionMilisegundos = duracionHoras * 60 * 60 * 1000;

export class LRUCache<K, V> {
	private capacity: number;
	private cache: Map<K, CacheItem<V>>;
	private defaultTTL: number;
	private interval: Timer;

	constructor(capacity: number, defaultTTL: number = 1) {
		this.capacity = capacity;
		this.cache = new Map<K, CacheItem<V>>();
		this.defaultTTL = defaultTTL;
	}

	// Get the value associated with the key
	get(key: K): V | undefined {
		if (!this.cache.has(key)) {
			return undefined;
		}
		const value = this.cache.get(key);
		value.resetTTL();
		this.cache.delete(key);
		this.cache.set(key, value);
		return value.value;
	}

	// Put a key-value pair into the cache
	put(key: K, value: V) {
		if (this.cache.has(key)) {
			this.delete(key);
		} else if (this.cache.size >= this.capacity) {
			const oldestKey = this.cache.keys().next().value;
			this.delete(oldestKey);
		}
		this.cache.set(key, new CacheItem(value, this.defaultTTL));
		if (!this.interval) {
			this.interval = setInterval(() => {
				this.updateTTL();
			}, duracionMilisegundos);
		}
	}

	// Delete a key-value pair from the cache
	delete(key: K) {
		this.cache.delete(key);
		if (this.cache.size == 0) {
			clearInterval(this.interval);
			this.interval = null;
		}
	}

	// Delete all key-value pairs that match the given regular expression
	deleteAll(key: RegExp) {
		//@ts-ignore
		for (const prop of this.cache.keys()) {
			if (key.test(prop.toString())) {
				this.cache.delete(prop);
			}
		}
	}
	updateTTL() {
		//@ts-ignore
		for (const key of this.cache.keys()) {
			const valor = this.cache.get(key);
			valor.TTL--;
			if (valor.TTL <= 0) {
				this.delete(key);
			}
		}
	}
}
