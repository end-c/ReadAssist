import React from 'react';
import Shelf from './Shelf';
import Reader from './Reader';
import AIPanel from './AIPanel';
import { useStore } from '../store';
import { Menu } from 'lucide-react';

export default function Layout() {
  const { toggleShelf, isShelfOpen } = useStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Shelf />
      
      <main className="flex-1 flex flex-col relative">
        {!isShelfOpen && (
          <button 
            onClick={toggleShelf}
            className="absolute left-4 top-4 z-20 p-2 bg-white/80 backdrop-blur shadow-md rounded-full hover:bg-white transition-all text-stone-600"
          >
            <Menu size={20} />
          </button>
        )}
        <Reader />
      </main>

      <AIPanel />
    </div>
  );
}
