
import { AppSettings, Contact, Sender } from "../types";

// --- ID Generation ---
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// --- String & Regex ---
export const placeholderRegex = /({{\s*[^}]+?\s*}})|(\[\s*[^\]]+?\s*\])/g;

export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// --- JSON Parsing ---
export const parseJsonWithFence = <T,>(text: string): T | null => {
    let jsonStr = text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }
    try {
        return JSON.parse(jsonStr) as T;
    } catch (e) {
        console.error("JSONレスポンスの解析に失敗しました:", e, "元のテキスト:", text);
        return null;
    }
};

// --- Email & Contact Handling ---
export const parseRecipients = (emailsString: string, allContacts: Contact[]): Sender[] => {
    if (!emailsString.trim()) return [];
    const contactMap = new Map(allContacts.map(c => [c.email.toLowerCase(), c]));
    
    return emailsString.split(',').map(e => e.trim()).filter(e => e).map(email => {
        const contact = contactMap.get(email.toLowerCase());
        return {
            email: email,
            name: contact ? contact.name : email
        };
    });
};

export const processTemplateBody = (body: string, appSettings: AppSettings, recipient?: Sender): string => {
    let processedBody = body;

    // Apply appSettings placeholders
    processedBody = processedBody.replace(/{{eventName}}/g, appSettings.eventName || '');
    processedBody = processedBody.replace(/{{websiteUrl}}/g, appSettings.websiteUrl || '');
    processedBody = processedBody.replace(/{{officeName}}/g, appSettings.officeName || '');
    
    // Apply knowledgeBase placeholders
    if(appSettings.knowledgeBase) {
        appSettings.knowledgeBase.forEach(item => {
            if(item.key) {
                const regex = new RegExp(`{{${escapeRegExp(item.key)}}}`, 'g');
                processedBody = processedBody.replace(regex, item.value || '');
            }
        });
    }
    
    // Apply contact-specific placeholders if recipient is provided
    if (recipient) {
        processedBody = processedBody.replace(/{{name}}/g, `<strong>${recipient.name}</strong>`);
        processedBody = processedBody.replace(/{{email}}/g, recipient.email);
    }

    return processedBody;
};


// --- Date Formatting ---
export const formatDisplayDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

    if (isToday) {
        return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
