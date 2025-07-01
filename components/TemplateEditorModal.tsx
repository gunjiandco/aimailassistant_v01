

import React, { useState, useEffect, useRef } from 'react';
import { Template } from '../types';
import { generateTemplateDraft, generateTagsForTemplate } from '../services/geminiService';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';
import { useAppDispatch, useAppState } from '../contexts/AppContext';

import BoldIcon from './icons/BoldIcon';
import ItalicIcon from './icons/ItalicIcon';
import UnderlineIcon from './icons/UnderlineIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import ListOrderedIcon from './icons/ListOrderedIcon';
import LinkIcon from './icons/LinkIcon';
import FontColorIcon from './icons/FontColorIcon';


interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

const AiDraftSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
        <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
    </div>
);


const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ isOpen, onClose, template }) => {
  const { currentUser, appSettings } = useAppState();
  const dispatch = useAppDispatch();
  const editorRef = useRef<HTMLDivElement>(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (isOpen) {
      const initialBody = template?.body || '';
      setTitle(template?.title || '');
      setBody(initialBody);
      setTags(template?.tags?.join(', ') || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = initialBody;
      }
      setAiPrompt('');
      setIsGenerating(false);
      setIsGeneratingTags(false);
      setIsColorPickerOpen(false);
    }
  }, [isOpen, template]);

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


  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if(editorRef.current) {
        setBody(editorRef.current.innerHTML);
        editorRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = window.prompt("リンク先のURLを入力してください:", "https://");
    if (url) {
        execCmd('createLink', url);
    }
  };

  const insertPlaceholder = () => {
    execCmd('insertHTML', '<strong>{{name}}</strong>&nbsp;');
  };

  const handleBodyChange = (e: React.FormEvent<HTMLDivElement>) => {
    setBody(e.currentTarget.innerHTML);
  };

  const handleGenerateDraft = async () => {
    if (!aiPrompt || isGenerating) return;
    setIsGenerating(true);
    const result = await generateTemplateDraft(aiPrompt, appSettings);
    if (result) {
        const htmlBody = result.body
            .split('\n\n')
            .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
            .join('');

      setTitle(result.title);
      setBody(htmlBody);
      setTags(result.tags?.join(', ') || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlBody;
      }
    } else {
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'テンプレートの生成に失敗しました', type: 'error' } });
    }
    setIsGenerating(false);
  };
  
  const handleGenerateTags = async () => {
    if ((!title && !body) || isGeneratingTags) return;
    setIsGeneratingTags(true);
    const result = await generateTagsForTemplate(title, body);
    if (result && result.length > 0) {
      setTags(result.join(', '));
    } else {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'タグの生成に失敗しました。内容を確認してください。', type: 'error' } });
    }
    setIsGeneratingTags(false);
  };


  const handleSave = () => {
    if (!title || !body) {
        alert('タイトルと本文を入力してください。');
        return;
    };
    
    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    if (template?.id) {
        dispatch({
            type: 'UPDATE_TEMPLATE',
            payload: { template: { ...template, title, body, tags: tagsArray }, user: currentUser }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'テンプレートを更新しました', type: 'info' } });
    } else {
        dispatch({
            type: 'ADD_TEMPLATE',
            payload: { title, body, tags: tagsArray, user: currentUser }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'テンプレートを追加しました', type: 'success' } });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {template ? 'テンプレートを編集' : '新規テンプレートを作成'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
            <div>
                <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                    <SparklesIcon className="w-5 h-5 text-primary-500"/>
                    AIで草案を作成 (任意)
                </h3>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="例: 丁寧な催促のテンプレート"
                        className="flex-grow px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        disabled={isGenerating}
                    />
                    <button
                        onClick={handleGenerateDraft}
                        className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400"
                        disabled={!aiPrompt || isGenerating}
                    >
                        {isGenerating ? '生成中...' : '生成'}
                    </button>
                </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                {isGenerating ? <AiDraftSkeleton /> : (
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="template-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">タイトル</label>
                            <input
                                id="template-title"
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="template-body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">本文</label>
                             <div className="flex items-center gap-1 p-2 border border-b-0 border-slate-300 dark:border-slate-600 rounded-t-md bg-slate-50 dark:bg-slate-700/50">
                                <button type="button" title="太字" onClick={() => execCmd('bold')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><BoldIcon className="w-5 h-5"/></button>
                                <button type="button" title="斜体" onClick={() => execCmd('italic')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ItalicIcon className="w-5 h-5"/></button>
                                <button type="button" title="下線" onClick={() => execCmd('underline')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><UnderlineIcon className="w-5 h-5"/></button>
                                <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                                <button type="button" title="箇条書き" onClick={() => execCmd('insertUnorderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ListBulletIcon className="w-5 h-5"/></button>
                                <button type="button" title="番号付きリスト" onClick={() => execCmd('insertOrderedList')} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><ListOrderedIcon className="w-5 h-5"/></button>
                                <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                                <button type="button" title="リンク" onClick={handleLink} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600"><LinkIcon className="w-5 h-5"/></button>
                                <div className="relative" ref={colorPickerRef}>
                                    <button type="button" title="文字色" onClick={() => setIsColorPickerOpen(prev => !prev)} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-600">
                                        <FontColorIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                                    </button>
                                    {isColorPickerOpen && (
                                        <div className="absolute top-full left-0 mt-2 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg z-20">
                                            <div className="grid grid-cols-4 gap-1">
                                                {['#0F172A', '#64748B', '#DC2626', '#2563EB', '#16A34A', '#F97316', '#9333EA', '#FFFFFF'].map(color => (
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
                                <div className="w-px h-5 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                                <button type="button" onClick={insertPlaceholder} className="px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-700 rounded hover:bg-primary-200 dark:bg-primary-900/50 dark:text-primary-200 dark:hover:bg-primary-900">
                                    &#123;&#123;name&#125;&#125;
                                </button>
                            </div>
                            <div
                                id="template-body"
                                ref={editorRef}
                                contentEditable={true}
                                onInput={handleBodyChange}
                                className="w-full min-h-[250px] px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-b-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm prose prose-slate dark:prose-invert max-w-none"
                                spellCheck="false"
                            />
                            <p className="text-xs text-slate-500 mt-1">&#123;&#123;name&#125;&#125; を名前のプレースホルダーとして使用できます。</p>
                        </div>
                         <div>
                            <label htmlFor="template-tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">タグ</label>
                            <div className="flex items-center gap-2">
                                <input
                                    id="template-tags"
                                    type="text"
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    placeholder="例: 挨拶, リマインダー, お礼"
                                    className="flex-grow px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleGenerateTags}
                                    title="内容に基づいてAIでタグを生成します"
                                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                                    disabled={isGeneratingTags || (!title.trim() && !body.trim())}
                                >
                                    <SparklesIcon className="w-4 h-4"/>
                                    <span>{isGeneratingTags ? '生成中...' : '生成'}</span>
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">カンマ区切りで複数のタグを入力できます。</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
             <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600">
                キャンセル
             </button>
             <button
                onClick={handleSave}
                disabled={isGenerating || !title || !body}
                className="px-6 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400"
            >
                保存
            </button>
        </div>

      </div>
    </div>
  );
};

export default TemplateEditorModal;