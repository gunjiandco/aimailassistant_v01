
import React, { createContext, useReducer, useContext, Dispatch } from 'react';
import { 
    Email, SentEmail, Contact, MailingList, Task, Template, Collaborator, EmailStatus, TaskStatus, AiAnalysisResult, Notification, AppSettings, Sender, Draft
} from '../types';
import { mockEmails } from '../data/mockEmails';
import { mockContacts, mockMailingLists } from '../data/mockContacts';
import { mockTemplates } from '../data/mockTemplates';
import { mockCollaborators } from '../data/mockCollaborators';
import { generateId } from '../utils/helpers';
import { createTask, createTemplate, createSentEmail, createContact, createMailingList } from '../utils/models';

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
  | { type: 'UPDATE_EMAIL_TAGS'; payload: { id: string; tags: string[]; user: Collaborator } }
  | { type: 'SEND_EMAIL'; payload: { draft: Omit<SentEmail, 'id' | 'timestamp' | 'sentBy'>; user: Collaborator } }
  | { type: 'SEND_PERSONALIZED_BULK_EMAIL'; payload: { emails: Array<{ recipients: Sender[], subject: string, body: string }>; user: Collaborator } }
  | { type: 'SAVE_DRAFT'; payload: { emailId: string; draft: Draft } }
  | { type: 'DELETE_DRAFT'; payload: { emailId: string } }
  | { type: 'SET_CURRENT_USER'; payload: Collaborator }
  | { type: 'TOGGLE_USER_MENU' }
  | { type: 'CLOSE_USER_MENU' }
  | { type: 'SET_FILTER_STATUS'; payload: EmailStatus | 'all' }
  | { type: 'SET_FILTER_TAG'; payload: string | 'all' }
  | { type: 'ADD_CONTACT'; payload: { listId: string; contact: Omit<Contact, 'id'> } }
  | { type: 'ADD_MAILING_LIST'; payload: string }
  | { type: 'OPEN_BULK_SEND_MODAL' }
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

// --- Reducer Helper ---
const processContactImport = (
    currentContacts: Contact[], 
    importedContacts: Omit<Contact, 'id'>[]
): { finalContacts: Contact[], importedIds: Set<string> } => {
    const emailToExistingContact = new Map(currentContacts.map(c => [c.email.toLowerCase(), c]));
    const contactsToAdd: Contact[] = [];
    const importedIds = new Set<string>();
    const contactsToUpdateMap = new Map<string, Partial<Contact>>();

    importedContacts.forEach((imported) => {
        const existingContact = emailToExistingContact.get(imported.email.toLowerCase());
        if (existingContact) {
            contactsToUpdateMap.set(existingContact.id, {
                name: imported.name,
                affiliation: imported.affiliation,
                requiredCc: imported.requiredCc
            });
            importedIds.add(existingContact.id);
        } else {
            const newContact = createContact(imported);
            contactsToAdd.push(newContact);
            importedIds.add(newContact.id);
        }
    });

    const finalContacts = [
        ...currentContacts.map(c => contactsToUpdateMap.has(c.id) ? { ...c, ...contactsToUpdateMap.get(c.id) } : c),
        ...contactsToAdd
    ];

    return { finalContacts, importedIds };
};


// 4. Reducer Function
const appReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'SET_VIEW':
            return { ...state, view: action.payload, selectedItemId: state.view === action.payload ? state.selectedItemId : null };
        case 'SET_INBOX_SUB_VIEW':
            return { ...state, inboxSubView: action.payload, selectedItemId: null };
        case 'SET_SELECTED_ITEM':
            return { ...state, selectedItemId: action.payload };
        case 'SET_BULK_SELECTED_IDS':
            return { ...state, bulkSelectedIds: action.payload };
        case 'UPDATE_EMAIL_STATUS': {
            const now = new Date().toISOString();
            return {
                ...state,
                emails: state.emails.map(e =>
                    e.id === action.payload.id
                        ? { ...e, status: action.payload.status, updatedAt: now, lastModifiedBy: action.payload.user.name }
                        : e
                ),
            };
        }
        case 'BULK_UPDATE_EMAIL_STATUS': {
            const now = new Date().toISOString();
            return {
                ...state,
                emails: state.emails.map(e =>
                    state.bulkSelectedIds.includes(e.id)
                        ? { ...e, status: action.payload.status, updatedAt: now, lastModifiedBy: action.payload.user.name }
                        : e
                ),
                bulkSelectedIds: [],
            };
        }
        case 'UPDATE_EMAIL_ANALYSIS': {
            const { id, analysis, user } = action.payload;
            const now = new Date().toISOString();
            return {
                ...state,
                emails: state.emails.map(e =>
                    e.id === id
                        ? { 
                            ...e, 
                            status: analysis.status,
                            aiTags: analysis.tags,
                            suggestedTasks: analysis.suggestedTasks,
                            updatedAt: now,
                            lastModifiedBy: user.name,
                          }
                        : e
                )
            };
        }
        case 'UPDATE_EMAIL_TAGS': {
             const now = new Date().toISOString();
             return {
                 ...state,
                 emails: state.emails.map(e =>
                     e.id === action.payload.id
                         ? { ...e, aiTags: action.payload.tags, updatedAt: now, lastModifiedBy: action.payload.user.name }
                         : e
                 ),
             };
         }
        case 'SEND_EMAIL': {
            const { draft, user } = action.payload;
            const newSentEmail = createSentEmail(draft, user, draft.threadId || generateId('thread'));

            let emails = state.emails;
            // If replying, update the original email's status
            if (draft.inReplyTo) {
                const now = new Date().toISOString();
                emails = state.emails.map(e =>
                    e.id === draft.inReplyTo
                        ? { ...e, status: EmailStatus.Replied, draft: undefined, updatedAt: now, lastModifiedBy: user.name }
                        : e
                );
            }
            return {
                ...state,
                emails: emails,
                sentEmails: [newSentEmail, ...state.sentEmails],
                selectedItemId: newSentEmail.id,
                inboxSubView: 'sent',
            };
        }
        case 'SEND_PERSONALIZED_BULK_EMAIL': {
            const { emails, user } = action.payload;
            const newSentEmails = emails.map(emailDraft => createSentEmail(
                {...emailDraft, threadId: generateId('thread')}, user, generateId('thread')
            ));

            return {
                ...state,
                sentEmails: [...newSentEmails, ...state.sentEmails],
                isBulkSendModalOpen: false
            };
        }
        case 'SAVE_DRAFT': {
            return {
                ...state,
                emails: state.emails.map(e => e.id === action.payload.emailId ? { ...e, draft: action.payload.draft } : e),
            };
        }
        case 'DELETE_DRAFT': {
            return {
                ...state,
                emails: state.emails.map(e => e.id === action.payload.emailId ? { ...e, draft: undefined, status: EmailStatus.NeedsReply } : e),
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
        case 'ADD_CONTACT': {
            const newContact = createContact(action.payload.contact);
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
        case 'ADD_MAILING_LIST': {
            const newList = createMailingList(action.payload);
            return {
                ...state,
                mailingLists: [...state.mailingLists, newList],
            };
        }
        case 'OPEN_BULK_SEND_MODAL':
            return { ...state, isBulkSendModalOpen: true };
        case 'CLOSE_BULK_SEND':
            return { ...state, isBulkSendModalOpen: false };
        case 'OPEN_IMPORT_MODAL':
            return { ...state, isImportModalOpen: true };
        case 'CLOSE_IMPORT_MODAL':
            return { ...state, isImportModalOpen: false };
        case 'IMPORT_CONTACTS': {
            const { listId, newContacts } = action.payload;
            const { finalContacts, importedIds } = processContactImport(state.contacts, newContacts);
            const updatedMailingLists = state.mailingLists.map(list => {
                if (list.id === listId) {
                    const combinedIds = new Set([...list.contactIds, ...importedIds]);
                    return { ...list, contactIds: Array.from(combinedIds) };
                }
                return list;
            });
            return {
                ...state,
                contacts: finalContacts,
                mailingLists: updatedMailingLists,
                isImportModalOpen: false
            };
        }
        case 'ADD_TASK': {
            const newTask = createTask(action.payload);
            return {
                ...state,
                tasks: [...state.tasks, newTask],
            };
        }
        case 'UPDATE_TASK_STATUS':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.id === action.payload.taskId ? { ...t, status: action.payload.status } : t
                ),
            };
        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.id === action.payload.taskId ? { ...t, ...action.payload.updates } : t
                ),
            };
        case 'DELETE_TASK':
            return {
                ...state,
                tasks: state.tasks.filter(t => t.id !== action.payload.taskId),
            };
        case 'ADD_TEMPLATE': {
            const newTemplate = createTemplate(action.payload, action.payload.user);
            return {
                ...state,
                templates: [...state.templates, newTemplate],
            };
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
            return {
                ...state,
                templates: state.templates.filter(t => t.id !== action.payload),
            };
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [...state.notifications, { ...action.payload, id: Date.now() }],
            };
        case 'REMOVE_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
            };
        case 'AI_SEARCH_START':
            return { ...state, isAiSearching: true };
        case 'AI_SEARCH_SUCCESS':
            return { ...state, aiSearchResultIds: action.payload, isAiSearching: false };
        case 'AI_SEARCH_CLEAR':
            return { ...state, aiSearchResultIds: null, isAiSearching: false };
        case 'UPDATE_APP_SETTINGS':
            return { ...state, appSettings: { ...state.appSettings, ...action.payload } };
        default:
            return state;
    }
};

// 5. Create Contexts
const AppStateContext = createContext<AppState | undefined>(undefined);
const AppDispatchContext = createContext<Dispatch<Action> | undefined>(undefined);

// 6. Provider Component
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

// 7. Custom Hooks
export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

export const useAppDispatch = (): Dispatch<Action> => {
    const context = useContext(AppDispatchContext);
    if (context === undefined) {
        throw new Error('useAppDispatch must be used within an AppProvider');
    }
    return context;
};
