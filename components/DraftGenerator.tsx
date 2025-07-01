
import React, { useState, useCallback } from 'react';
import { generateReplyDraft } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import { useAppState } from '../contexts/AppContext';
import { Attachment } from '../types';

interface DraftGeneratorProps {
  emailBody: string;
  recipientName: string;
}

const TEMPLATE_TYPES = ['リマインダー', '宿泊手配', '経費精算', '入場案内'];

const DraftGenerator: React.FC<DraftGeneratorProps> = ({ emailBody, recipientName }) => {
  const { appSettings } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState('');

  const handleGenerateDraft = useCallback(async (templateType: string) => {
    setIsLoading(true);
    setDraft('');
    const generated = await generateReplyDraft(emailBody, templateType, recipientName, undefined, appSettings);
    setDraft(generated || 'ドラフトの生成に失敗しました。');
    setIsLoading(false);
  }, [emailBody, recipientName, appSettings]);
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-primary-500"/>
        返信ドラフトを生成
      </h3>
      <div className="flex flex-wrap gap-2 mt-2">
        {TEMPLATE_TYPES.map(type => (
          <button
            key={type}
            onClick={() => handleGenerateDraft(type)}
            disabled={isLoading}
            className="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 disabled:bg-slate-200 disabled:cursor-not-allowed dark:bg-primary-900/50 dark:text-primary-200 dark:hover:bg-primary-900"
          >
            {type}
          </button>
        ))}
      </div>
      
      {isLoading && (
        <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2.5"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      )}

      {draft && !isLoading && (
        <div className="mt-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="w-full p-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="mt-2 flex justify-between items-center">
             <select className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md p-1 focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option>送信元: nexttokyo@gunji.co</option>
                <option>送信元: support@gunji.co</option>
             </select>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700">
                <PaperAirplaneIcon className="w-4 h-4"/>
                送信
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DraftGenerator;
