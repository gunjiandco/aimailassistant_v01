

import React, { useState, useMemo } from 'react';
import { Email, EmailStatus, Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import InboxIcon from './icons/InboxIcon';
import EyeIcon from './icons/EyeIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import MiniCalendar from './MiniCalendar';
import PencilSquareIcon from './icons/PencilSquareIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';


interface DashboardAndTasksProps {
  emails: Email[];
  tasks: Task[];
  onAddTask: (title: string, details: string, dueDate: string) => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateTask: (taskId: string, updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate'>>) => void;
  onDeleteTask: (taskId: string) => void;
  onSelectEmail: (emailId: string) => void;
  onStatCardClick: (status: EmailStatus) => void;
}

// --- Dashboard Sub-components ---
const statusConfig = {
    [EmailStatus.NeedsReply]: { icon: ClockIcon, color: 'border-amber-500', text: 'text-amber-500', bg: 'bg-amber-500' },
    [EmailStatus.Drafting]: { icon: PencilSquareIcon, color: 'border-slate-500', text: 'text-slate-500', bg: 'bg-slate-500' },
    [EmailStatus.Reviewing]: { icon: EyeIcon, color: 'border-purple-500', text: 'text-purple-500', bg: 'bg-purple-500' },
    [EmailStatus.Approved]: { icon: ShieldCheckIcon, color: 'border-teal-500', text: 'text-teal-500', bg: 'bg-teal-500' },
    [EmailStatus.Replied]: { icon: CheckCircleIcon, color: 'border-green-500', text: 'text-green-500', bg: 'bg-green-500' },
    [EmailStatus.InfoReceived]: { icon: ExclamationCircleIcon, color: 'border-blue-500', text: 'text-blue-500', bg: 'bg-blue-500' },
    [EmailStatus.Archived]: { icon: InboxIcon, color: 'border-gray-500', text: 'text-gray-500', bg: 'bg-gray-500' },
};

const StatCard: React.FC<{ title: string; count: number; status: EmailStatus; total: number; onClick: () => void; }> = ({ title, count, status, total, onClick }) => {
    const config = statusConfig[status];
    if (!config) return null;
    const Icon = config.icon;
    const percentage = total > 0 ? (count / total) * 100 : 0;

    return (
        <button
            onClick={onClick}
            className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex flex-col justify-between border-l-4 ${config.color} text-left transition-transform duration-200 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-100 dark:focus:ring-offset-slate-900`}
        >
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-500 dark:text-slate-400">{title}</h3>
                    <Icon className={`w-6 h-6 ${config.text}`} />
                </div>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">{count}</p>
            </div>
            <div className="mt-4">
                <div className="flex justify-between mb-1">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">全体に対する割合</span>
                    <span className={`text-xs font-bold ${config.text}`}>{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div className={`${config.bg}`} style={{ width: `${percentage}%`, height: '100%', borderRadius: 'inherit', transition: 'width 0.5s ease-in-out' }}></div>
                </div>
            </div>
        </button>
    );
};


// --- Task Sub-components ---
const CollapsibleTaskList: React.FC<{
    title: string;
    tasks: Task[];
    onUpdateTaskStatus: (id: string, status: TaskStatus) => void;
    onUpdateTask: (id: string, updates: Partial<Pick<Task, 'title' | 'details' | 'dueDate'>>) => void;
    onDeleteTask: (id: string) => void;
    onSelectEmail: (emailId: string) => void;
    defaultOpen?: boolean;
}> = ({ title, tasks, onUpdateTaskStatus, onUpdateTask, onDeleteTask, onSelectEmail, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    if (tasks.length === 0 && !defaultOpen) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left"
            >
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">{title} ({tasks.length})</h2>
                <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0">
                    {tasks.length > 0 ? (
                        <div className="space-y-3">
                            {tasks.map(task => <TaskCard key={task.id} task={task} onUpdateStatus={onUpdateTaskStatus} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onSelectEmail={onSelectEmail} />)}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">このカテゴリのタスクはありません。</p>
                    )}
                </div>
            )}
        </div>
    );
};

const DashboardAndTasks: React.FC<DashboardAndTasksProps> = ({ emails, tasks, onAddTask, onUpdateTaskStatus, onUpdateTask, onDeleteTask, onSelectEmail, onStatCardClick }) => {
    const [title, setTitle] = useState('');
    const [details, setDetails] = useState('');
    const [dueDate, setDueDate] = useState('');

    const statusCounts = useMemo(() => {
        const counts = Object.fromEntries(
          Object.values(EmailStatus).map(s => [s, 0])
        ) as { [key in EmailStatus]: number };
        
        emails.forEach(email => {
            if (counts[email.status] !== undefined) {
                counts[email.status]++;
            }
        });
        return counts;
    }, [emails]);

    const { overdue, today, upcoming, done } = useMemo(() => {
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
        const lists = { overdue: [] as Task[], today: [] as Task[], upcoming: [] as Task[], done: tasks.filter(t => t.status === TaskStatus.Done) };
        tasks.filter(t => t.status === TaskStatus.Todo).forEach(task => {
            const taskDueDate = new Date(task.dueDate + 'T00:00:00');
            if (taskDueDate < todayStart) { lists.overdue.push(task); } 
            else if (taskDueDate <= todayEnd) { lists.today.push(task); } 
            else { lists.upcoming.push(task); }
        });
        const sortByDueDate = (a: Task, b: Task) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        lists.overdue.sort(sortByDueDate);
        lists.upcoming.sort(sortByDueDate);
        lists.done.sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
        return lists;
    }, [tasks]);

    const handleSubmitTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !dueDate) return;
        onAddTask(title, details, dueDate);
        setTitle(''); setDetails(''); setDueDate('');
    };

    const totalEmails = emails.length;

    return (
        <div className="flex-1 bg-slate-100 dark:bg-slate-900 h-full overflow-y-auto px-6 pb-6 pt-20">
            <div className="flex items-center gap-3 mb-6">
                <ChartBarIcon className="w-8 h-8 text-primary-500" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">ダッシュボード</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">ステータスサマリー</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Object.entries(statusCounts).map(([status, count]) => (
                                <StatCard
                                    key={status}
                                    title={status}
                                    count={count}
                                    status={status as EmailStatus}
                                    total={totalEmails}
                                    onClick={() => onStatCardClick(status as EmailStatus)}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <CollapsibleTaskList title="期限切れ" tasks={overdue} onUpdateTaskStatus={onUpdateTaskStatus} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onSelectEmail={onSelectEmail} defaultOpen={true} />
                        <CollapsibleTaskList title="本日が期日" tasks={today} onUpdateTaskStatus={onUpdateTaskStatus} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onSelectEmail={onSelectEmail} defaultOpen={true}/>
                        <CollapsibleTaskList title="今後のタスク" tasks={upcoming} onUpdateTaskStatus={onUpdateTaskStatus} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onSelectEmail={onSelectEmail} />
                        <CollapsibleTaskList title="完了済み" tasks={done} onUpdateTaskStatus={onUpdateTaskStatus} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask} onSelectEmail={onSelectEmail} />
                    </div>
                </div>

                <div className="space-y-6">
                    <MiniCalendar tasks={tasks} />
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">タスクを追加</h2>
                        <form onSubmit={handleSubmitTask} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300">タイトル</label>
                                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="例: スポンサーへのフォローアップ" className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required/>
                            </div>
                            <div>
                                <label htmlFor="details" className="block text-sm font-medium text-slate-700 dark:text-slate-300">詳細 (任意)</label>
                                <textarea id="details" value={details} onChange={e => setDetails(e.target.value)} rows={2} placeholder="タスクに関する補足情報..." className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"/>
                            </div>
                            <div className="flex items-end gap-4">
                               <div className="flex-1">
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300">期日</label>
                                    <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" required/>
                                </div>
                                <button type="submit" className="px-4 py-2 h-10 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:bg-slate-400">追加</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardAndTasks;
