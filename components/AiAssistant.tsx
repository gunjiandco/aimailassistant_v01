

import React, { useState, useEffect, useCallback } from 'react';
import { Email, EmailStatus, AiAnalysisResult, SuggestedTask, TaskStatus, TaskType } from '../types';
import { analyzeEmail } from '../services/geminiService';
import Tag from './Tag';
import SparklesIcon from './icons/SparklesIcon';
import ReplyComposer from './ReplyComposer';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import CustomSelect, { CustomSelectOption } from './CustomSelect';
import ClockIcon from './icons/ClockIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';


interface AiAssistantProps {
  email: Email | null;
}

const AiAssistantSkeleton: React.FC = () => (
  <div className="p-4 animate-pulse">
    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
    <div className="mb-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
    </div>
    <div className="mb-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2"></div>
      <div className="flex gap-2">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-16"></div>
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div>
      </div>
    </div>
     <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/5 mb-3"></div>
        <div className="h-14 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
    </div>
    <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-2/5 mb-3"></div>
        <div className="flex gap-2">
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-md flex-grow"></div>
            <div className="h-9 bg-slate-200 dark:bg-slate-700 rounded-md w-20"></div>
        </div>
    </div>
  </div>
);


const AiAssistant: React.FC<AiAssistantProps> = ({ email }) => {
  const { currentUser } = useAppState();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AiAnalysisResult | null>(null);
  const [addedTaskTitles, setAddedTaskTitles] = useState<string[]>([]);

  
  const onUpdateStatus = (id: string, status: EmailStatus) => {
    dispatch({ type: 'UPDATE_EMAIL_STATUS', payload: { id, status, user: currentUser } });
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'ステータスを更新しました', type: 'info' } });
  };
  
  const onUpdateEmailAnalysis = useCallback((id: string, analysisResult: AiAnalysisResult) => {
    dispatch({ type: 'UPDATE_EMAIL_ANALYSIS', payload: { id, analysis: analysisResult, user: currentUser } });
  }, [dispatch, currentUser]);


  const fetchAnalysis = useCallback(async () => {
    if (!email) return;
    setIsLoading(true);
    setAnalysis(null);
    const result = await analyzeEmail(email);
    setAnalysis(result);
    if(result){
      onUpdateEmailAnalysis(email.id, result);
    }
    setIsLoading(false);
  }, [email, onUpdateEmailAnalysis]);

  useEffect(() => {
    setAddedTaskTitles([]);
    if (email && (email.aiTags === undefined || email.suggestedTasks === undefined)) {
        fetchAnalysis();
    } else {
        setIsLoading(false);
        if (email) {
            setAnalysis({ status: email.status, tags: email.aiTags || [], suggestedTasks: email.suggestedTasks || [] });
        }
    }
  }, [email, fetchAnalysis]);
  
  const handleAddTask = (task: SuggestedTask) => {
    if (!email) return;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1); // Due tomorrow

    dispatch({
        type: 'ADD_TASK',
        payload: {
            title: task.title,
            details: task.details,
            dueDate: dueDate.toISOString().split('T')[0],
            status: TaskStatus.Todo,
            type: TaskType.Manual,
            relatedEmailId: email.id,
        }
    });
    
    dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { message: `タスク「${task.title}」を追加しました`, type: 'success' }
    });

    setAddedTaskTitles(prev => [...prev, task.title]);
};

  const statusOptions: CustomSelectOption[] = [
    { value: EmailStatus.NeedsReply, label: EmailStatus.NeedsReply, icon: <ClockIcon className="w-5 h-5 text-amber-500" /> },
    { value: EmailStatus.Replied, label: EmailStatus.Replied, icon: <CheckCircleIcon className="w-5 h-5 text-green-500" /> },
    { value: EmailStatus.InfoReceived, label: EmailStatus.InfoReceived, icon: <ExclamationCircleIcon className="w-5 h-5 text-blue-500" /> },
    { value: EmailStatus.Archived, label: EmailStatus.Archived, icon: <ArchiveBoxIcon className="w-5 h-5 text-slate-500" /> },
  ];
  
  const suggestedTasks = analysis?.suggestedTasks || [];
  const filteredTasks = suggestedTasks.filter(task => !addedTaskTitles.includes(task.title));


  if (!email) {
    return (
      <div className="w-full md:w-1/3 p-6 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 h-full">
        <SparklesIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
        <h3 className="mt-4 text-lg font-medium text-slate-800 dark:text-slate-200">AIアシスタント</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">受信メールを選択すると、AIによる分析情報やアクションが表示されます。</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
        <div className="w-full md:w-1/3 bg-white dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto">
            <AiAssistantSkeleton />
        </div>
    );
  }

  return (
    <div className="w-full md:w-1/3 bg-white dark:bg-slate-800/50 border-l border-slate-200 dark:border-slate-700 h-full overflow-y-auto p-4">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
        <SparklesIcon className="w-6 h-6 text-primary-500" />
        AIアシスタント
      </h2>
      
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">ステータス</label>
        <div className="mt-1">
          <CustomSelect
              value={email.status}
              onChange={(newStatus) => onUpdateStatus(email.id, newStatus as EmailStatus)}
              options={statusOptions}
          />
        </div>
        {analysis?.status && analysis.status !== email.status && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                AIによる推奨ステータス: <button onClick={() => onUpdateStatus(email.id, analysis.status!)} className="font-bold text-primary-600 dark:text-primary-400 hover:underline">{analysis.status}</button>
            </p>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">AIによる生成タグ</h3>
        {email.aiTags && email.aiTags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
                {email.aiTags.map(tag => <Tag key={tag} type="keyword" text={tag} />)}
            </div>
        ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">タグの提案はありません。</p>
        )}
      </div>
      
      <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-4">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <ClipboardDocumentListIcon className="w-5 h-5" />
            AIによるタスク提案
        </h3>
        {filteredTasks.length > 0 ? (
            <div className="space-y-2 mt-2">
              {filteredTasks.map(task => (
                <div key={task.title} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg animate-fade-in-up">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{task.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{task.details}</p>
                  <button
                    onClick={() => handleAddTask(task)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-semibold text-primary-600 rounded-md bg-primary-100 hover:bg-primary-200 dark:text-primary-200 dark:bg-primary-900/50 dark:hover:bg-primary-800 transition-colors"
                  >
                    <PlusCircleIcon className="w-4 h-4" />
                    タスクに追加
                  </button>
                </div>
              ))}
            </div>
        ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">タスクの提案はありません。</p>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-600 pt-4 mt-4">
        <ReplyComposer email={email} />
      </div>

    </div>
  );
};

export default AiAssistant;
