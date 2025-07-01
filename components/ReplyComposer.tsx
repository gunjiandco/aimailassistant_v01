
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateReplyDraft } from '../services/geminiService';
import { Email, Template, Sender, Attachment } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XMarkIcon from './icons/XMarkIcon';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import CustomSelect from './CustomSelect';

import BoldIcon from './icons/BoldIcon';
import ItalicIcon from './icons/ItalicIcon';
import UnderlineIcon from './icons/UnderlineIcon';
import ListBulletIcon from './icons/ListBulletIcon';
import ListOrderedIcon from './icons/ListOrderedIcon';
import LinkIcon from './icons/LinkIcon';
import FontColorIcon from './icons/FontColorIcon';
import ClipboardDocumentCheckIcon from './icons/ClipboardDocumentCheckIcon';

interface ReplyComposerProps {
  email: Email;
}

type ReplyMode = 'ai' | 'template';

const ReplyComposer: React.FC<ReplyComposerProps> = ({ email }) => {
  const { templates, currentUser, appSettings } = useAppState();
  const dispatch = useAppDispatch();
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [subject, setSubject] = useState('');
  const [mode, setMode] = useState<ReplyMode>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [placeholders, setPlaceholders] = useState<{ text: string; checked: boolean }[]>([]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const placeholderRegex = /({{\s*[^}]+?\s*}})|(\[\s*[^\]]+?\s*\])/g;

  useEffect(() => {
    // Reset composer when email changes, and pre-fill cc/subject
    setReplyText('');
    if (editorRef.current) {
        editorRef.current.innerHTML = '';
    }
    setAiPrompt('');
    setAttachments([]);
    setBcc('');
    setSelectedTemplateId('');
    setPlaceholders([]);
    setIsColorPickerOpen(false);
    const initialSubject = email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`;
    setSubject(initialSubject);
    if (email?.cc && email.cc.length > 0) {
      setCc(email.cc.map(c => c.email).join(', '));
      setShowCcBcc(true);
    } else {
      setCc('');
      setShowCcBcc(false);
    }
  }, [email]);

   useEffect(() => {
    const plainText = editorRef.current?.innerText || '';
    if (!plainText) {
        setPlaceholders([]);
        return;
    }

    const matches = plainText.match(placeholderRegex) || [];
    const uniquePlaceholders = [...new Set(matches)];

    setPlaceholders(currentPlaceholders => {
        const newPlaceholders = uniquePlaceholders.map(text => {
            const existing = currentPlaceholders.find(p => p.text === text);
            return existing || { text, checked: false };
        });
        // Filter out old placeholders that no longer exist
        return newPlaceholders.filter(p => uniquePlaceholders.includes(p.text));
    });
  }, [replyText]);

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
    if (editorRef.current) {
      setReplyText(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = window.prompt("リンク先のURLを入力してください:", "https://");
    if (url) {
      execCmd('createLink', url);
    }
  };

  const handleGenerateAiDraft = useCallback(async () => {
    setIsLoading(true);
    setReplyText('');
    const simAttachments = attachments.map(f => ({ name: f.name, url: '' }));
    const generated = await generateReplyDraft(email.body, aiPrompt, email.sender.name, simAttachments, appSettings);
    const htmlReply = generated?.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('') || 'ドラフトの生成に失敗しました。';
    setReplyText(htmlReply);
    if (editorRef.current) {
        editorRef.current.innerHTML = htmlReply;
    }
    setIsLoading(false);
  }, [aiPrompt, email.body, email.sender.name, attachments, appSettings]);

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
        const personalizedBody = template.body.replace(/{{name}}/g, `<strong>${email.sender.name}</strong>`);
        setReplyText(personalizedBody);
         if (editorRef.current) {
            editorRef.current.innerHTML = personalizedBody;
        }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
        setAttachments(prev => [...prev, ...Array.from(event.target.files as FileList)]);
    }
  };

  const handleRemoveAttachment = (fileName: string) => {
    setAttachments(prev => prev.filter(file => file.name !== fileName));
  };


  const handleSend = () => {
    if (!replyText || !subject || isLoading) return;
    
    const parseRecipients = (emails: string): Sender[] => {
        if (!emails.trim()) return [];
        return emails.split(',').map(e => e.trim()).filter(e => e).map(emailStr => ({ name: emailStr, email: emailStr }));
    };

    dispatch({
        type: 'SEND_EMAIL',
        payload: {
            draft: {
                recipients: [email.sender],
                cc: parseRecipients(cc),
                bcc: parseRecipients(bcc),
                subject: subject,
                body: replyText,
                inReplyTo: email.id,
                attachments: attachments.map(file => ({ name: file.name, url: '#' }))
            },
            user: currentUser
        }
    });
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'メールを送信しました', type: 'success' } });

    setReplyText('');
    setAiPrompt('');
    setAttachments([]);
    setCc('');
    setBcc('');
    setSubject('');
    setShowCcBcc(false);
    setSelectedTemplateId('');
    if (editorRef.current) {
        editorRef.current.innerHTML = '';
    }
  };
  
  const handlePlaceholderCheck = (text: string) => {
    setPlaceholders(current =>
      current.map(p => (p.text === text ? { ...p, checked: !p.checked } : p))
    );
  };
  
  const templateOptions = templates.map(t => ({ value: t.id, label: t.title }));
  const allPlaceholdersChecked = placeholders.every(p => p.checked);

  return (
    <div className="mt-4">
      <div className="border-b border-slate-200 dark:border-slate-700">
         <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button
                onClick={() => setMode('ai')}
                className={`${
                    mode === 'ai'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
                <SparklesIcon className="w-5 h-5"/>
                AIで作成
            </button>
            <button
                onClick={() => setMode('template')}
                className={`${
                    mode === 'template'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
                } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}
            >
                <DocumentDuplicateIcon className="w-5 h-5"/>
                テンプレート
            </button>
         </nav>
      </div>

      {mode === 'ai' && (
        <div className="pt-4">
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-slate-700 dark:text-slate-300">指示プロンプト</label>
            <div className="mt-1 flex gap-2">
                <input
                    type="text"
                    id="ai-prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="AIへの指示（任意）。例：丁寧にお断り"
                    className="flex-grow px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    disabled={isLoading}
                />
                <button onClick={handleGenerateAiDraft} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
                    {isLoading ? '生成中...' : '生成'}
                </button>
            </div>
        </div>
      )}

      {mode === 'template' && (
        <div className="pt-4">
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">テンプレートを選択</label>
             <div className="mt-1">
                <CustomSelect
                    value={selectedTemplateId}
                    onChange={handleSelectTemplate}
                    options={templateOptions}
                    placeholder="テンプレートを選択..."
                />
             </div>
        </div>
      )}
      
      {isLoading && (
         <div className="mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-900 animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2.5"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2.5"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      )}
      
      {!isLoading && (
        <div className="mt-4">
            <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                <div className="p-2 space-y-1 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                           <span className="text-slate-500 dark:text-slate-400 pl-1">宛先:</span>
                           <span className="font-medium text-slate-700 dark:text-slate-300">{email.sender.name}</span>
                        </div>
                        <button 
                            onClick={() => setShowCcBcc(s => !s)}
                            className="font-medium text-primary-600 dark:text-primary-400 hover:underline pr-1 text-xs"
                        >
                            Cc/Bcc
                        </button>
                    </div>

                    {showCcBcc && (
                        <div className="space-y-1 pt-1">
                            <div className="flex items-center border-t border-slate-200 dark:border-slate-700">
                               <span className="text-sm text-slate-500 dark:text-slate-400 pl-1 pr-2 w-12 flex-shrink-0">Cc:</span>
                               <input 
                                    type="text" 
                                    value={cc} 
                                    onChange={e => setCc(e.target.value)} 
                                    placeholder="メールアドレス (コンマ区切り)" 
                                    className="w-full text-sm bg-transparent focus:outline-none py-1"
                                />
                            </div>
                            <div className="flex items-center border-t border-slate-200 dark:border-slate-700">
                               <span className="text-sm text-slate-500 dark:text-slate-400 pl-1 pr-2 w-12 flex-shrink-0">Bcc:</span>
                               <input 
                                    type="text" 
                                    value={bcc} 
                                    onChange={e => setBcc(e.target.value)} 
                                    placeholder="メールアドレス (コンマ区切り)" 
                                    className="w-full text-sm bg-transparent focus:outline-none py-1"
                                />
                             </div>
                        </div>
                    )}
                </div>
                
                <div className="border-b border-slate-200 dark:border-slate-700">
                     <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="件名"
                        className="w-full px-3 py-2 text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-200"
                    />
                </div>
                
                <div className="border-b border-slate-200 dark:border-slate-700 p-2 flex items-center gap-1 bg-slate-50 dark:bg-slate-700/50">
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
                </div>
                
                <div
                    ref={editorRef}
                    contentEditable={true}
                    onInput={(e) => setReplyText(e.currentTarget.innerHTML)}
                    className="w-full min-h-[250px] p-3 text-sm bg-transparent rounded-b-lg focus:outline-none focus:ring-0 prose prose-slate dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: replyText }}
                />
            </div>
        </div>
      )}
      
      {placeholders.length > 0 && (
        <div className="mt-4 p-3 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/50 rounded-lg animate-fade-in-up">
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


     {attachments.length > 0 && (
        <div className="mt-2 space-y-2">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">添付ファイル:</h4>
            <div className="flex flex-wrap gap-2">
                {attachments.map(file => (
                    <div key={file.name} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full pl-3 pr-1 py-1 text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
                        <button onClick={() => handleRemoveAttachment(file.name)} className="p-0.5 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-600">
                            <XMarkIcon className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}
      
      <div className="mt-4 flex justify-between items-center">
        <div>
          <label htmlFor="file-upload-reply" className="cursor-pointer p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700 inline-block">
            <PaperclipIcon className="w-5 h-5" />
            <input id="file-upload-reply" name="file-upload-reply" type="file" className="sr-only" multiple onChange={handleFileChange} />
          </label>
        </div>
        <button 
            onClick={handleSend}
            disabled={!replyText || isLoading || (placeholders.length > 0 && !allPlaceholdersChecked)}
            title={placeholders.length > 0 && !allPlaceholdersChecked ? 'すべてのプレースホルダーを確認してください' : ''}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="w-4 h-4" />
          送信
        </button>
      </div>
    </div>
  );
};

export default ReplyComposer;