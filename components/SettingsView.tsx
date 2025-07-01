

import React, { useState, useEffect } from 'react';
import { useAppState, useAppDispatch } from '../contexts/AppContext';
import { AppSettings } from '../types';
import Cog6ToothIcon from './icons/Cog6ToothIcon';
import KeyIcon from './icons/KeyIcon';
import TrashIcon from './icons/TrashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';

const SettingsView: React.FC = () => {
  const { appSettings } = useAppState();
  const dispatch = useAppDispatch();

  const [settings, setSettings] = useState<AppSettings>(appSettings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setSettings(appSettings);
    setIsDirty(false);
  }, [appSettings]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    setIsDirty(true);
  };

  const handleKnowledgeChange = (id: string, field: 'key' | 'value', value: string) => {
    setSettings(prev => ({
        ...prev,
        knowledgeBase: prev.knowledgeBase.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ),
    }));
    setIsDirty(true);
  };

  const addKnowledgeItem = () => {
      setSettings(prev => ({
          ...prev,
          knowledgeBase: [...(prev.knowledgeBase || []), { id: `new-${Date.now()}`, key: '', value: '' }],
      }));
      setIsDirty(true);
  };

  const removeKnowledgeItem = (id: string) => {
      setSettings(prev => ({
          ...prev,
          knowledgeBase: prev.knowledgeBase.filter(item => item.id !== id),
      }));
      setIsDirty(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'UPDATE_APP_SETTINGS', payload: settings });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: '設定を保存しました', type: 'success' } });
    setIsDirty(false);
  };

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-full overflow-y-auto px-6 pb-6 pt-20">
      <div className="flex items-center gap-3 mb-6">
        <Cog6ToothIcon className="w-8 h-8 text-primary-500" />
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">設定</h1>
      </div>
      <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">基本情報</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                AIがメールを生成する際の基本的なコンテキストとして利用されます。
            </p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="eventName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">イベント名</label>
                    <input type="text" name="eventName" id="eventName" value={settings.eventName} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"/>
                </div>
                 <div>
                    <label htmlFor="officeName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">事務局名</label>
                    <input type="text" name="officeName" id="officeName" value={settings.officeName} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"/>
                </div>
                <div>
                    <label htmlFor="websiteUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300">公式サイトURL</label>
                    <input type="url" name="websiteUrl" id="websiteUrl" value={settings.websiteUrl} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"/>
                </div>
                <div>
                    <label htmlFor="eventSummary" className="block text-sm font-medium text-slate-700 dark:text-slate-300">イベント概要</label>
                    <textarea name="eventSummary" id="eventSummary" value={settings.eventSummary} onChange={handleChange} rows={4} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"/>
                    <p className="text-xs text-slate-500 mt-1">イベントの目的、主な内容、ターゲット層などを簡潔に記述してください。</p>
                </div>
                <div>
                    <label htmlFor="signature" className="block text-sm font-medium text-slate-700 dark:text-slate-300">共通署名</label>
                    <textarea name="signature" id="signature" value={settings.signature} onChange={handleChange} rows={5} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"/>
                    <p className="text-xs text-slate-500 mt-1">`[あなたの名前]`の部分は、実際の送信者の名前に置き換わります。</p>
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">AIの振る舞い</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                AIのコミュニケーションスタイルや知識を調整して、より一貫性のある回答を生成します。
            </p>
            <div className="space-y-6">
                <div>
                    <label htmlFor="communicationStyle" className="block text-sm font-medium text-slate-700 dark:text-slate-300">コミュニケーションスタイル</label>
                    <select name="communicationStyle" id="communicationStyle" value={settings.communicationStyle} onChange={handleChange} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                        <option value="非常に丁寧">非常に丁寧</option>
                        <option value="丁寧">丁寧</option>
                        <option value="ややカジュアル">ややカジュアル</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                        <KeyIcon className="w-5 h-5"/>
                        ナレッジベース
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                        よくある質問とその回答などをキーとバリューの形式で登録します。AIはここで登録された情報を最優先で参照します。
                    </p>
                    <div className="space-y-3">
                        {settings.knowledgeBase.map((item, index) => (
                            <div key={item.id} className="flex items-center gap-2 animate-fade-in-up">
                                <input 
                                    type="text"
                                    placeholder="キー (例: 会場)"
                                    value={item.key}
                                    onChange={(e) => handleKnowledgeChange(item.id, 'key', e.target.value)}
                                    className="w-1/3 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                                <input 
                                    type="text"
                                    placeholder="バリュー (例: 東京ビッグサイト)"
                                    value={item.value}
                                    onChange={(e) => handleKnowledgeChange(item.id, 'value', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                />
                                <button type="button" onClick={() => removeKnowledgeItem(item.id)} className="p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={addKnowledgeItem} className="mt-4 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-primary-600 rounded-md hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/50">
                        <PlusCircleIcon className="w-5 h-5"/>
                        項目を追加
                    </button>
                </div>
            </div>
        </div>

        <div className="flex justify-end pb-8">
            <button type="submit" disabled={!isDirty} className="px-8 py-2.5 font-semibold text-white bg-primary-600 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none transition-all">
                変更を保存
            </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsView;