
import React, { useState, useEffect } from 'react';
import { MailingList, Contact } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';

interface ImportContactsModalProps {
    isOpen: boolean;
    onClose: () => void;
    mailingLists: MailingList[];
    onImport: (listId: string, contacts: Omit<Contact, 'id'>[]) => void;
}

const ImportContactsModal: React.FC<ImportContactsModalProps> = ({ isOpen, onClose, mailingLists, onImport }) => {
    const [selectedListId, setSelectedListId] = useState<string>('');
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedListId(mailingLists[0]?.id || '');
            setCsvFile(null);
            setError(null);
            setIsImporting(false);
        }
    }, [isOpen, mailingLists]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCsvFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleImport = () => {
        if (!csvFile || !selectedListId) {
            setError("インポート先のリストとCSVファイルを選択してください。");
            return;
        }

        setIsImporting(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("CSVファイルにはヘッダーと少なくとも1つのデータ行が必要です。");

                const header = lines[0].split(',').map(h => h.trim().toLowerCase());
                const nameIndex = header.indexOf('name');
                const emailIndex = header.indexOf('email');
                const affiliationIndex = header.indexOf('affiliation');
                const requiredCcIndex = header.indexOf('requiredcc');

                if (nameIndex === -1 || emailIndex === -1) {
                    throw new Error("CSVには 'name' と 'email' の列が必須です。");
                }
                
                const newContacts: Omit<Contact, 'id'>[] = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    const name = values[nameIndex]?.trim();
                    const email = values[emailIndex]?.trim();

                    if(name && email) {
                        const affiliation = affiliationIndex > -1 ? values[affiliationIndex]?.trim() : undefined;
                        const requiredCcRaw = requiredCcIndex > -1 ? values[requiredCcIndex]?.trim() : '';
                        const requiredCc = requiredCcRaw ? requiredCcRaw.split(';').map(e => e.trim()).filter(Boolean) : [];

                        newContacts.push({
                            name,
                            email,
                            affiliation,
                            requiredCc: requiredCc.length > 0 ? requiredCc : undefined,
                        });
                    }
                }
                onImport(selectedListId, newContacts);
            } catch (e: any) {
                setError(e.message || "CSVファイルの解析中にエラーが発生しました。");
                setIsImporting(false);
            }
        };

        reader.onerror = () => {
            setError("ファイルの読み取りに失敗しました。");
            setIsImporting(false);
        };
        
        reader.readAsText(csvFile, 'UTF-8');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col transition-transform" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">連絡先をCSVからインポート</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-md">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200">CSVフォーマットガイド</h4>
                        <ul className="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                            <li>1行目はヘッダー行にしてください: <strong>name,email,affiliation,requiredcc</strong></li>
                            <li><strong>name</strong> と <strong>email</strong> は必須です。</li>
                            <li><strong>affiliation</strong> (所属) は任意です。</li>
                            <li><strong>requiredcc</strong> (必須CC) は任意です。複数のアドレスはセミコロン(;)で区切ってください。</li>
                            <li>文字コードはUTF-8で保存してください。</li>
                        </ul>
                    </div>

                    <div>
                        <label htmlFor="list-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">1. インポート先のリストを選択</label>
                        <select
                            id="list-select"
                            value={selectedListId}
                            onChange={(e) => setSelectedListId(e.target.value)}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                        >
                            {mailingLists.map(list => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="file-upload" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">2. CSVファイルを選択</label>
                        <input
                            id="file-upload"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-200 dark:hover:file:bg-primary-900"
                        />
                    </div>
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button 
                        onClick={handleImport}
                        disabled={!csvFile || !selectedListId || isImporting}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <ArrowUpTrayIcon className="w-4 h-4" />
                        {isImporting ? 'インポート中...' : 'インポートを実行'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportContactsModal;
