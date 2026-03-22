import React, { useEffect, useState } from 'react';
import { db, Book } from '../db';
import { useStore } from '../store';
import { Plus, Book as BookIcon, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Shelf() {
  const [books, setBooks] = useState<Book[]>([]);
  const { setCurrentBook, isShelfOpen, toggleShelf } = useStore();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const allBooks = await db.books.orderBy('lastReadAt').reverse().toArray();
    setBooks(allBooks);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newBook: Book = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      file: file,
      type: 'pdf', // For now, focus on PDF
      addedAt: Date.now(),
      lastReadAt: Date.now(),
      progress: 1
    };

    await db.books.add(newBook);
    loadBooks();
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const deleteBook = async (id: number) => {
    if (deleteConfirmId === id) {
      await db.books.delete(id);
      setDeleteConfirmId(null);
      loadBooks();
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  return (
    <motion.div 
      initial={false}
      animate={{ width: isShelfOpen ? 320 : 0 }}
      className="bg-stone-100 border-r border-stone-200 h-screen overflow-hidden flex flex-col relative"
    >
      <div className="p-6 flex-1 overflow-y-auto min-w-[320px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-serif font-bold italic">书架</h2>
          <label className="cursor-pointer p-2 bg-stone-900 text-white rounded-full hover:bg-stone-800 transition-colors">
            <Plus size={20} />
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="space-y-4">
          {books.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <BookIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-sm">还没有书籍，点击上方按钮上传</p>
            </div>
          )}
          
          <AnimatePresence>
            {books.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group bg-white p-4 rounded-xl border border-stone-200 hover:border-stone-400 transition-all cursor-pointer shadow-sm hover:shadow-md"
                onClick={() => setCurrentBook(book)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-stone-800 line-clamp-2 flex-1">{book.title}</h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteBook(book.id!); }}
                    className={`p-1 transition-all ${deleteConfirmId === book.id ? 'text-red-500 bg-red-50 rounded' : 'opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500'}`}
                  >
                    {deleteConfirmId === book.id ? <span className="text-[10px] font-bold px-1">确认删除?</span> : <Trash2 size={16} />}
                  </button>
                </div>
                <div className="flex items-center text-xs text-stone-400 gap-3">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(book.lastReadAt).toLocaleDateString()}
                  </span>
                  <span>P.{book.progress}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
