class InMemoryBlacklistStore {
  constructor() {
    this.tokens = new Map();
  }

  async get(key) {
    return this.tokens.get(key) ?? null;
  }

  async set(key, value) {
    this.tokens.set(key, value);
    return "OK";
  }
}

export function createFallbackRedisClient() {
  return new InMemoryBlacklistStore();
}
