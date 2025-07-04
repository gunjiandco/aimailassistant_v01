
import React, { useState } from 'react';
import { Template } from '../types';
import DocumentTextIcon from './icons/DocumentTextIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import TrashIcon from './icons/TrashIcon';
import TemplateEditorModal from './TemplateEditorModal';
import { useAppDispatch } from '../contexts/AppContext';
import Tag from './Tag';

interface TemplatesViewProps {
  templates: Template[];
}

const TemplatesView: React.FC<TemplatesViewProps> = ({ templates }) => {
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const handleOpenModal = (template: Template | null = null) => {
    setEditingTemplate(template);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
      if (window.confirm('このテンプレートを本当に削除しますか？')) {
          dispatch({ type: 'DELETE_TEMPLATE', payload: id });
          dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'テンプレートを削除しました', type: 'info' } });
      }
  }

  return (
    <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-full overflow-y-auto px-6 pb-6 pt-20">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-8 h-8 text-primary-500" />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">メールテンプレート管理</h1>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
        >
          新規テンプレート作成
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm text-left text-slate-500 dark:text-slate-400">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-6 py-3">タイトル</th>
              <th scope="col" className="px-6 py-3">本文プレビュー</th>
              <th scope="col" className="px-6 py-3">最終更新</th>
              <th scope="col" className="px-6 py-3 text-right">アクション</th>
            </tr>
          </thead>
          <tbody>
            {templates.map(template => (
              <tr key={template.id} className="bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600">
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white align-top">
                   <div>{template.title}</div>
                   {template.tags && template.tags.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-2">
                           {template.tags.map(tag => (
                               <Tag key={tag} type="keyword" text={tag} />
                           ))}
                       </div>
                   )}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-md truncate align-top">{template.body.replace(/<[^>]*>?/gm, ' ')}</td>
                <td className="px-6 py-4 align-top">
                    <div className="text-sm text-slate-800 dark:text-slate-200">{new Date(template.updatedAt).toLocaleDateString('ja-JP')}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{template.lastModifiedBy}</div>
                </td>
                <td className="px-6 py-4 text-right space-x-2 align-top">
                  <button onClick={() => handleOpenModal(template)} className="p-2 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700">
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => handleDelete(template.id)} className="p-2 rounded-md text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50">
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
             {templates.length === 0 && (
                <tr>
                    <td colSpan={4} className="text-center p-6 text-slate-500 dark:text-slate-400">
                        テンプレートがありません。
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <TemplateEditorModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        template={editingTemplate}
      />
    </div>
  );
};

export default TemplatesView;