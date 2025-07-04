

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Email, Template, Sender, Attachment, Contact, Draft, EmailStatus } from '../types';
import SparklesIcon from './icons/SparklesIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import DocumentDuplicateIcon from './icons/DocumentDuplicateIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XMarkIcon from './icons/XMarkIcon';
import TrashIcon from './icons/TrashIcon';
import FolderArrowDownIcon from './icons/FolderArrowDownIcon';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import CustomSelect from './CustomSelect';
import EditorToolbar from './EditorToolbar';
import { parseRecipients, processTemplateBody, placeholderRegex } from '../utils/helpers';
import ClipboardDocumentCheckIcon from './icons/ClipboardDocumentCheckIcon';
import { generateReplyDraft } from '../services/geminiService';
import WorkflowStepper from './WorkflowStepper';

interface ReplyComposerProps {
  email: Email;
  onCancel: () => void;
  onSent: () => void;
}

type ReplyMode = 'ai' | 'template';

const ReplyComposer: React.FC<ReplyComposerProps> = ({ email, onCancel, onSent }) => {
  const { templates, currentUser, appSettings, contacts } = useAppState();
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

  useEffect(() => {
    // This effect handles all initialization and reset logic when the email prop changes.
    setAiPrompt('');
    setAttachments([]);
    setSelectedTemplateId('');
    setPlaceholders([]);
    setIsLoading(false);

    if (email.draft) {
      // Restore from draft
      const { draft } = email;
      setSubject(draft.subject);
      setCc(draft.cc?.map(c => c.email).join(', ') || '');
      setBcc(draft.bcc?.map(c => c.email).join(', ') || '');
      setReplyText(draft.body);
      if (editorRef.current) editorRef.current.innerHTML = draft.body;
      setShowCcBcc(!!(draft.cc?.length || draft.bcc?.length));
    } else {
      // Create a new reply
      setSubject(email.subject.startsWith('Re: ') ? email.subject : `Re: ${email.subject}`);
      const initialCc = email.cc?.map(c => c.email).join(', ') || '';
      setCc(initialCc);
      setBcc('');
      setShowCcBcc(!!initialCc);

      // Generate and set quoted text
      const senderInfo = `${email.sender.name} &lt;${email.sender.email}&gt;`;
      const timestamp = new Date(email.timestamp).toLocaleString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' });
      const header = `On ${timestamp}, ${senderInfo} wrote:`;
      const quotedBody = `<p><br></p><blockquote class="border-l-2 border-slate-300 pl-3 text-slate-500 dark:border-slate-600 dark:text-slate-400 mt-4">${header}<br>${email.body}</blockquote>`;
      
      setReplyText(quotedBody);
      if (editorRef.current) {
        editorRef.current.innerHTML = quotedBody;
        // Move cursor to the beginning
        editorRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.setStart(editorRef.current, 0);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
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
        return newPlaceholders.filter(p => uniquePlaceholders.includes(p.text));
    });
  }, [replyText]);

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setReplyText(editorRef.current.innerHTML);
      editorRef.current.focus();
    }
  };

  const handleLink = () => {
    const url = window.prompt("リンク先のURLを入力してください:", "https://");
    if (url) execCmd('createLink', url);
  };

  const handleImage = () => {
    const url = window.prompt("画像URLを入力してください:");
    if (url) execCmd('insertImage', url);
  };

  const handleGenerateAiDraft = async () => {
    setIsLoading(true);
    const simAttachments = attachments.map(f => ({ name: f.name, url: '' }));
    const generated = await generateReplyDraft(email.body, aiPrompt, email.sender.name, simAttachments, appSettings);
    const htmlReply = generated?.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('') || 'ドラフトの生成に失敗しました。';
    
    if(editorRef.current){
        const currentContent = editorRef.current.innerHTML;
        const newContent = `${htmlReply}<br>${currentContent}`;
        setReplyText(newContent);
        editorRef.current.innerHTML = newContent;
        editorRef.current.focus();
        window.getSelection()?.collapse(editorRef.current, 0);
    }
    
    setIsLoading(false);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
        const processedBody = processTemplateBody(template.body, appSettings, email.sender);
        setReplyText(processedBody);
        if (editorRef.current) {
            editorRef.current.innerHTML = processedBody;
        }
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setAttachments(prev => [...prev, ...Array.from(event.target.files as FileList)]);
  };

  const handleRemoveAttachment = (fileName: string) => {
    setAttachments(prev => prev.filter(file => file.name !== fileName));
  };


  const handleSend = () => {
    if (!replyText || !subject || isLoading) return;

    dispatch({
        type: 'SEND_EMAIL',
        payload: {
            draft: {
                recipients: [email.sender],
                cc: parseRecipients(cc, contacts),
                bcc: parseRecipients(bcc, contacts),
                subject: subject,
                body: editorRef.current?.innerHTML || replyText,
                inReplyTo: email.id,
                threadId: email.threadId,
                attachments: attachments.map(file => ({ name: file.name, url: '#' }))
            },
            user: currentUser
        }
    });
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'メールを送信しました', type: 'success' } });
    onSent();
  };
  
    const handleSaveDraft = () => {
        if (!editorRef.current?.innerHTML && !subject) return;

        const draftData: Draft = {
            recipients: [email.sender],
            cc: parseRecipients(cc, contacts),
            bcc: parseRecipients(bcc, contacts),
            subject: subject,
            body: editorRef.current?.innerHTML || replyText,
            attachments: attachments.map(f => ({ name: f.name, url: '#' })),
        };
        
        dispatch({ type: 'SAVE_DRAFT', payload: { emailId: email.id, draft: draftData } });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: '下書きを保存しました', type: 'success' } });
        onCancel();
    };

    const handleDeleteDraft = () => {
        if (window.confirm('この下書きを破棄しますか？')) {
            dispatch({ type: 'DELETE_DRAFT', payload: { emailId: email.id } });
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: '下書きを破棄しました', type: 'info' } });
            onCancel();
        }
    };

  const handlePlaceholderCheck = (text: string) => {
    setPlaceholders(current => current.map(p => (p.text === text ? { ...p, checked: !p.checked } : p)));
  };
  
  const templateOptions = templates.map(t => ({ value: t.id, label: t.title }));
  const allPlaceholdersChecked = placeholders.every(p => p.checked);

  const canSend = email.status === EmailStatus.Approved;

  return (
    <div className="w-full md:w-2/3 bg-white dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 h-full flex flex-col p-4">
        
        <WorkflowStepper email={email} />
        
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">
            返信を作成中...
        </h2>
        <div className="flex-grow flex flex-col min-h-0">
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
            
            <div className="mt-4 flex-grow flex flex-col min-h-0">
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 shadow-sm flex-grow flex flex-col">
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
                            <>
                                <div className="flex items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-1">
                                    <label htmlFor="cc-field" className="text-slate-500 dark:text-slate-400 pl-1 w-12">Cc:</label>
                                    <input type="text" id="cc-field" value={cc} onChange={e => setCc(e.target.value)} className="w-full bg-transparent focus:outline-none p-1 text-slate-800 dark:text-slate-200" />
                                </div>
                                <div className="flex items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-1">
                                    <label htmlFor="bcc-field" className="text-slate-500 dark:text-slate-400 pl-1 w-12">Bcc:</label>
                                    <input type="text" id="bcc-field" value={bcc} onChange={e => setBcc(e.target.value)} className="w-full bg-transparent focus:outline-none p-1 text-slate-800 dark:text-slate-200" />
                                </div>
                            </>
                        )}
                        <div className="flex items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-1">
                            <label htmlFor="subject-field" className="text-slate-500 dark:text-slate-400 pl-1 w-12">件名:</label>
                            <input type="text" id="subject-field" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-transparent focus:outline-none p-1 font-medium text-slate-800 dark:text-slate-200" />
                        </div>
                    </div>
                    
                    <EditorToolbar execCmd={execCmd} handleLink={handleLink} handleImage={handleImage}/>
                    
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        onInput={(e) => setReplyText(e.currentTarget.innerHTML)}
                        className="w-full flex-grow p-3 focus:outline-none text-sm prose prose-slate dark:prose-invert max-w-none overflow-y-auto"
                        spellCheck="false"
                    />

                    {attachments.length > 0 && (
                        <div className="p-2 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
                            <div className="flex flex-wrap gap-2">
                            {attachments.map((file, index) => (
                                <div key={index} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full pl-3 pr-1 py-1 text-sm">
                                <span className="font-medium text-slate-700 dark:text-slate-200">{file.name}</span>
                                <button onClick={() => handleRemoveAttachment(file.name)} className="p-1 rounded-full text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-600">
                                    <XMarkIcon className="w-4 h-4"/>
                                </button>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex-shrink-0 mt-4">
              {placeholders.length > 0 && (
                  <div className="mt-4 p-3 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/50 rounded-lg">
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-200">
                          <ClipboardDocumentCheckIcon className="w-5 h-5"/>
                          プレースホルダーの確認
                      </h4>
                      <div className="space-y-2 mt-2">
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
              
              <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <label htmlFor="file-upload-reply" className="cursor-pointer p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <PaperclipIcon className="w-6 h-6"/>
                        <input id="file-upload-reply" name="file-upload-reply" type="file" className="sr-only" multiple onChange={handleFileChange} />
                    </label>
                     {email.draft && (
                        <button
                            onClick={handleDeleteDraft}
                            className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"
                            title="下書きを破棄"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                        onClick={handleSaveDraft}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                        <FolderArrowDownIcon className="w-4 h-4"/>
                        下書き保存
                    </button>
                     <button
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600"
                    >
                       キャンセル
                    </button>
                    <button 
                        onClick={handleSend}
                        disabled={!canSend || isLoading || !editorRef.current?.innerText.trim() || !subject.trim() || (placeholders.length > 0 && !allPlaceholdersChecked)}
                        title={!canSend ? 'このメールは承認されていません' : (placeholders.length > 0 && !allPlaceholdersChecked ? 'すべてのプレースホルダーを確認してください' : '')}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        <PaperAirplaneIcon className="w-4 h-4"/>
                        送信
                    </button>
                  </div>
              </div>
            </div>
        </div>
    </div>
  );
};

export default ReplyComposer;