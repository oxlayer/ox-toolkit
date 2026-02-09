// Global environment variable declarations
declare global {
  interface ImportMetaEnv {
    readonly VITE_PUBLIC_API_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
