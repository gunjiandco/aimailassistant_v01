
import React from 'react';
import { Email, SentEmail } from '../types';

interface QuotedMessageProps {
  item: Email | SentEmail;
}

const QuotedMessage: React.FC<QuotedMessageProps> = ({ item }) => {
    const isInboxItem = 'sender' in item;
    const senderInfo = isInboxItem ? `${item.sender.name} <${item.sender.email}>` : (item as SentEmail).sentBy;

    const timestamp = new Date(item.timestamp).toLocaleString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });

    const header = `On ${timestamp}, ${senderInfo} wrote:`;

    return (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="pl-3 border-l-4 border-slate-300 dark:border-slate-600">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{header}</p>
                <div
                    className="prose prose-sm dark:prose-invert max-w-none opacity-90"
                    dangerouslySetInnerHTML={{ __html: item.body }}
                />
            </div>
        </div>
    );
};

export default QuotedMessage;
