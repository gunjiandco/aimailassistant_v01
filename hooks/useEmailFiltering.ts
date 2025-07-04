
import { useMemo } from 'react';
import { Email, EmailStatus, SentEmail } from '../types';

const sortItemsByThread = <T extends { timestamp: string; threadId: string; id: string }>(items: T[]): T[] => {
    const threads = new Map<string, T[]>();
    items.forEach(item => {
        if (!threads.has(item.threadId)) {
            threads.set(item.threadId, []);
        }
        threads.get(item.threadId)!.push(item);
    });

    const threadTimestamps = Array.from(threads.entries()).map(([threadId, threadEmails]) => {
        const latestTimestamp = Math.max(...threadEmails.map(e => new Date(e.timestamp).getTime()));
        return { threadId, latestTimestamp, emails: threadEmails };
    });

    threadTimestamps.sort((a, b) => b.latestTimestamp - a.latestTimestamp);
      
    return threadTimestamps.flatMap(thread => 
        thread.emails.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    );
};


export const useEmailFiltering = (
    emails: Email[],
    sentEmails: SentEmail[],
    filterStatus: EmailStatus | 'all',
    filterTag: string | 'all',
    aiSearchResultIds: string[] | null,
    searchTerm: string
) => {
    const sortedAndFilteredEmails = useMemo(() => {
        // 1. Group all emails by threadId
        const threads = new Map<string, Email[]>();
        emails.forEach(email => {
            if (!threads.has(email.threadId)) {
                threads.set(email.threadId, []);
            }
            threads.get(email.threadId)!.push(email);
        });

        const allThreads = Array.from(threads.values());

        // 2. Filter the threads. A thread is kept if *any* email in it matches all active filters.
        const filteredThreads = allThreads.filter(threadEmails => 
            threadEmails.some(email => {
                const searchMatch = aiSearchResultIds ? aiSearchResultIds.includes(email.id) : true;
                const statusMatch = filterStatus === 'all' || email.status === filterStatus;
                const tagMatch = filterTag === 'all' || (email.aiTags && email.aiTags.includes(filterTag));

                const term = searchTerm.toLowerCase();
                if (!term.trim()) return searchMatch && statusMatch && tagMatch;

                const plainTextBody = email.body.replace(/<[^>]*>?/gm, ' ');
                const keywordMatch = email.subject.toLowerCase().includes(term) || 
                                     plainTextBody.toLowerCase().includes(term) ||
                                     email.sender.name.toLowerCase().includes(term) || 
                                     email.displayId.toLowerCase().includes(term);
                
                return searchMatch && statusMatch && tagMatch && keywordMatch;
            })
        );

        // 3. For each kept thread, get its latest timestamp and sort the threads by it
        const sortedThreads = filteredThreads.map(threadEmails => ({
            latestTimestamp: Math.max(...threadEmails.map(e => new Date(e.timestamp).getTime())),
            emails: threadEmails
        })).sort((a, b) => b.latestTimestamp - a.latestTimestamp);

        // 4. Flatten the sorted threads back into a single list, ensuring emails within a thread are sorted chronologically
        return sortedThreads.flatMap(thread => 
            thread.emails.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        );
    }, [emails, filterStatus, filterTag, aiSearchResultIds, searchTerm]);
  
    const sortedSentEmails = useMemo(() => {
        const term = searchTerm.toLowerCase();
        const filtered = sentEmails.filter(item => {
            if (!term.trim()) return true;
            const plainTextBody = item.body.replace(/<[^>]*>?/gm, ' ');
            return item.subject.toLowerCase().includes(term) ||
                   plainTextBody.toLowerCase().includes(term) ||
                   item.recipients.map(r => r.name).join(' ').toLowerCase().includes(term);
        });
        return sortItemsByThread(filtered);
    }, [sentEmails, searchTerm]);

    return { sortedAndFilteredEmails, sortedSentEmails };
};
