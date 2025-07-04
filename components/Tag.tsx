
import React from 'react';
import { EmailStatus } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ClockIcon from './icons/ClockIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import EyeIcon from './icons/EyeIcon';
import PencilSquareIcon from './icons/PencilSquareIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface TagProps {
  type: 'status' | 'keyword';
  text: string;
}

const statusStyles: { [key in EmailStatus]: { bg: string; text: string; icon: React.ReactNode } } = {
  [EmailStatus.NeedsReply]: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-800 dark:text-amber-200', icon: <ClockIcon className="w-4 h-4" /> },
  [EmailStatus.Replied]: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: <CheckCircleIcon className="w-4 h-4" /> },
  [EmailStatus.InfoReceived]: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', icon: <ExclamationCircleIcon className="w-4 h-4" /> },
  [EmailStatus.Reviewing]: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', icon: <EyeIcon className="w-4 h-4" /> },
  [EmailStatus.Drafting]: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: <PencilSquareIcon className="w-4 h-4" /> },
  [EmailStatus.Approved]: { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-800 dark:text-teal-200', icon: <ShieldCheckIcon className="w-4 h-4" /> },
  [EmailStatus.Archived]: { bg: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: null },
};

const Tag: React.FC<TagProps> = ({ type, text }) => {
  if (type === 'status') {
    const style = statusStyles[text as EmailStatus] || statusStyles[EmailStatus.Archived];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>
        {style.icon}
        {text}
      </span>
    );
  }

  return (
    <span className="inline-block bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 text-xs font-medium rounded-md">
      # {text}
    </span>
  );
};

export default Tag;