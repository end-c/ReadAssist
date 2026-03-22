import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { useStore } from '../store';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Search, Sparkles, X } from 'lucide-react';
import { db } from '../db';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker path for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function Reader() {
  const { currentBook, setAIPanelOpen } = useStore();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentBook) {
      setPageNumber(currentBook.progress || 1);
    }
  }, [currentBook]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = async (offset: number) => {
    const newPage = Math.min(Math.max(1, pageNumber + offset), numPages);
    setPageNumber(newPage);
    if (currentBook?.id) {
      await db.books.update(currentBook.id, { progress: newPage, lastReadAt: Date.now() });
    }
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top - 40
      });
    } else {
      setSelection(null);
    }
  };

  if (!currentBook) {
    return (
      <div className="flex-1 flex items-center justify-center bg-stone-50 text-stone-400 italic font-serif">
        请在左侧书架选择一本书开始阅读
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen relative bg-stone-200 overflow-hidden" ref={containerRef}>
      {/* Toolbar */}
      <div className="h-14 bg-white/80 backdrop-blur-md border-b border-stone-300 flex items-center justify-between px-6 z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <h1 className="font-serif font-bold text-stone-700 truncate max-w-[300px]">{currentBook.title}</h1>
        </div>

        <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-lg border border-stone-200">
          <button onClick={() => changePage(-1)} disabled={pageNumber <= 1} className="p-1.5 hover:bg-white rounded-md disabled:opacity-30">
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-medium px-2 min-w-[80px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button onClick={() => changePage(1)} disabled={pageNumber >= numPages} className="p-1.5 hover:bg-white rounded-md disabled:opacity-30">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1.5 hover:bg-white rounded-md">
              <ZoomOut size={18} />
            </button>
            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 hover:bg-white rounded-md">
              <ZoomIn size={18} />
            </button>
          </div>
          <button 
            onClick={() => setAIPanelOpen(true)}
            className="flex items-center gap-2 bg-stone-900 text-white px-4 py-1.5 rounded-full hover:bg-stone-800 transition-all text-sm font-medium"
          >
            <Sparkles size={16} />
            AI 助手
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div 
        className="flex-1 overflow-auto pdf-container" 
        onMouseUp={handleSelection}
      >
        <Document
          file={currentBook.file}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="flex items-center justify-center h-full italic">加载中...</div>}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            loading={<div className="h-[800px] w-[600px] bg-white animate-pulse" />}
          />
        </Document>
      </div>

      {/* Selection Popup */}
      {selection && (
        <div 
          className="fixed z-50 bg-stone-900 text-white px-3 py-2 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-200"
          style={{ left: selection.x, top: selection.y, transform: 'translateX(-50%)' }}
        >
          <button 
            onClick={() => {
              // Store selection in a global way or pass to AI panel
              (window as any).lastSelection = selection.text;
              setAIPanelOpen(true);
              setSelection(null);
            }}
            className="flex items-center gap-1.5 text-sm font-medium hover:text-stone-300"
          >
            <Sparkles size={14} className="text-amber-400" />
            AI 解读
          </button>
          <div className="w-px h-4 bg-stone-700" />
          <button onClick={() => setSelection(null)} className="hover:text-stone-400">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
