

import React from 'react';
import { Email, SentEmail } from '../types';
import InboxIcon from './icons/InboxIcon';
import Tag from './Tag';
import PaperclipIcon from './icons/PaperclipIcon';
import ClipboardDocumentIcon from './icons/ClipboardDocumentIcon';
import { useAppDispatch } from '../contexts/AppContext';

interface EmailDetailProps {
  item: Email | SentEmail | null;
}

const EmailDetail: React.FC<EmailDetailProps> = ({ item }) => {
  const dispatch = useAppDispatch();

  if (!item) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50">
        <InboxIcon className="w-20 h-20 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-4 text-xl font-medium text-slate-800 dark:text-slate-200">メールを選択して表示</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">まだ何も表示されていません。左のリストから項目を選択してください。</p>
      </div>
    );
  }

  const formattedTimestamp = new Date(item.timestamp).toLocaleString('ja-JP', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  
  const formattedUpdateTimestamp = item.updatedAt ? new Date(item.updatedAt).toLocaleString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '';


  const isInboxItem = 'sender' in item;
  const sentItem = !isInboxItem ? (item as SentEmail) : null;
  const mainParty = isInboxItem ? (item as Email).sender : (item as SentEmail).recipients[0];
  const allRecipients = isInboxItem ? [] : (item as SentEmail).recipients;

  const handleCopyId = () => {
    if (isInboxItem) {
        const idToCopy = (item as Email).displayId;
        navigator.clipboard.writeText(idToCopy).then(() => {
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `ID "${idToCopy}" をコピーしました`, type: 'success' }});
        }).catch(err => {
            console.error("IDのコピーに失敗しました: ", err);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'IDのコピーに失敗しました', type: 'error' }});
        });
    }
  };


  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 h-full overflow-y-auto p-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{item.subject}</h1>
            {isInboxItem && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-full px-3 py-1">
                    <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">{(item as Email).displayId}</span>
                    <button onClick={handleCopyId} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700" title="IDをコピー">
                        <ClipboardDocumentIcon className="w-4 h-4"/>
                    </button>
                </div>
            )}
        </div>
        {isInboxItem ? (
          <div className="mt-2">
            <Tag type="status" text={(item as Email).status} />
          </div>
        ) : (
          sentItem?.sentBy && (
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              送信者: <span className="font-semibold text-slate-600 dark:text-slate-300">{sentItem.sentBy}</span>
            </p>
          )
        )}
      </div>
      
      <div className="flex items-center gap-4 mt-4">
        <div className="w-10 h-10 bg-primary-200 dark:bg-primary-800 rounded-full flex items-center justify-center font-bold text-primary-600 dark:text-primary-200 flex-shrink-0">
          {mainParty.name.charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{mainParty.name}{allRecipients.length > 1 && ` 他${allRecipients.length - 1}名`}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isInboxItem ? '差出人' : '宛先'}: <a href={`mailto:${mainParty.email}`} className="hover:underline">{mainParty.email}</a>
          </p>
          {item.cc && item.cc.length > 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cc: {item.cc.map(c => c.name).join(', ')}
            </p>
          )}
          {!isInboxItem && 'bcc' in item && item.bcc && item.bcc.length > 0 && (
             <p className="text-sm text-slate-500 dark:text-slate-400">
               Bcc: {item.bcc.map(c => c.name).join(', ')}
             </p>
          )}
        </div>
        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
          <div>{formattedTimestamp}</div>
          {item.lastModifiedBy && (
            <div className="text-xs mt-1">最終更新: {formattedUpdateTimestamp} ({item.lastModifiedBy})</div>
          )}
        </div>
      </div>

      <div
        className="mt-8 prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300"
        dangerouslySetInnerHTML={{ __html: item.body.replace(/\n/g, '<br />') }}
      />

      {item.attachments && item.attachments.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">添付ファイル ({item.attachments.length})</h3>
            <div className="flex flex-wrap gap-3">
                {item.attachments.map((att, index) => (
                    <a 
                        key={index}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <PaperclipIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-200">{att.name}</span>
                    </a>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default EmailDetail;