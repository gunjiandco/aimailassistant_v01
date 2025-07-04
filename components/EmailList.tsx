

import React from 'react';
import { Email, EmailStatus, SentEmail } from '../types';
import EmailListItem from './EmailListItem';
import InboxIcon from './icons/InboxIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import { searchEmailsWithAi } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';
import PencilIcon from './icons/PencilIcon';


interface EmailListProps {
  items: Array<Email | SentEmail>;
  selectedItemId: string | null;
  onItemSelect: (id: string) => void;
  bulkSelectedIds: string[];
  inboxSubView: 'inbox' | 'sent';
  filterStatus: EmailStatus | 'all';
  setFilterStatus: (status: EmailStatus | 'all') => void;
  filterTag: string | 'all';
  setFilterTag: (tag: string | 'all') => void;
  allAiTags: string[];
  isAiSearching: boolean;
  aiSearchResultIds: string[] | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const EmailList: React.FC<EmailListProps> = ({ 
  items, 
  selectedItemId, 
  onItemSelect, 
  bulkSelectedIds, 
  inboxSubView, 
  filterStatus,
  setFilterStatus,
  filterTag,
  setFilterTag,
  allAiTags,
  isAiSearching,
  aiSearchResultIds,
  searchTerm,
  setSearchTerm,
}) => {
  const dispatch = useAppDispatch();
  const { emails: allEmails } = useAppState();
  const [aiSearchQuery, setAiSearchQuery] = React.useState('');

  const handleBulkSelect = (id: string) => {
    const newSelection = bulkSelectedIds.includes(id) 
      ? bulkSelectedIds.filter(i => i !== id) 
      : [...bulkSelectedIds, id];
    dispatch({ type: 'SET_BULK_SELECTED_IDS', payload: newSelection });
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim() || isAiSearching) return;

    dispatch({ type: 'AI_SEARCH_START' });
    const results = await searchEmailsWithAi(aiSearchQuery, allEmails);
    if (results !== null) {
        dispatch({ type: 'AI_SEARCH_SUCCESS', payload: results });
        if (results.length === 0) {
             dispatch({ type: 'ADD_NOTIFICATION', payload: { message: '検索条件に一致するメールは見つかりませんでした。', type: 'info' } });
        }
    } else {
        dispatch({ type: 'AI_SEARCH_CLEAR' });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'AI検索中にエラーが発生しました。', type: 'error' } });
    }
  };
  
  const handleComposeNew = () => {
    dispatch({ type: 'SET_SELECTED_ITEM', payload: 'new' });
  };

  const handleClearAiSearch = () => {
    setAiSearchQuery('');
    dispatch({ type: 'AI_SEARCH_CLEAR' });
  };
  
  return (
    <div className="bg-white dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 w-full md:w-[380px] lg:w-[420px] h-full flex flex-col flex-shrink-0 relative">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
         <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
          <button onClick={() => dispatch({ type: 'SET_INBOX_SUB_VIEW', payload: 'inbox'})} className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors ${inboxSubView === 'inbox' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <InboxIcon className="w-5 h-5"/>
            受信トレイ
          </button>
          <button onClick={() => dispatch({ type: 'SET_INBOX_SUB_VIEW', payload: 'sent'})} className={`flex-1 flex items-center justify-center gap-2 p-3 text-sm font-semibold transition-colors ${inboxSubView === 'sent' ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>
            <PaperAirplaneIcon className="w-5 h-5"/>
            送信済み
          </button>
        </div>
        
        {inboxSubView === 'inbox' && (
          <form onSubmit={handleAiSearch} className="mb-2">
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                   <SparklesIcon className={`w-5 h-5 ${isAiSearching ? 'text-primary-500 animate-pulse' : 'text-slate-400'}`} />
                </div>
                <input
                    type="search"
                    placeholder="AIで検索 (例: 田中さんのプレゼンの件)"
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    disabled={isAiSearching}
                    className="w-full pl-10 pr-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                />
            </div>
          </form>
        )}

        <input
          type="text"
          placeholder="ID、件名、差出人などで絞り込み..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
        />
        {inboxSubView === 'inbox' && (
          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EmailStatus | 'all')}
              className="w-full sm:w-1/2 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="all">すべてのステータス</option>
              {Object.values(EmailStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value as string | 'all')}
              className="w-full sm:w-1/2 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              disabled={allAiTags.length === 0}
            >
              <option value="all">すべてのAIタグ</option>
              {allAiTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {inboxSubView === 'inbox' && (
        <button
          onClick={handleComposeNew}
          className="absolute bottom-6 right-6 flex items-center justify-center w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-transform duration-200 hover:scale-105 z-20"
          title="新規メール作成"
        >
          <PencilIcon className="w-7 h-7" />
        </button>
      )}

      {inboxSubView === 'inbox' && aiSearchResultIds !== null && (
         <div className="px-4 py-2 bg-primary-50 dark:bg-primary-900/50 border-y border-primary-200 dark:border-primary-800 flex justify-between items-center text-sm flex-shrink-0">
            <p className="font-medium text-primary-700 dark:text-primary-200">
                AI検索結果: {items.length}件
            </p>
            <button onClick={handleClearAiSearch} className="flex items-center gap-1 text-primary-600 dark:text-primary-300 hover:underline font-semibold">
                <XMarkIcon className="w-4 h-4" />
                クリア
            </button>
        </div>
      )}

      <ul className="overflow-y-auto flex-grow">
        {items.map((item, index, array) => {
            const prevItem = array[index - 1];
            const isThreadChild = item.threadId && prevItem?.threadId === item.threadId;

            return (
              <EmailListItem
                key={item.id}
                item={item}
                isSelected={selectedItemId === item.id}
                onSelect={onItemSelect}
                selectedForBulk={inboxSubView === 'inbox' && bulkSelectedIds.includes(item.id)}
                onBulkSelect={handleBulkSelect}
                isThreadChild={isThreadChild}
              />
            );
        })}
         {items.length === 0 && (
            <div className="text-center p-8 text-slate-500">
                <p>メールが見つかりませんでした。</p>
            </div>
        )}
      </ul>
    </div>
  );
};

export default EmailList;