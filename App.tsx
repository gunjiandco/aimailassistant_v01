

import React, { useMemo, useEffect, useState } from 'react';
import EmailList from './components/EmailList';
import EmailDetail from './components/EmailDetail';
import AiAssistant from './components/AiAssistant';
import DashboardAndTasks from './components/DashboardAndTasks';
import Contacts from './components/Contacts';
import TemplatesView from './components/TemplatesView';
import SettingsView from './components/SettingsView';
import BulkSendModal from './components/BulkSendModal';
import ImportContactsModal from './components/ImportContactsModal';
import NewEmailView from './components/NewEmailView';
import { Email, EmailStatus, Task, TaskType, TaskStatus, Contact, Template, MailingList, SentEmail } from './types';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import InboxIcon from './components/icons/InboxIcon';
import ChartBarIcon from './components/icons/ChartBarIcon';
import UsersIcon from './components/icons/UsersIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import DocumentTextIcon from './components/icons/DocumentTextIcon';
import Cog6ToothIcon from './components/icons/Cog6ToothIcon';
import { useAppState, useAppDispatch } from './contexts/AppContext';
import ToastContainer from './components/ToastContainer';
import ReplyComposer from './components/ReplyComposer';
import { useEmailFiltering } from './hooks/useEmailFiltering';


type View = 'inbox' | 'dashboard' | 'contacts' | 'templates' | 'settings';

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 w-full transition-colors duration-200 rounded-lg ${
            isActive
                ? 'bg-primary-500 text-white'
                : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700'
        }`}
        aria-label={label}
        title={label}
    >
        {icon}
        <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);


const App: React.FC = () => {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const { 
    emails, sentEmails, contacts, mailingLists, tasks, templates, 
    selectedItemId, bulkSelectedIds, view, inboxSubView, 
    isBulkSendModalOpen, isImportModalOpen, 
    currentUser, isUserMenuOpen, filterStatus, filterTag, notifications,
    aiSearchResultIds, appSettings
  } = state;

  const [isMobile, setIsMobile] = useState(false);
  const [isMobileDetailVisible, setIsMobileDetailVisible] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    // Reset mobile view when switching main views or sub-views
    setIsMobileDetailVisible(false);
  }, [view, inboxSubView]);
  
  const { sortedAndFilteredEmails, sortedSentEmails } = useEmailFiltering(
    emails, sentEmails, filterStatus, filterTag, aiSearchResultIds, searchTerm
  );

  const handleAddTask = (title: string, details: string, dueDate: string) => {
    dispatch({ type: 'ADD_TASK', payload: { title, details, dueDate, status: TaskStatus.Todo, type: TaskType.Manual } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'タスクを追加しました', type: 'success' } });
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    dispatch({ type: 'UPDATE_TASK_STATUS', payload: { taskId, status } });
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate'>>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'タスクを更新しました', type: 'info' } });
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('このタスクを本当に削除しますか？')) {
      dispatch({ type: 'DELETE_TASK', payload: { taskId } });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'タスクを削除しました', type: 'info' } });
    }
  };

  const handleAddContact = (listId: string, name: string, email: string, affiliation: string, requiredCc: string[]) => {
    const contact: Omit<Contact, 'id'> = { name, email, affiliation, requiredCc: requiredCc.length > 0 ? requiredCc : undefined };
    dispatch({ type: 'ADD_CONTACT', payload: { listId, contact } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: '連絡先を追加しました', type: 'success' } });
  };
  
  const handleAddMailingList = (name: string) => {
      dispatch({ type: 'ADD_MAILING_LIST', payload: name });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'メーリングリストを追加しました', type: 'success' } });
  };

  const handleOpenBulkSendModal = () => dispatch({ type: 'OPEN_BULK_SEND_MODAL' });
  const handleOpenImportModal = () => dispatch({ type: 'OPEN_IMPORT_MODAL' });
  const handleCloseBulkSendModal = () => dispatch({ type: 'CLOSE_BULK_SEND' });
  const handleCloseImportModal = () => dispatch({ type: 'CLOSE_IMPORT_MODAL' });

  const handleImportContacts = (listId: string, newContacts: Omit<Contact, 'id'>[]) => {
      dispatch({ type: 'IMPORT_CONTACTS', payload: { listId, newContacts } });
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${newContacts.length}件の連絡先をインポートしました`, type: 'success' } });
  };
  
  const handleStatCardClick = (status: EmailStatus) => {
    dispatch({ type: 'SET_VIEW', payload: 'inbox' });
    dispatch({ type: 'SET_FILTER_STATUS', payload: status });
    dispatch({ type: 'SET_FILTER_TAG', payload: 'all' });
    dispatch({ type: 'AI_SEARCH_CLEAR'}); 

    const firstMatchingEmail = emails.find(e => e.status === status);
    if(firstMatchingEmail) handleItemSelect(firstMatchingEmail.id);
    else dispatch({ type: 'SET_SELECTED_ITEM', payload: null });
  };

  // Auto-generate tasks for emails needing replies
  useEffect(() => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    emails.forEach(email => {
        if (email.status === EmailStatus.NeedsReply && new Date(email.timestamp) < twoDaysAgo) {
            const taskExists = tasks.some(task => task.relatedEmailId === email.id && task.type === TaskType.AutoReminder);
            if (!taskExists) {
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + 1); 
                dispatch({ 
                  type: 'ADD_TASK', 
                  payload: {
                    title: `${email.sender.name}さんへのフォローアップ`,
                    details: `メールへの返信: 「${email.subject}」`,
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: TaskStatus.Todo,
                    type: TaskType.AutoReminder,
                    relatedEmailId: email.id,
                  }
                });
            }
        }
    });
  }, [emails, tasks, dispatch]);

  const selectedItem = useMemo(() => {
    if (selectedItemId === 'new') return null;
    const allItems = [...emails, ...sentEmails];
    return allItems.find(item => item.id === selectedItemId) || null;
  }, [emails, sentEmails, selectedItemId]);


  const allAiTags = useMemo(() => {
    const tags = new Set<string>();
    emails.forEach(email => email.aiTags?.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [emails]);
  
  
  const handleItemSelect = (id: string) => {
    const allItems = [...emails, ...sentEmails];
    const item = allItems.find(item => item.id === id);
    dispatch({ type: 'SET_SELECTED_ITEM', payload: id });
    if (view !== 'inbox') dispatch({ type: 'SET_VIEW', payload: 'inbox' });
    
    if (item && 'draft' in item && item.draft) {
      setIsReplying(true);
    } else {
      setIsReplying(false);
    }

    if (isMobile) {
      setIsMobileDetailVisible(true);
    }
  };
  
  const handleStartReply = () => {
    if (selectedItem && 'sender' in selectedItem) {
        dispatch({
            type: 'UPDATE_EMAIL_STATUS',
            payload: {
                id: selectedItem.id,
                status: EmailStatus.Drafting,
                user: currentUser
            }
        });
        setIsReplying(true);
    }
  };
  
  const handleCancelReply = () => {
      if (selectedItem && 'sender' in selectedItem && !selectedItem.draft) {
          dispatch({
              type: 'UPDATE_EMAIL_STATUS',
              payload: {
                  id: selectedItem.id,
                  status: EmailStatus.NeedsReply,
                  user: currentUser
              }
          });
      }
      setIsReplying(false);
  };

  const renderInboxView = () => {
    const items = inboxSubView === 'inbox' ? sortedAndFilteredEmails : sortedSentEmails;
    const selectedEmailForAssistant = selectedItem && 'sender' in selectedItem ? selectedItem as Email : null;
    const isComposingNew = selectedItemId === 'new';

    const emailListComponent = (
      <EmailList
        items={items}
        selectedItemId={selectedItemId}
        onItemSelect={handleItemSelect}
        bulkSelectedIds={bulkSelectedIds}
        inboxSubView={inboxSubView}
        filterStatus={filterStatus}
        setFilterStatus={(status) => dispatch({ type: 'SET_FILTER_STATUS', payload: status })}
        filterTag={filterTag}
        setFilterTag={(tag) => dispatch({ type: 'SET_FILTER_TAG', payload: tag })}
        allAiTags={allAiTags}
        isAiSearching={state.isAiSearching}
        aiSearchResultIds={state.aiSearchResultIds}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />
    );
    
    const detailPanelContent = () => {
        if (isComposingNew) {
            return <NewEmailView onBack={isMobile ? () => setIsMobileDetailVisible(false) : undefined} contacts={state.contacts} />;
        }
        
        if (!selectedItem) {
            return (
                <div className="flex-1 p-6 flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/50 hidden md:flex">
                    <InboxIcon className="w-20 h-20 text-slate-300 dark:text-slate-600" />
                    <h3 className="mt-4 text-xl font-medium text-slate-800 dark:text-slate-200">メールを選択して表示</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">まだ何も表示されていません。左のリストから項目を選択してください。</p>
                </div>
            );
        }

        if (isReplying && selectedEmailForAssistant) {
            return (
                <ReplyComposer
                    email={selectedEmailForAssistant}
                    onCancel={handleCancelReply}
                    onSent={() => {
                        setIsReplying(false);
                        if (isMobile) setIsMobileDetailVisible(false);
                    }}
                />
            );
        }

        return (
            <>
                <EmailDetail
                    item={selectedItem}
                    onBack={isMobile ? () => setIsMobileDetailVisible(false) : undefined}
                    allEmails={emails}
                    allSentEmails={sentEmails}
                    onReply={handleStartReply}
                />
                <AiAssistant email={selectedEmailForAssistant} />
            </>
        );
    };

    if (isMobile) {
      if (isMobileDetailVisible) {
        return detailPanelContent();
      }
      return emailListComponent;
    }

    return (
      <>
        {emailListComponent}
        {detailPanelContent()}
      </>
    );
  };
  
  const renderView = () => {
      switch (view) {
          case 'dashboard':
              return <DashboardAndTasks 
                emails={emails} 
                tasks={tasks}
                onAddTask={handleAddTask}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onSelectEmail={handleItemSelect}
                onStatCardClick={handleStatCardClick} 
              />;
          case 'contacts':
              return <Contacts 
                contacts={contacts}
                mailingLists={mailingLists}
                onAddContact={handleAddContact}
                onAddMailingList={handleAddMailingList}
                onOpenBulkSendModal={handleOpenBulkSendModal}
                onOpenImportModal={handleOpenImportModal}
              />;
          case 'templates':
              return <TemplatesView templates={templates} />;
          case 'settings':
              return <SettingsView />;
          case 'inbox':
          default:
              return renderInboxView();
      }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans text-slate-900 dark:text-slate-200 relative">
      <ToastContainer notifications={notifications} />
       <div className="absolute top-4 right-6 z-30">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_USER_MENU' })}
            onBlur={() => setTimeout(() => dispatch({ type: 'CLOSE_USER_MENU' }), 200)}
            className="flex items-center gap-2 p-2 bg-white dark:bg-slate-800 rounded-full shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-8 bg-primary-200 dark:bg-primary-800 rounded-full flex items-center justify-center font-bold text-primary-600 dark:text-primary-200">
                {currentUser.initials}
            </div>
            <span className="font-semibold text-sm pr-2 hidden md:block">{currentUser.name}</span>
          </button>
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5">
              {state.collaborators.map(user => (
                <button
                  key={user.id}
                  onClick={() => dispatch({ type: 'SET_CURRENT_USER', payload: user })}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-3"
                >
                   <div className="w-6 h-6 bg-primary-200 dark:bg-primary-800 rounded-full flex items-center justify-center font-bold text-xs text-primary-600 dark:text-primary-200">
                      {user.initials}
                   </div>
                  {user.name}
                  {currentUser.id === user.id && <CheckCircleIcon className="w-5 h-5 text-primary-500 ml-auto"/>}
                </button>
              ))}
            </div>
          )}
        </div>
       {view === 'inbox' && bulkSelectedIds.length > 0 && (
            <div className="bg-slate-800 text-white p-3 flex items-center justify-between shadow-lg z-10 flex-shrink-0">
                <span className="font-medium">{bulkSelectedIds.length}件のメールを選択中</span>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => dispatch({ type: 'BULK_UPDATE_EMAIL_STATUS', payload: { status: EmailStatus.Replied, user: currentUser } })}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-green-600 hover:bg-green-700 transition-colors"
                    >
                        <CheckCircleIcon className="w-4 h-4"/>
                        返信済みにする
                    </button>
                    <button 
                        onClick={() => dispatch({ type: 'SET_BULK_SELECTED_IDS', payload: [] })}
                        className="text-sm font-semibold hover:text-slate-300"
                    >
                        キャンセル
                    </button>
                </div>
            </div>
        )}
      <div className="flex flex-1 overflow-hidden">
        <nav className="flex flex-col bg-white dark:bg-slate-800/50 border-r border-slate-200 dark:border-slate-700 p-2 space-y-2 w-24">
            <div className="p-3 mb-2 flex justify-center">
                <SparklesIcon className="w-8 h-8 mx-auto text-primary-500" />
            </div>
            <NavItem icon={<InboxIcon className="w-6 h-6 mx-auto"/>} label="受信トレイ" isActive={view === 'inbox'} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'inbox' })} />
            <NavItem icon={<ChartBarIcon className="w-6 h-6 mx-auto"/>} label="ダッシュボード" isActive={view === 'dashboard'} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })} />
            <NavItem icon={<UsersIcon className="w-6 h-6 mx-auto"/>} label="連絡先" isActive={view === 'contacts'} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'contacts' })} />
            <NavItem icon={<DocumentTextIcon className="w-6 h-6 mx-auto"/>} label="テンプレート" isActive={view === 'templates'} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'templates' })} />
            <NavItem icon={<Cog6ToothIcon className="w-6 h-6 mx-auto"/>} label="設定" isActive={view === 'settings'} onClick={() => dispatch({ type: 'SET_VIEW', payload: 'settings' })} />
        </nav>
        <main className="flex flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900">
            {renderView()}
        </main>
      </div>
      <BulkSendModal 
        isOpen={isBulkSendModalOpen} 
        onClose={handleCloseBulkSendModal}
      />
       <ImportContactsModal
        isOpen={isImportModalOpen}
        mailingLists={mailingLists}
        onClose={handleCloseImportModal}
        onImport={handleImportContacts}
      />
    </div>
  );
};

export default App;