

import React from 'react';
import { Email, EmailStatus, SentEmail } from '../types';
import Tag from './Tag';

interface EmailListItemProps {
  item: Email | SentEmail;
  isSelected: boolean;
  onSelect: (id: string) => void;
  selectedForBulk: boolean;
  onBulkSelect: (id: string) => void;
}


const EmailListItem: React.FC<EmailListItemProps> = ({ item, isSelected, onSelect, selectedForBulk, onBulkSelect }) => {
  const date = new Date(item.timestamp);
  const formattedDate = date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });

  const isInboxItem = 'sender' in item;
  const sentItem = !isInboxItem ? (item as SentEmail) : null;
  
  // HTMLタグをプレーンテキストに変換してプレビューをクリーンにします
  const plainTextBody = item.body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

  return (
    <li
      className={`p-4 border-b border-slate-200 dark:border-slate-700 cursor-pointer transition-colors duration-200 ${
        isSelected
          ? 'bg-primary-100 dark:bg-primary-900/50'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800'
      }`}
    >
        <div className="flex items-start gap-3">
            {isInboxItem && (
                 <input 
                    type="checkbox"
                    checked={selectedForBulk}
                    onChange={(e) => {
                        e.stopPropagation();
                        onBulkSelect(item.id);
                    }}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
            )}
            {!isInboxItem && <div className="w-7"></div>}

            <div className="flex-1" onClick={() => onSelect(item.id)}>
                <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {isInboxItem ? (item as Email).sender.name : `宛先: ${item.recipients.map(r => r.name).join(', ')}`}
                      {isInboxItem && <span className="ml-2 font-mono font-normal text-xs text-slate-500 dark:text-slate-400">{(item as Email).displayId}</span>}
                    </p>
                    <time className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2">{formattedDate}</time>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium truncate mt-1">{item.subject}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{plainTextBody}</p>
                
                {isInboxItem ? (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <Tag type="status" text={(item as Email).status} />
                      {(item as Email).aiTags?.slice(0, 3).map(tag => (
                        <Tag key={tag} type="keyword" text={tag} />
                      ))}
                      {(item as Email).aiTags && (item as Email).aiTags!.length > 3 && (
                        <span className="text-xs text-slate-400">...</span>
                      )}
                  </div>
                ) : (
                    sentItem?.sentBy && (
                        <div className="mt-3">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                送信者: {sentItem.sentBy}
                            </p>
                        </div>
                    )
                )}
            </div>
        </div>
    </li>
  );
};

export default EmailListItem;