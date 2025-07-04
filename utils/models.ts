

import { Task, Template, Collaborator, SentEmail, Contact, MailingList, Draft, Sender, Attachment } from '../types';
import { generateId } from './helpers';

export const createTask = (taskData: Omit<Task, 'id'>): Task => ({
  id: generateId('task'),
  ...taskData,
});

export const createTemplate = (
  templateData: Pick<Template, 'title' | 'body' | 'tags'>,
  user: Collaborator
): Template => {
  const now = new Date().toISOString();
  return {
    id: generateId('tmpl'),
    ...templateData,
    createdAt: now,
    createdBy: user.name,
    updatedAt: now,
    lastModifiedBy: user.name,
  };
};

export const createSentEmail = (
  draft: Omit<SentEmail, 'id' | 'timestamp' | 'sentBy'>,
  user: Collaborator,
  threadId: string
): SentEmail => {
  const now = new Date().toISOString();
  return {
    id: generateId('sent'),
    timestamp: now,
    ...draft,
    threadId,
    sentBy: user.name,
    updatedAt: now,
    lastModifiedBy: user.name,
  };
};

export const createContact = (contactData: Omit<Contact, 'id'>): Contact => ({
  id: generateId('contact'),
  ...contactData,
});

export const createMailingList = (name: string): MailingList => ({
  id: generateId('ml'),
  name,
  contactIds: [],
});

export const createDraft = (
    email: { sender: Sender, cc?: Sender[], subject: string, body: string, attachments?: Attachment[] },
    replyData: { to: Sender[], cc: Sender[], bcc: Sender[], subject: string, body: string, attachments: Attachment[] }
): Draft => ({
    recipients: replyData.to,
    cc: replyData.cc,
    bcc: replyData.bcc,
    subject: replyData.subject,
    body: replyData.body,
    attachments: replyData.attachments,
});