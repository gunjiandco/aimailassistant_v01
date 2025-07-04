

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import { Sender, Attachment, Contact, MailingList } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XMarkIcon from './icons/XMarkIcon';
import UsersIcon from './icons/UsersIcon';
import EditorToolbar from './EditorToolbar';
import { parseRecipients, generateId } from '../utils/helpers';


interface NewEmailViewProps {
  onBack?: () => void;
  contacts: Contact[];
}

const NewEmailView: React.FC<NewEmailViewProps> = ({ onBack, contacts }) => {
    const { currentUser } = useAppState();
    const dispatch = useAppDispatch();
    const editorRef = useRef<HTMLDivElement>(null);
    const contactDropdownRef = useRef<HTMLDivElement>(null);

    const [to, setTo] = useState('');
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [isContactDropdownOpen, setContactDropdownOpen] = useState(false);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target as Node)) {
                setContactDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            setBody(editorRef.current.innerHTML);
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

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setAttachments(prev => [...prev, ...Array.from(event.target.files as FileList)]);
        }
    };

    const handleRemoveAttachment = (fileName: string) => {
        setAttachments(prev => prev.filter(file => file.name !== fileName));
    };
    
    const addRecipient = (contact: Contact) => {
      setTo(prev => prev ? `${prev}, ${contact.email}` : contact.email);
      setContactDropdownOpen(false);
    };

    const handleSend = () => {
        if (!to || !subject || !body || isLoading) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: '宛先、件名、本文は必須です。', type: 'error' } });
            return;
        }
        setIsLoading(true);

        dispatch({
            type: 'SEND_EMAIL',
            payload: {
                draft: {
                    recipients: parseRecipients(to, contacts),
                    cc: parseRecipients(cc, contacts),
                    bcc: parseRecipients(bcc, contacts),
                    subject: subject,
                    body: body,
                    threadId: generateId('thread'),
                    attachments: attachments.map(file => ({ name: file.name, url: '#' }))
                },
                user: currentUser
            }
        });
        
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'メールを送信しました', type: 'success' } });

        // Reset state after sending
        setTo(''); setCc(''); setBcc(''); setSubject(''); setBody('');
        setAttachments([]); setShowCcBcc(false);
        if (editorRef.current) editorRef.current.innerHTML = '';
        setIsLoading(false);
        
        // Go back to the list on mobile
        if(onBack) onBack();
    };
    
    const combinedContacts = useMemo(() => {
        const allContacts = new Map<string, Contact>();
        contacts.forEach(c => allContacts.set(c.id, c));
        return Array.from(allContacts.values()).sort((a,b) => a.name.localeCompare(b.name));
    }, [contacts]);

    return (
        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 h-full overflow-y-auto p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                {onBack && (
                    <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full">
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                )}
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">新規メール作成</h1>
            </div>

            <div className="flex-grow flex flex-col gap-2">
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 shadow-sm flex flex-col">
                    <div className="p-2 space-y-1 border-b border-slate-200 dark:border-slate-700">
                        {/* To Field */}
                        <div className="flex items-center text-sm">
                            <label htmlFor="to-field" className="text-slate-500 dark:text-slate-400 pl-1 w-12">宛先:</label>
                            <div className="relative flex-grow">
                               <input type="text" id="to-field" value={to} onChange={e => setTo(e.target.value)} className="w-full bg-transparent focus:outline-none p-1 text-slate-800 dark:text-slate-200" placeholder="メールアドレスをカンマ区切りで入力" />
                            </div>
                            <div className="relative" ref={contactDropdownRef}>
                                <button onClick={() => setContactDropdownOpen(s => !s)} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                                    <UsersIcon className="w-5 h-5"/>
                                </button>
                                {isContactDropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
                                        <ul className="max-h-60 overflow-auto p-1">
                                            {combinedContacts.map(contact => (
                                                <li key={contact.id} onClick={() => addRecipient(contact)} className="p-2 text-sm rounded-md cursor-pointer text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">
                                                    <div className="font-semibold">{contact.name}</div>
                                                    <div className="text-xs text-slate-500">{contact.email}</div>
                                                </li>
                                            ))}
                                            {combinedContacts.length === 0 && <li className="p-2 text-sm text-center text-slate-500">連絡先がありません</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowCcBcc(s => !s)} className="font-medium text-primary-600 dark:text-primary-400 hover:underline pr-1 text-xs">Cc/Bcc</button>
                        </div>
                        {/* CC/BCC Fields */}
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
                        {/* Subject Field */}
                        <div className="flex items-center text-sm border-t border-slate-200 dark:border-slate-700 pt-1">
                            <label htmlFor="subject-field" className="text-slate-500 dark:text-slate-400 pl-1 w-12">件名:</label>
                            <input type="text" id="subject-field" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-transparent focus:outline-none p-1 font-medium text-slate-800 dark:text-slate-200" />
                        </div>
                    </div>
                    
                    <EditorToolbar execCmd={execCmd} handleLink={handleLink} handleImage={handleImage} />
                    
                    {/* Editor */}
                    <div
                        ref={editorRef}
                        contentEditable={true}
                        onInput={(e) => setBody(e.currentTarget.innerHTML)}
                        className="w-full flex-grow p-3 min-h-[250px] focus:outline-none text-sm prose prose-slate dark:prose-invert max-w-none"
                        spellCheck="false"
                    />
                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="p-2 border-t border-slate-200 dark:border-slate-700">
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
            {/* Footer */}
            <div className="flex-shrink-0 pt-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSend}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-slate-400"
                    >
                        <PaperAirplaneIcon className="w-4 h-4" />
                        {isLoading ? '送信中...' : '送信'}
                    </button>
                    <label htmlFor="file-upload" className="cursor-pointer p-2 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700">
                        <PaperclipIcon className="w-6 h-6"/>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={handleFileChange} />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default NewEmailView;