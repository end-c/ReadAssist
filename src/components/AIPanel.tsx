import React, { useState, useEffect } from 'react';
import { useStore, AIModel } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BookOpen, MessageSquare, History, Trash2, Settings2, ChevronDown } from 'lucide-react';
import { explainText, summarizeChapter } from '../services/ai';
import { db, Note } from '../db';
import Markdown from 'react-markdown';

const MODEL_LABELS: Record<AIModel, string> = {
  gemini: 'Gemini (默认)',
  deepseek: 'DeepSeek',
  minimax: 'MiniMax',
  openai: 'OpenAI'
};

export default function AIPanel() {
  const { isAIPanelOpen, setAIPanelOpen, currentBook, selectedModel, setSelectedModel, apiKeys, setApiKey } = useStore();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<'ai' | 'notes'>('ai');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const currentApiKey = apiKeys[selectedModel];

  useEffect(() => {
    if (isAIPanelOpen) {
      const lastSel = (window as any).lastSelection;
      if (lastSel) {
        if (currentApiKey) {
          handleExplain(lastSel);
        } else {
          setActiveTab('ai');
          setResult(null);
        }
        (window as any).lastSelection = null;
      }
    }
  }, [isAIPanelOpen, selectedModel, currentApiKey]);

  useEffect(() => {
    if (currentBook?.id) {
      loadNotes();
    }
  }, [currentBook]);

  const loadNotes = async () => {
    if (!currentBook?.id) return;
    const allNotes = await db.notes.where('bookId').equals(currentBook.id).reverse().toArray();
    setNotes(allNotes);
  };

  const handleExplain = async (text: string) => {
    if (!currentApiKey) return;
    setLoading(true);
    setActiveTab('ai');
    const response = await explainText(text, selectedModel, currentApiKey);
    setResult(response || "无法获取解读。");
    setLoading(false);

    // Auto save to notes
    if (currentBook?.id && response) {
      await db.notes.add({
        bookId: currentBook.id,
        content: `**[${MODEL_LABELS[selectedModel]}] 原文：** ${text}\n\n**AI 解读：**\n${response}`,
        selectionText: text,
        aiResponse: response,
        createdAt: Date.now()
      });
      loadNotes();
    }
  };

  const saveApiKey = () => {
    if (tempKey.trim()) {
      setApiKey(selectedModel, tempKey.trim());
      setTempKey('');
    }
  };

  const deleteNote = async (id: number) => {
    await db.notes.delete(id);
    loadNotes();
  };

  return (
    <AnimatePresence>
      {isAIPanelOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-screen w-[400px] bg-white shadow-2xl z-50 border-l border-stone-200 flex flex-col"
        >
          <div className="p-6 border-b border-stone-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <h2 className="text-lg font-serif font-bold">AI 助手</h2>
            </div>
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <div className="relative">
                <button 
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 bg-stone-100 px-2 py-1 rounded-md transition-colors"
                >
                  {MODEL_LABELS[selectedModel]}
                  <ChevronDown size={12} />
                </button>
                
                {showModelMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-stone-200 rounded-lg shadow-xl z-10 py-1 overflow-hidden">
                    {(Object.keys(MODEL_LABELS) as AIModel[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setSelectedModel(m);
                          setShowModelMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs hover:bg-stone-50 transition-colors ${selectedModel === m ? 'text-stone-900 font-bold bg-stone-50' : 'text-stone-500'}`}
                      >
                        {MODEL_LABELS[m]}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={() => setAIPanelOpen(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="flex border-b border-stone-100">
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'ai' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              当前解读
            </button>
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'notes' ? 'text-stone-900 border-b-2 border-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
            >
              历史笔记 ({notes.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'ai' ? (
              <div className="space-y-6">
                {!currentApiKey ? (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-medium text-sm">
                      <Settings2 size={16} />
                      需要配置 API Key
                    </div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      您选择的模型 <strong>{MODEL_LABELS[selectedModel]}</strong> 尚未配置 API Key。请在下方输入或在系统设置中配置。
                    </p>
                    <div className="flex gap-2">
                      <input 
                        type="password" 
                        placeholder="输入 API Key..."
                        value={tempKey}
                        onChange={(e) => setTempKey(e.target.value)}
                        className="flex-1 bg-white border border-amber-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button 
                        onClick={saveApiKey}
                        className="bg-amber-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-amber-700 transition-colors"
                      >
                        保存
                      </button>
                    </div>
                  </div>
                ) : null}

                {loading ? (
                  <div className="space-y-4 animate-pulse">
                    <div className="h-4 bg-stone-100 rounded w-3/4" />
                    <div className="h-4 bg-stone-100 rounded w-full" />
                    <div className="h-4 bg-stone-100 rounded w-5/6" />
                    <div className="h-32 bg-stone-50 rounded w-full mt-8" />
                  </div>
                ) : result ? (
                  <div className="markdown-body">
                    <Markdown>{result}</Markdown>
                  </div>
                ) : (
                  <div className="text-center py-20 text-stone-400">
                    <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">选中文本并点击“AI 解读”<br/>获取深度分析</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {notes.length === 0 ? (
                  <div className="text-center py-20 text-stone-400">
                    <History size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-sm">还没有笔记</p>
                  </div>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="group bg-stone-50 p-4 rounded-xl border border-stone-200 relative">
                      <button 
                        onClick={() => deleteNote(note.id!)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="text-[10px] text-stone-400 mb-2 uppercase tracking-wider font-bold">
                        {new Date(note.createdAt).toLocaleString()}
                      </div>
                      <div className="markdown-body text-sm">
                        <Markdown>{note.content}</Markdown>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
