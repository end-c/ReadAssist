/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare namespace NodeJS {
  interface ProcessEnv {
    GEMINI_API_KEY: string;
    OPENAI_API_KEY: string;
    DEEPSEEK_API_KEY: string;
    MINIMAX_API_KEY: string;
  }
}
