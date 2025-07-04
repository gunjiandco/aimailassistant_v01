

import React, { useState, useEffect, useMemo } from 'react';
import { Template, Sender, Contact } from '../types';
import XMarkIcon from './icons/XMarkIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import CustomSelect, { CustomSelectOption } from './CustomSelect';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import { placeholderRegex, parseRecipients } from '../utils/helpers';

// --- Types and Interfaces ---
type Step = 1 | 2 | 3;
type CsvData = {
    headers: string[];
    rows: Array<{ [key: string]: string }>;
};
type ColumnMapping = { [placeholder: string]: string };

interface BulkSendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

// --- Step Components ---
const Step1_SelectTemplate: React.FC<{
    templates: Template[];
    selectedTemplateId: string;
    onSelect: (id: string) => void;
    placeholders: string[];
}> = ({ templates, selectedTemplateId, onSelect, placeholders }) => (
    <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">ステップ1: 送信テンプレートを選択</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">パーソナライズ一括送信に使用するテンプレートを選んでください。</p>
        <CustomSelect 
            options={templates.map(t => ({ value: t.id, label: t.title }))}
            value={selectedTemplateId}
            onChange={onSelect}
            placeholder="テンプレートを選択..."
        />
        {selectedTemplateId && (
            <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">認識されたプレースホルダー:</h4>
                {placeholders.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {placeholders.map(p => <code key={p} className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded px-2 py-1 font-mono">{`{{${p}}}`}</code>)}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 mt-1">このテンプレートにはプレースホルダーが見つかりませんでした。</p>
                )}
            </div>
        )}
    </div>
);

const Step2_MapData: React.FC<{
    onFileParse: (file: File) => void;
    csvData: CsvData | null;
    placeholders: string[];
    columnMapping: ColumnMapping;
    setColumnMapping: React.Dispatch<React.SetStateAction<ColumnMapping>>;
}> = ({ onFileParse, csvData, placeholders, columnMapping, setColumnMapping }) => (
     <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">ステップ2: データをアップロードして紐付け</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">プレースホルダーに挿入するデータを含むCSVファイルをアップロードしてください。CSVには必ず`email`列を含めてください。</p>
        <input
            type="file"
            accept=".csv"
            onChange={e => e.target.files && onFileParse(e.target.files[0])}
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-200 dark:hover:file:bg-primary-900"
        />
        {csvData && (
            <div className="mt-6">
                <h4 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">列の紐付け</h4>
                <div className="space-y-3 p-4 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                    <div className="grid grid-cols-2 gap-4 items-center">
                        <label className="font-medium text-slate-600 dark:text-slate-400">宛先メールアドレス</label>
                        <CustomSelect options={csvData.headers.map(h => ({value: h, label: h}))} value={columnMapping['email'] || ''} onChange={val => setColumnMapping(m => ({...m, 'email': val}))} />
                    </div>
                    {placeholders.map(p => (
                        <div key={p} className="grid grid-cols-2 gap-4 items-center border-t border-slate-200 dark:border-slate-700 pt-3">
                            <label htmlFor={`map-${p}`} className="font-mono text-slate-600 dark:text-slate-400">{`{{${p}}}`}</label>
                            <CustomSelect id={`map-${p}`} options={csvData.headers.map(h => ({value: h, label: h}))} value={columnMapping[p] || ''} onChange={val => setColumnMapping(m => ({...m, [p]: val}))} placeholder="CSV列を選択..." />
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
);

const Step3_PreviewAndSend: React.FC<{
    generatedEmails: Array<{recipients: Sender[], subject: string, body: string}>;
}> = ({ generatedEmails }) => {
    const [previewIndex, setPreviewIndex] = useState(0);

    const emailPreview = generatedEmails[previewIndex];

    if (!emailPreview) {
        return <p>プレビューを生成できません。データを確認してください。</p>;
    }

    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-2">ステップ3: 内容を確認して送信</h3>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">{generatedEmails.length}件のメールが生成されました。</p>
                <div className="flex items-center gap-2">
                    <button onClick={() => setPreviewIndex(i => Math.max(0, i-1))} disabled={previewIndex === 0} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <span className="text-sm font-medium">{previewIndex + 1} / {generatedEmails.length}</span>
                    <button onClick={() => setPreviewIndex(i => Math.min(generatedEmails.length - 1, i+1))} disabled={previewIndex === generatedEmails.length - 1} className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
            </div>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 p-4 max-h-96 overflow-y-auto">
                <p className="text-sm"><strong className="text-slate-500">宛先:</strong> {emailPreview.recipients[0].email}</p>
                <p className="text-sm mt-1"><strong className="text-slate-500">件名:</strong> {emailPreview.subject}</p>
                <hr className="my-3 border-slate-200 dark:border-slate-700"/>
                <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: emailPreview.body }} />
            </div>
        </div>
    );
}


// --- Main Modal Component ---
const BulkSendModal: React.FC<BulkSendModalProps> = ({ isOpen, onClose }) => {
    const { templates, currentUser, contacts } = useAppState();
    const dispatch = useAppDispatch();
    
    const [step, setStep] = useState<Step>(1);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [csvData, setCsvData] = useState<CsvData | null>(null);
    const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
    const [error, setError] = useState<string>('');
    const [isSending, setIsSending] = useState(false);

    const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId), [templates, selectedTemplateId]);
    const templatePlaceholders = useMemo(() => {
        if (!selectedTemplate) return [];
        const bodyMatches = selectedTemplate.body.match(placeholderRegex) || [];
        const subjectMatches = selectedTemplate.title.match(placeholderRegex) || [];
        const allMatches = [...bodyMatches, ...subjectMatches];
        const uniquePlaceholders = [...new Set(allMatches.map(p => p.slice(2, -2).trim()))];
        // Ensure 'name' is treated as a placeholder if it's in the CSV mapping context, even if not in the template.
        // And remove 'email' as it's a special case, not a user-mappable placeholder.
        return uniquePlaceholders.filter(p => p !== 'email');
    }, [selectedTemplate]);


    useEffect(() => {
        if (!isOpen) {
            setStep(1);
            setSelectedTemplateId('');
            setCsvData(null);
            setColumnMapping({});
            setError('');
            setIsSending(false);
        }
    }, [isOpen]);

    const handleFileParse = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) throw new Error("CSVファイルにはヘッダーと少なくとも1つのデータ行が必要です。");
                
                const headers = lines[0].split(',').map(h => h.trim());
                if (!headers.includes('email')) {
                    throw new Error("CSVには 'email' 列が必須です。");
                }

                const rows = lines.slice(1).map(line => {
                    const values = line.split(',');
                    const rowData: { [key: string]: string } = {};
                    headers.forEach((header, index) => {
                        rowData[header] = values[index]?.trim() || '';
                    });
                    return rowData;
                });

                setCsvData({ headers, rows });
                setError('');
                // Auto-map if placeholder name matches header
                const newMapping: ColumnMapping = { 'email': 'email' };
                templatePlaceholders.forEach(p => {
                    if (headers.includes(p)) {
                        newMapping[p] = p;
                    }
                });
                setColumnMapping(newMapping);

            } catch (e: any) {
                setError(e.message || "CSVファイルの解析中にエラーが発生しました。");
            }
        };
        reader.readAsText(file, 'UTF-8');
    };

    const isStep2Valid = useMemo(() => {
        if (!csvData) return false;
        const allPlaceholdersMapped = templatePlaceholders.every(p => columnMapping[p]);
        const emailMapped = !!columnMapping['email'];
        return allPlaceholdersMapped && emailMapped;
    }, [csvData, templatePlaceholders, columnMapping]);
    
    const generatedEmails = useMemo(() => {
        if (step !== 3 || !csvData || !selectedTemplate || !isStep2Valid) return [];
        
        return csvData.rows.map(row => {
            let body = selectedTemplate.body;
            let subject = selectedTemplate.title; 
            
            const allPlaceholders = ['email', ...templatePlaceholders];

            allPlaceholders.forEach(p => {
                const header = columnMapping[p];
                const value = header ? row[header] : '';
                const regex = new RegExp(`{{\\s*${p}\\s*}}`, 'g');
                body = body.replace(regex, value);
                subject = subject.replace(regex, value);
            });
            
            const recipientEmail = row[columnMapping['email']];
            return {
                recipients: parseRecipients(recipientEmail, contacts),
                subject,
                body
            };
        });
    }, [step, csvData, selectedTemplate, columnMapping, templatePlaceholders, contacts, isStep2Valid]);


    const handleSend = () => {
        if (generatedEmails.length === 0) return;
        setIsSending(true);
        dispatch({
            type: 'SEND_PERSONALIZED_BULK_EMAIL',
            payload: {
                emails: generatedEmails,
                user: currentUser
            }
        });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${generatedEmails.length}件のメール送信を開始しました。`, type: 'success' } });
    };

    if (!isOpen) return null;

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return <Step1_SelectTemplate templates={templates} selectedTemplateId={selectedTemplateId} onSelect={setSelectedTemplateId} placeholders={templatePlaceholders}/>;
            case 2:
                return <Step2_MapData onFileParse={handleFileParse} csvData={csvData} placeholders={templatePlaceholders} columnMapping={columnMapping} setColumnMapping={setColumnMapping} />;
            case 3:
                return <Step3_PreviewAndSend generatedEmails={generatedEmails} />;
            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4 transition-opacity" onClick={onClose}>
            <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transition-transform" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">パーソナライズ一括送信</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow p-6 overflow-y-auto">
                    {error && <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>}
                    {renderStepContent()}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        {step > 1 && <button onClick={() => setStep(s => s - 1 as Step)} className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600">戻る</button>}
                    </div>
                    <div>
                        {step < 3 && <button onClick={() => { setStep(s => s + 1 as Step); if(step === 2) setError('') }} disabled={(step === 1 && !selectedTemplateId) || (step === 2 && !isStep2Valid)} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400">次へ <ChevronRightIcon className="w-4 h-4"/></button>}
                        {step === 3 && <button onClick={handleSend} disabled={isSending || generatedEmails.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400"> <PaperAirplaneIcon className="w-4 h-4"/> {isSending ? '送信中...' : `${generatedEmails.length}件に送信`}</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkSendModal;