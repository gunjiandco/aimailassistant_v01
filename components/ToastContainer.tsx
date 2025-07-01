
import React from 'react';
import { Notification } from '../types';
import Toast from './Toast';

interface ToastContainerProps {
  notifications: Notification[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ notifications }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-3">
      {notifications.map(notification => (
        <Toast key={notification.id} notification={notification} />
      ))}
    </div>
  );
};

export default ToastContainer;
