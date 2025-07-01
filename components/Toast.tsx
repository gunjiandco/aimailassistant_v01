
import React, { useEffect } from 'react';
import { Notification } from '../types';
import { useAppDispatch } from '../contexts/AppContext';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import XMarkIcon from './icons/XMarkIcon';

interface ToastProps {
  notification: Notification;
}

const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    bg: 'bg-green-50 dark:bg-green-900/50',
    iconColor: 'text-green-500 dark:text-green-400',
    textColor: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: ExclamationCircleIcon,
    bg: 'bg-red-50 dark:bg-red-900/50',
    iconColor: 'text-red-500 dark:text-red-400',
    textColor: 'text-red-800 dark:text-red-200',
  },
  info: {
    icon: InformationCircleIcon,
    bg: 'bg-blue-50 dark:bg-blue-900/50',
    iconColor: 'text-blue-500 dark:text-blue-400',
    textColor: 'text-blue-800 dark:text-blue-200',
  },
};

const Toast: React.FC<ToastProps> = ({ notification }) => {
  const dispatch = useAppDispatch();
  const { id, message, type } = notification;

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
    }, 5000); // 5 seconds

    return () => {
      clearTimeout(timer);
    };
  }, [id, dispatch]);

  const handleClose = () => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start p-4 w-full rounded-lg shadow-lg ${config.bg} animate-fade-in-up`}>
      <div className="flex-shrink-0">
        <Icon className={`w-6 h-6 ${config.iconColor}`} aria-hidden="true" />
      </div>
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className={`text-sm font-medium ${config.textColor}`}>{message}</p>
      </div>
      <div className="ml-4 flex-shrink-0 flex">
        <button
          className="inline-flex rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          onClick={handleClose}
        >
          <span className="sr-only">Close</span>
          <XMarkIcon className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
