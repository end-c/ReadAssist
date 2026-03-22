import Dexie, { type Table } from 'dexie';

export interface Book {
  id?: number;
  title: string;
  author?: string;
  file: Blob;
  type: 'pdf' | 'epub' | 'txt' | 'docx';
  addedAt: number;
  lastReadAt: number;
  progress: number; // Page number or percentage
}

export interface Note {
  id?: number;
  bookId: number;
  content: string;
  aiResponse?: string;
  selectionText?: string;
  pageNumber?: number;
  createdAt: number;
}

export class ReadAssistDB extends Dexie {
  books!: Table<Book>;
  notes!: Table<Note>;

  constructor() {
    super('ReadAssistDB');
    this.version(1).stores({
      books: '++id, title, addedAt, lastReadAt',
      notes: '++id, bookId, createdAt'
    });
  }
}

export const db = new ReadAssistDB();
