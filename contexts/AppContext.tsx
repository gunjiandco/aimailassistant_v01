

import React, { createContext, useReducer, useContext, Dispatch } from 'react';
import { 
    Email, SentEmail, Contact, MailingList, Task, Template, Collaborator, EmailStatus, TaskStatus, AiAnalysisResult, Notification, AppSettings
} from '../types';
import { mockEmails } from '../data/mockEmails';
import { mockContacts, mockMailingLists } from '../data/mockContacts';
import { mockTemplates } from '../data/mockTemplates';
import { mockCollaborators } from '../data/mockCollaborators';

// 1. State Interface
interface AppState {
    emails: Email[];
    sentEmails: SentEmail[];
    contacts: Contact[];
    mailingLists: MailingList[];
    tasks: Task[];
    templates: Template[];
    collaborators: Collaborator[];
    selectedItemId: string | null;
    bulkSelectedIds: string[];
    view: 'inbox' | 'dashboard' | 'contacts' | 'templates' | 'settings';
    inboxSubView: 'inbox' | 'sent';
    isBulkSendModalOpen: boolean;
    bulkSendRecipients: Contact[];
    isImportModalOpen: boolean;
    currentUser: Collaborator;
    isUserMenuOpen: boolean;
    filterStatus: EmailStatus | 'all';
    filterTag: string | 'all';
    notifications: Notification[];
    isAiSearching: boolean;
    aiSearchResultIds: string[] | null;
    appSettings: AppSettings;
}

// 2. Initial State
const initialState: AppState = {
    emails: mockEmails,
    sentEmails: [],
    contacts: mockContacts,
    mailingLists: mockMailingLists,
    tasks: [],
    templates: mockTemplates,
    collaborators: mockCollaborators,
    selectedItemId: '1',
    bulkSelectedIds: [],
    view: 'inbox',
    inboxSubView: 'inbox',
    isBulkSendModalOpen: false,
    bulkSendRecipients: [],
    isImportModalOpen: false,
    currentUser: mockCollaborators[0],
    isUserMenuOpen: false,
    filterStatus: 'all',
    filterTag: 'all',
    notifications: [],
    isAiSearching: false,
    aiSearchResultIds: null,
    appSettings: {
        eventName: 'NEXT TOKYO 2024',
        websiteUrl: 'https://example.com/next-tokyo-2024',
        officeName: 'NEXT TOKYO 2024 事務局',
        eventSummary: '東京で開催される最大級のテクノロジーとイノベーションのカンファレンス。世界中からリーダー、開発者、思想家が集まります。',
        signature: '何卒よろしくお願い申し上げます。\n--\nNEXT TOKYO 2024 事務局\n[あなたの名前]\n公式サイト: https://example.com/next-tokyo-2024',
        communicationStyle: '丁寧',
        knowledgeBase: [
            { id: 'kb-1', key: '会場', value: '東京ビッグサイト 西ホール' },
            { id: 'kb-2', key: 'Wi-Fiパスワード', value: 'NextTokyo2024!' },
            { id: 'kb-3', key: '基調講演の開始時間', value: '10:00 AM' },
            { id: 'kb-4', key: '代表問い合わせ先', value: 'support@nexttokyo.events' },
        ]
    }
};

// 3. Action Types
type Action =
  | { type: 'SET_VIEW'; payload: AppState['view'] }
  | { type: 'SET_INBOX_SUB_VIEW'; payload: AppState['inboxSubView'] }
  | { type: 'SET_SELECTED_ITEM'; payload: string | null }
  | { type: 'SET_BULK_SELECTED_IDS'; payload: string[] }
  | { type: 'UPDATE_EMAIL_STATUS'; payload: { id: string; status: EmailStatus, user: Collaborator } }
  | { type: 'BULK_UPDATE_EMAIL_STATUS'; payload: { status: EmailStatus, user: Collaborator } }
  | { type: 'UPDATE_EMAIL_ANALYSIS'; payload: { id: string, analysis: AiAnalysisResult, user: Collaborator } }
  | { type: 'SEND_EMAIL'; payload: { draft: Omit<SentEmail, 'id' | 'timestamp' | 'sentBy'>; user: Collaborator } }
  | { type: 'SET_CURRENT_USER'; payload: Collaborator }
  | { type: 'TOGGLE_USER_MENU' }
  | { type: 'CLOSE_USER_MENU' }
  | { type: 'SET_FILTER_STATUS'; payload: EmailStatus | 'all' }
  | { type: 'SET_FILTER_TAG'; payload: string | 'all' }
  | { type: 'ADD_CONTACT'; payload: { listId: string; contact: Omit<Contact, 'id'> } }
  | { type: 'ADD_MAILING_LIST'; payload: string }
  | { type: 'INITIATE_BULK_SEND'; payload: string[] }
  | { type: 'CLOSE_BULK_SEND' }
  | { type: 'OPEN_IMPORT_MODAL' }
  | { type: 'CLOSE_IMPORT_MODAL' }
  | { type: 'IMPORT_CONTACTS'; payload: { listId: string; newContacts: Omit<Contact, 'id'>[] } }
  | { type: 'ADD_TASK'; payload: Omit<Task, 'id'> }
  | { type: 'UPDATE_TASK_STATUS'; payload: { taskId: string; status: TaskStatus } }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate'>> } }
  | { type: 'DELETE_TASK'; payload: { taskId: string } }
  | { type: 'ADD_TEMPLATE'; payload: { title: string; body: string; tags: string[]; user: Collaborator } }
  | { type: 'UPDATE_TEMPLATE'; payload: { template: Template; user: Collaborator } }
  | { type: 'DELETE_TEMPLATE'; payload: string }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: number }
  | { type: 'AI_SEARCH_START' }
  | { type: 'AI_SEARCH_SUCCESS'; payload: string[] }
  | { type: 'AI_SEARCH_CLEAR' }
  | { type: 'UPDATE_APP_SETTINGS'; payload: Partial<AppSettings> };


// 4. Reducer Function
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_VIEW':
            return { ...state, view: action.payload };
        case 'SET_INBOX_SUB_VIEW':
            return { ...state, inboxSubView: action.payload };
        case 'SET_SELECTED_ITEM':
            return { ...state, selectedItemId: action.payload };
        case 'SET_BULK_SELECTED_IDS':
             return { ...state, bulkSelectedIds: action.payload };
        case 'UPDATE_EMAIL_STATUS': {
            const now = new Date().toISOString();
            return {
                ...state,
                emails: state.emails.map(email =>
                    email.id === action.payload.id 
                    ? { ...email, status: action.payload.status, updatedAt: now, lastModifiedBy: action.payload.user.name } 
                    : email
                ),
            };
        }
        case 'BULK_UPDATE_EMAIL_STATUS': {
            const now = new Date().toISOString();
            return {
                ...state,
                emails: state.emails.map(email =>
                    state.bulkSelectedIds.includes(email.id)
                    ? { ...email, status: action.payload.status, updatedAt: now, lastModifiedBy: action.payload.user.name }
                    : email
                ),
                bulkSelectedIds: [],
            };
        }
        case 'UPDATE_EMAIL_ANALYSIS': {
            const now = new Date().toISOString();
            return {
                ...state,
                emails: state.emails.map(email =>
                    email.id === action.payload.id 
                    ? { ...email, 
                        status: action.payload.analysis.status, 
                        aiTags: action.payload.analysis.tags, 
                        suggestedTasks: action.payload.analysis.suggestedTasks,
                        updatedAt: now, 
                        lastModifiedBy: action.payload.user.name 
                      } 
                    : email
                ),
            };
        }
        case 'SEND_EMAIL': {
            const now = new Date().toISOString();
            const newSentEmail: SentEmail = {
                id: `sent-${Date.now()}`,
                timestamp: now,
                ...action.payload.draft,
                sentBy: action.payload.user.name,
                updatedAt: now,
                lastModifiedBy: action.payload.user.name,
            };
            return {
                ...state,
                sentEmails: [newSentEmail, ...state.sentEmails],
                emails: state.emails.map(email =>
                    email.id === action.payload.draft.inReplyTo
                    ? { ...email, status: EmailStatus.Replied, updatedAt: now, lastModifiedBy: action.payload.user.name }
                    : email
                ),
                inboxSubView: 'sent',
                selectedItemId: newSentEmail.id,
            };
        }
        case 'SET_CURRENT_USER':
            return { ...state, currentUser: action.payload, isUserMenuOpen: false };
        case 'TOGGLE_USER_MENU':
            return { ...state, isUserMenuOpen: !state.isUserMenuOpen };
        case 'CLOSE_USER_MENU':
            return { ...state, isUserMenuOpen: false };
        case 'SET_FILTER_STATUS':
            return { ...state, filterStatus: action.payload };
        case 'SET_FILTER_TAG':
            return { ...state, filterTag: action.payload };
        case 'ADD_TASK':
            return { ...state, tasks: [{ id: `task-${Date.now()}`, ...action.payload }, ...state.tasks] };
        case 'UPDATE_TASK_STATUS':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, status: action.payload.status } : t)
            };
        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.taskId ? { ...t, ...action.payload.updates } : t)
            };
        case 'DELETE_TASK':
            return {
                ...state,
                tasks: state.tasks.filter(t => t.id !== action.payload.taskId)
            };
        case 'ADD_TEMPLATE': {
            const now = new Date().toISOString();
            const newTemplate: Template = {
                id: `tmpl-${Date.now()}`,
                title: action.payload.title,
                body: action.payload.body,
                tags: action.payload.tags,
                createdAt: now,
                createdBy: action.payload.user.name,
                updatedAt: now,
                lastModifiedBy: action.payload.user.name,
            };
            return { ...state, templates: [newTemplate, ...state.templates] };
        }
        case 'UPDATE_TEMPLATE': {
            const now = new Date().toISOString();
            return {
                ...state,
                templates: state.templates.map(t =>
                    t.id === action.payload.template.id
                    ? { ...action.payload.template, updatedAt: now, lastModifiedBy: action.payload.user.name }
                    : t
                ),
            };
        }
        case 'DELETE_TEMPLATE':
            return { ...state, templates: state.templates.filter(t => t.id !== action.payload) };
        case 'ADD_CONTACT': {
            const newContact = { ...action.payload.contact, id: `c-${Date.now()}` };
            return {
                ...state,
                contacts: [...state.contacts, newContact],
                mailingLists: state.mailingLists.map(list => 
                    list.id === action.payload.listId
                    ? { ...list, contactIds: [...list.contactIds, newContact.id] }
                    : list
                ),
            };
        }
        case 'ADD_MAILING_LIST':
            return { ...state, mailingLists: [...state.mailingLists, { id: `ml-${Date.now()}`, name: action.payload, contactIds: [] }] };
        case 'INITIATE_BULK_SEND':
            return { ...state, isBulkSendModalOpen: true, bulkSendRecipients: state.contacts.filter(c => action.payload.includes(c.id)) };
        case 'CLOSE_BULK_SEND':
            return { ...state, isBulkSendModalOpen: false, bulkSendRecipients: [] };
        case 'OPEN_IMPORT_MODAL':
            return { ...state, isImportModalOpen: true };
        case 'CLOSE_IMPORT_MODAL':
            return { ...state, isImportModalOpen: false };
        case 'IMPORT_CONTACTS': {
             const newContactsWithIds: Contact[] = action.payload.newContacts.map((contact, index) => ({
                ...contact,
                id: `c-imported-${Date.now()}-${index}`,
            }));
            const newContactIds = newContactsWithIds.map(c => c.id);
            return {
                ...state,
                contacts: [...state.contacts, ...newContactsWithIds],
                mailingLists: state.mailingLists.map(list =>
                    list.id === action.payload.listId
                    ? { ...list, contactIds: [...new Set([...list.contactIds, ...newContactIds])] }
                    : list
                ),
                isImportModalOpen: false
            }
        }
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [...state.notifications, { id: Date.now(), ...action.payload }],
            };
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
            };
        case 'AI_SEARCH_START':
            return { ...state, isAiSearching: true };
        case 'AI_SEARCH_SUCCESS':
            return { 
                ...state, 
                isAiSearching: false, 
                aiSearchResultIds: action.payload,
                // also reset other filters and selection for a clean search result view
                selectedItemId: action.payload.length > 0 ? action.payload[0] : null,
                filterStatus: 'all',
                filterTag: 'all',
            };
        case 'AI_SEARCH_CLEAR':
            return { ...state, aiSearchResultIds: null, isAiSearching: false };
        case 'UPDATE_APP_SETTINGS':
            return {
                ...state,
                appSettings: { ...state.appSettings, ...action.payload },
            };
        default:
            return state;
    }
};

// 5. Context and Provider
const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<Action>>(() => null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, initialState);

    return (
        <AppStateContext.Provider value={state}>
            <AppDispatchContext.Provider value={dispatch}>
                {children}
            </AppDispatchContext.Provider>
        </AppStateContext.Provider>
    );
};

// 6. Custom Hooks
export const useAppState = () => useContext(AppStateContext);
export const useAppDispatch = () => useContext(AppDispatchContext);