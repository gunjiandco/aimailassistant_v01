
import React, { useState, useEffect } from 'react';
import { Contact, BulkDraft } from '../types';
import { generateBulkDraft } from '../services/geminiService';
import XMarkIcon from './icons/XMarkIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import SparklesIcon from './icons/SparklesIcon';
import UsersIcon from './icons/UsersIcon';
import ClipboardDocumentCheckIcon from './icons/ClipboardDocumentCheckIcon';
import { useAppState } from '../contexts/AppContext';


interface BulkSendModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipients: Contact[];
}

const AiDraftSkeleton: React.FC = () => (
  <div className="animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
      <div className="h-20 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
  </div>
);


const BulkSendModal: React.FC<BulkSendModalProps> = ({ isOpen, onClose, recipients }) => {
    const { appSettings } = useAppState();
    const [prompt, setPrompt] = useState('');
    const [draft, setDraft] = useState<BulkDraft | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [placeholders, setPlaceholders] = useState<{ text: string; checked: boolean }[]>([]);

    const placeholderRegex = /({{\s*[^}]+?\s*}})|(\[\s*[^\]]+?\s*\])/g;

    useEffect(() => {
        if (!isOpen) {
            setPrompt('');
            setDraft(null);
            setIsGenerating(false);
            setPlaceholders([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!draft?.body) {
            setPlaceholders([]);
            return;
        }
        const matches = draft.body.match(placeholderRegex) || [];
        const uniquePlaceholders = [...new Set(matches)];

        setPlaceholders(currentPlaceholders => {
            const newPlaceholders = uniquePlaceholders.map(text => {
                const existing = currentPlaceholders.find(p => p.text === text);
                return existing || { text, checked: false };
            });
            return newPlaceholders.filter(p => uniquePlaceholders.includes(p.text));
        });
    }, [draft?.body]);

    const handleGenerateDraft = async () => {
        if (!prompt || isGenerating) return;
        setIsGenerating(true);
        const result = await generateBulkDraft(prompt, appSettings);
        setDraft(result);
        setIsGenerating(false);
    };

    const handlePlaceholderCheck = (text: string) => {
        setPlaceholders(current =>
          current.map(p => (p.text === text ? { ...p, checked: !p.checked } : p))
        );
    };
    
    const handleSend = () => {
        // 実際のアプリでは、ここでメールを送信します。
        // このデモでは、アラートを表示して閉じます。
        alert(`${recipients.length}名の宛先にメールを送信するシミュレーションを実行します。\n\n件名: ${draft?.subject}`);
        onClose();
    };
    
    const allPlaceholdersChecked = placeholders.every(p => p.checked);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-transform" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">一括メール送信</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                           <UsersIcon className="w-5 h-5 text-primary-500"/>
                           宛先 ({recipients.length}名)
                        </h3>
                        <div className="max-h-24 overflow-y-auto bg-slate-100 dark:bg-slate-900/50 p-2 rounded-md text-xs">
                           {recipients.map(r => r.name).join(', ')}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2 mb-2">
                           <SparklesIcon className="w-5 h-5 text-primary-500"/>
                           AIでドラフトを作成
                        </h3>
                        <div className="flex gap-2">
                            <input 
                                type="text"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                placeholder="例: プレゼン資料の提出期限をリマインド"
                                className="flex-grow px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                disabled={isGenerating}
                            />
                            <button 
                                onClick={handleGenerateDraft} 
                                className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400"
                                disabled={!prompt || isGenerating}
                            >
                                {isGenerating ? '生成中...' : '生成'}
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        {isGenerating && <AiDraftSkeleton />}
                        {draft && !isGenerating && (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">件名</label>
                                    <input 
                                        id="subject"
                                        type="text"
                                        value={draft.subject}
                                        onChange={e => setDraft({...draft, subject: e.target.value})}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="body" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">本文</label>
                                    <textarea 
                                        id="body"
                                        rows={10}
                                        value={draft.body}
                                        onChange={e => setDraft({...draft, body: e.target.value})}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">&#123;&#123;name&#125;&#125; を名前のプレースホルダーとして使用できます。</p>
                                </div>
                            </div>
                        )}
                         {placeholders.length > 0 && (
                            <div className="mt-4 p-3 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/50 rounded-lg">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                                    <ClipboardDocumentCheckIcon className="w-5 h-5"/>
                                    プレースホルダーの確認
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 mb-3">送信前に、以下の項目が正しく置換されていることを確認してください。</p>
                                <div className="space-y-2">
                                {placeholders.map(({ text, checked }) => (
                                    <label key={text} className={`flex items-center p-2 rounded-md transition-colors cursor-pointer ${
                                        checked ? 'bg-green-100 dark:bg-green-800/60' : 'bg-amber-100 dark:bg-amber-800/60'
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => handlePlaceholderCheck(text)}
                                        className="h-4 w-4 rounded border-slate-400 bg-white dark:bg-slate-900 text-primary-600 focus:ring-primary-500"
                                    />
                                    <span className={`ml-3 text-sm font-mono ${
                                        checked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'
                                    }`}>{text}</span>
                                    </label>
                                ))}
                                </div>
                            </div>
                         )}
                    </div>

                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button 
                        onClick={handleSend}
                        disabled={!draft || (placeholders.length > 0 && !allPlaceholdersChecked)}
                        title={placeholders.length > 0 && !allPlaceholdersChecked ? 'すべてのプレースホルダーを確認してください' : ''}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        {recipients.length}名に送信
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkSendModal;