
import React, { useState, useMemo } from 'react';
import { Contact, MailingList } from '../types';
import UsersIcon from './icons/UsersIcon';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import ArrowUpTrayIcon from './icons/ArrowUpTrayIcon';

interface ContactsProps {
  contacts: Contact[];
  mailingLists: MailingList[];
  onAddContact: (listId: string, name: string, email: string, affiliation: string, requiredCc: string[]) => void;
  onAddMailingList: (name: string) => void;
  onOpenBulkSendModal: () => void;
  onOpenImportModal: () => void;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, mailingLists, onAddContact, onAddMailingList, onOpenBulkSendModal, onOpenImportModal }) => {
  const [selectedListId, setSelectedListId] = useState<string | null>(mailingLists[0]?.id || null);
  const [newListName, setNewListName] = useState('');
  const [newContactName, setNewContactName] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactAffiliation, setNewContactAffiliation] = useState('');
  const [newContactCc, setNewContactCc] = useState('');

  const selectedList = mailingLists.find(l => l.id === selectedListId);
  const contactsInList = useMemo(() => {
    return selectedList ? contacts.filter(c => selectedList.contactIds.includes(c.id)) : [];
  }, [selectedList, contacts]);

  const handleAddList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onAddMailingList(newListName.trim());
      setNewListName('');
    }
  };

  const handleAddContactForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedListId && newContactName.trim() && newContactEmail.trim()) {
        const ccList = newContactCc.split(',').map(e => e.trim()).filter(e => e);
        onAddContact(selectedListId, newContactName.trim(), newContactEmail.trim(), newContactAffiliation.trim(), ccList);
        setNewContactName('');
        setNewContactEmail('');
        setNewContactAffiliation('');
        setNewContactCc('');
    }
  };


  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-full overflow-y-auto px-6 pb-6 pt-20">
       <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">連絡先とメーリングリスト</h1>
        </div>
        <button 
          onClick={onOpenBulkSendModal} 
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
            <PaperAirplaneIcon className="w-5 h-5"/>
            パーソナライズ一括送信
        </button>
      </div>
      <div className="flex flex-col md:flex-row gap-6 h-full">
        {/* Mailing Lists Panel */}
        <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">メーリングリスト</h2>
            <button onClick={onOpenImportModal} className="flex items-center gap-1.5 px-3 py-1 text-sm font-semibold text-primary-600 rounded-md hover:bg-primary-100 dark:text-primary-400 dark:hover:bg-primary-900/50">
              <ArrowUpTrayIcon className="w-4 h-4" />
              インポート
            </button>
          </div>
          <form onSubmit={handleAddList} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="新しいリスト名"
              className="flex-grow px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400" disabled={!newListName.trim()}>追加</button>
          </form>
          <ul className="space-y-2">
            {mailingLists.map(list => (
              <li key={list.id}>
                <button 
                    onClick={() => setSelectedListId(list.id)}
                    className={`w-full text-left p-2 rounded-md transition-colors text-sm ${selectedListId === list.id ? 'bg-primary-100 text-primary-700 font-semibold dark:bg-primary-900/50 dark:text-primary-200' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                >
                    {list.name} ({list.contactIds.length})
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacts Panel */}
        <div className="w-full md:w-2/3 bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col">
          {selectedList ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">「{selectedList.name}」の連絡先</h2>
              </div>
              <form onSubmit={handleAddContactForm} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                 <input 
                    type="text" 
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="氏名"
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                    />
                 <input 
                    type="email" 
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="メールアドレス"
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    required
                    />
                <input 
                    type="text" 
                    value={newContactAffiliation}
                    onChange={(e) => setNewContactAffiliation(e.target.value)}
                    placeholder="所属・会社名"
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                 <input 
                    type="text" 
                    value={newContactCc}
                    onChange={(e) => setNewContactCc(e.target.value)}
                    placeholder="CC (例: manager@mail.com)"
                    className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                    />
                <button type="submit" className="sm:col-span-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400" disabled={!newContactName.trim() || !newContactEmail.trim()}>連絡先を追加</button>
              </form>
              <div className="overflow-y-auto flex-grow">
                <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400 sticky top-0">
                        <tr>
                            <th scope="col" className="px-6 py-3">氏名</th>
                            <th scope="col" className="px-6 py-3">所属</th>
                            <th scope="col" className="px-6 py-3">メール</th>
                            <th scope="col" className="px-6 py-3">必須CC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {contactsInList.map(contact => (
                            <tr key={contact.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                                <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap dark:text-white">{contact.name}</td>
                                <td className="px-6 py-4">{contact.affiliation || <span className="text-slate-400 dark:text-slate-500">なし</span>}</td>
                                <td className="px-6 py-4">{contact.email}</td>
                                <td className="px-6 py-4">{contact.requiredCc && contact.requiredCc.length > 0 ? contact.requiredCc.join(', ') : <span className="text-slate-400 dark:text-slate-500">なし</span>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {contactsInList.length === 0 && <p className="text-center text-slate-500 dark:text-slate-400 p-4">このリストにはまだ連絡先がありません。</p>}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500">メーリングリストを選択して連絡先を表示してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contacts;