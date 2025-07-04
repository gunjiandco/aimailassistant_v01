

import React, { useState } from 'react';
import { Task, TaskStatus, TaskType } from '../types';
import PencilSquareIcon from './icons/PencilSquareIcon';
import TrashIcon from './icons/TrashIcon';

interface TaskCardProps {
    task: Task;
    onUpdateStatus: (id: string, status: TaskStatus) => void;
    onUpdateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate'>>) => void;
    onDeleteTask: (id: string) => void;
    onSelectEmail: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdateStatus, onUpdateTask, onDeleteTask, onSelectEmail }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const [editedDetails, setEditedDetails] = useState(task.details);
    const [editedDueDate, setEditedDueDate] = useState(task.dueDate);

    const isDone = task.status === TaskStatus.Done;
    const isOverdue = !isDone && new Date(task.dueDate) < new Date(new Date().setHours(0, 0, 0, 0));

    const handleSave = () => {
        if (!editedTitle.trim() || !editedDueDate) {
            alert('タイトルと期日は必須です。');
            return;
        }
        onUpdateTask(task.id, {
            title: editedTitle,
            details: editedDetails,
            dueDate: editedDueDate
        });
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditedTitle(task.title);
        setEditedDetails(task.details);
        setEditedDueDate(task.dueDate);
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDeleteTask(task.id);
    };

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg ring-2 ring-primary-500 space-y-3 animate-fade-in-up">
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">タイトル</label>
                    <input
                        type="text"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="mt-1 w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">詳細</label>
                    <textarea
                        value={editedDetails}
                        onChange={(e) => setEditedDetails(e.target.value)}
                        rows={2}
                        className="mt-1 w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    />
                </div>
                <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400">期日</label>
                    <input
                        type="date"
                        value={editedDueDate}
                        onChange={(e) => setEditedDueDate(e.target.value)}
                        className="mt-1 w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={handleCancel} className="px-3 py-1 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600">
                        キャンセル
                    </button>
                    <button onClick={handleSave} className="px-3 py-1 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700">
                        保存
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-start gap-4 transition-opacity ${isDone ? 'opacity-60' : ''}`}>
            <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 mt-1 flex-shrink-0"
                checked={isDone}
                onChange={() => onUpdateStatus(task.id, isDone ? TaskStatus.Todo : TaskStatus.Done)}
                disabled={isEditing}
            />
            <div className="flex-1">
                <p className={`font-semibold text-slate-800 dark:text-slate-100 ${isDone ? 'line-through' : ''}`}>{task.title}</p>
                {task.details && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{task.details}</p>}
                {task.type === TaskType.AutoReminder && task.relatedEmailId && (
                     <button onClick={() => onSelectEmail(task.relatedEmailId!)} className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1">
                        関連メールを表示
                    </button>
                )}
                <div className="flex items-center justify-between mt-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${task.type === TaskType.Manual ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'}`}>
                        {task.type}
                    </span>
                    <div className="flex items-center gap-1">
                         <span className={`text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                            期日: {new Date(task.dueDate + "T00:00:00").toLocaleDateString('ja-JP')}
                        </span>
                        {!isDone && (
                             <button onClick={() => setIsEditing(true)} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700" title="編集">
                                <PencilSquareIcon className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={handleDelete} className="p-1.5 rounded-md text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-700" title="削除">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskCard;