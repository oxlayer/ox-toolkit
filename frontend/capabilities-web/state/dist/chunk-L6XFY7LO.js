// src/persist/index.ts
function createLocalStorageAdapter(name) {
  return {
    name,
    get: () => {
      const item = localStorage.getItem(name);
      return item ? JSON.parse(item) : void 0;
    },
    set: (value) => {
      localStorage.setItem(name, JSON.stringify(value));
    },
    delete: () => {
      localStorage.removeItem(name);
    }
  };
}
function createSqliteAdapter(adapter) {
  return {
    get: async (key) => {
      const value = await adapter.getItem(key);
      if (!value) return void 0;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
    set: async (key, value) => {
      await adapter.setItem(key, JSON.stringify(value));
    },
    delete: async (key) => {
      await adapter.removeItem(key);
    }
  };
}

export { createLocalStorageAdapter, createSqliteAdapter };
//# sourceMappingURL=chunk-L6XFY7LO.js.map
//# sourceMappingURL=chunk-L6XFY7LO.js.map