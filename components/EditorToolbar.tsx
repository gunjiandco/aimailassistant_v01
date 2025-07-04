
import React, { useRef, useState, useEffect } from 'react';
import BoldIcon from './icons/BoldIcon';
import ItalicIcon from './icons/ItalicIcon';
import UnderlineIcon from './icons/UnderlineIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import ListOrderedIcon from './icons/ListOrderedIcon';
import LinkIcon from './icons/LinkIcon';
import PhotoIcon from './icons/PhotoIcon';
import FontColorIcon from './icons/FontColorIcon';

interface EditorToolbarProps {
  execCmd: (command: string, value?: string) => void;
  handleLink: () => void;
  handleImage?: () => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ execCmd, handleLink, handleImage }) => {
    const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
    const colorPickerRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if (!isColorPickerOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
                setIsColorPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isColorPickerOpen]);

    const colors = ['#0F172A', '#64748B', '#DC2626', '#2563EB', '#16A34A', '#F97316', '#9333EA', '#FFFFFF'];

  return (
    <div className="flex items-center flex-wrap gap-1 p-2 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
      <button type="button" title="太字" onClick={() => execCmd('bold')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><BoldIcon className="w-5 h-5"/></button>
      <button type="button" title="斜体" onClick={() => execCmd('italic')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ItalicIcon className="w-5 h-5"/></button>
      <button type="button" title="下線" onClick={() => execCmd('underline')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><UnderlineIcon className="w-5 h-5"/></button>
      <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
      <button type="button" title="箇条書き" onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ListBulletIcon className="w-5 h-5"/></button>
      <button type="button" title="番号付きリスト" onClick={() => execCmd('insertOrderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ListOrderedIcon className="w-5 h-5"/></button>
      <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
      <button type="button" title="リンク" onClick={handleLink} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><LinkIcon className="w-5 h-5"/></button>
      {handleImage && <button type="button" title="画像" onClick={handleImage} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><PhotoIcon className="w-5 h-5"/></button>}
       <div className="relative" ref={colorPickerRef}>
          <button type="button" title="文字色" onClick={() => setIsColorPickerOpen(prev => !prev)} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
              <FontColorIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-20">
                  <div className="grid grid-cols-4 gap-1">
                      {colors.map(color => (
                          <button
                              key={color}
                              type="button"
                              aria-label={`Color ${color}`}
                              className="w-6 h-6 rounded-sm border border-slate-400 dark:border-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                  execCmd('foreColor', color);
                                  setIsColorPickerOpen(false);
                              }}
                          />
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default EditorToolbar;
