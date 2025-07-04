
import React from 'react';
import { Email, EmailStatus } from '../types';
import { useAppDispatch, useAppState } from '../contexts/AppContext';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface WorkflowStepperProps {
  email: Email;
}

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ email }) => {
  const dispatch = useAppDispatch();
  const { currentUser } = useAppState();

  const handleUpdateStatus = (status: EmailStatus) => {
    dispatch({ type: 'UPDATE_EMAIL_STATUS', payload: { id: email.id, status, user: currentUser } });
  };

  const steps = [
    { status: EmailStatus.Drafting, label: '作成中' },
    { status: EmailStatus.Reviewing, label: 'レビュー中' },
    { status: EmailStatus.Approved, label: '承認済み' },
  ];

  const currentStepIndex = steps.findIndex(step => step.status === email.status);

  if (currentStepIndex === -1) {
    return null;
  }

  return (
    <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg mb-4 animate-fade-in-up">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">返信ワークフロー</h3>
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isFuture = index > currentStepIndex;

          return (
            <React.Fragment key={step.status}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isCurrent ? 'bg-primary-500 border-primary-500 text-white animate-pulse' : ''}
                    ${isFuture ? 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600' : ''}
                  `}
                >
                  {isCompleted ? <CheckCircleIcon className="w-5 h-5" /> : index + 1}
                </div>
                <p
                  className={`mt-1 text-xs text-center font-semibold
                    ${isCurrent ? 'text-primary-600 dark:text-primary-300' : 'text-slate-500 dark:text-slate-400'}
                  `}
                >
                  {step.label}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5
                    ${isCompleted || isCurrent ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {email.status === EmailStatus.Drafting && (
          <button
            onClick={() => handleUpdateStatus(EmailStatus.Reviewing)}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700"
          >
            レビューへ進める
          </button>
        )}
        {email.status === EmailStatus.Reviewing && (
          <>
            <button
              onClick={() => handleUpdateStatus(EmailStatus.Drafting)}
              className="px-4 py-1.5 text-sm font-semibold text-slate-700 bg-white dark:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600"
            >
              差し戻す
            </button>
            <button
              onClick={() => handleUpdateStatus(EmailStatus.Approved)}
              className="px-4 py-1.5 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700"
            >
              承認する
            </button>
          </>
        )}
        {email.status === EmailStatus.Approved && (
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            承認済みです。メールを送信できます。
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkflowStepper;
