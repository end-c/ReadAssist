import { create } from 'zustand';
import { Book } from './db';

export type AIModel = 'gemini' | 'deepseek' | 'minimax' | 'openai';

interface AppState {
  currentBook: Book | null;
  setCurrentBook: (book: Book | null) => void;
  isShelfOpen: boolean;
  toggleShelf: () => void;
  isAIPanelOpen: boolean;
  setAIPanelOpen: (open: boolean) => void;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  apiKeys: Record<AIModel, string>;
  setApiKey: (model: AIModel, key: string) => void;
}

export const useStore = create<AppState>((set) => ({
  currentBook: null,
  setCurrentBook: (book) => set({ currentBook: book }),
  isShelfOpen: true,
  toggleShelf: () => set((state) => ({ isShelfOpen: !state.isShelfOpen })),
  isAIPanelOpen: false,
  setAIPanelOpen: (open) => set({ isAIPanelOpen: open }),
  selectedModel: 'gemini',
  setSelectedModel: (model) => set({ selectedModel: model }),
  apiKeys: {
    gemini: process.env.GEMINI_API_KEY || '',
    deepseek: process.env.DEEPSEEK_API_KEY || '',
    minimax: process.env.MINIMAX_API_KEY || '',
    openai: process.env.OPENAI_API_KEY || '',
  },
  setApiKey: (model, key) => set((state) => ({
    apiKeys: { ...state.apiKeys, [model]: key }
  })),
}));
