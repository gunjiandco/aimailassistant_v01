
export enum EmailStatus {
  NeedsReply = '要返信',
  Replied = '返信済み',
  InfoReceived = '情報受領',
  Archived = '対応済み',
  Reviewing = 'レビュー中',
  Drafting = '作成中',
  Approved = '承認済み',
}

export interface Sender {
  name: string;
  email: string;
}

export interface Attachment {
  name: string;
  url: string; // In a real app, this might be a temporary signed URL
}

export interface Draft {
  recipients: Sender[];
  cc?: Sender[];
  bcc?: Sender[];
  subject: string;
  body: string;
  attachments?: Attachment[];
}

export interface Email {
  id: string;
  displayId: string;
  sender: Sender;
  cc?: Sender[];
  subject: string;
  body: string;
  timestamp: string;
  status: EmailStatus;
  threadId: string;
  aiTags?: string[]; // AIによって生成されたタグ
  suggestedTasks?: SuggestedTask[]; // AIによって提案されたタスク
  attachments?: Attachment[];
  updatedAt?: string; // ISO string for last update
  lastModifiedBy?: string; // Collaborator name
  draft?: Draft; // 下書き
}

export interface SentEmail {
  id: string;
  recipients: Sender[];
  cc?: Sender[];
  bcc?: Sender[];
  subject: string;
  body: string;
  timestamp: string;
  inReplyTo?: string; // ID of the email being replied to
  threadId: string;
  attachments?: Attachment[];
  sentBy: string; // Name of the collaborator who sent it
  updatedAt?: string; // ISO string for last update
  lastModifiedBy?: string; // Collaborator name
}

export interface SuggestedTask {
  title: string;
  details: string;
}

export interface AiAnalysisResult {
    status: EmailStatus;
    tags: string[];
    suggestedTasks?: SuggestedTask[];
}

export interface Contact {
  id:string;
  name: string;
  email: string;
  affiliation?: string;
  requiredCc?: string[];
}

export interface MailingList {
  id: string;
  name: string;
  contactIds: string[];
}

export interface BulkDraft {
  subject: string;
  body: string;
}

export enum TaskStatus {
  Todo = '未完了',
  Done = '完了',
}

export enum TaskType {
  Manual = '手動',
  AutoReminder = '自動リマインダー'
}

export interface Task {
  id: string;
  title: string;
  details: string;
  dueDate: string; // ISO string date
  status: TaskStatus;
  type: TaskType;
  relatedEmailId?: string;
}

export interface Template {
  id: string;
  title: string;
  body: string;
  tags?: string[];
  createdAt: string; // ISO string
  createdBy: string; // Collaborator name
  updatedAt: string; // ISO string
  lastModifiedBy: string; // Collaborator name
}

export interface Collaborator {
  id: string;
  name: string;
  initials: string;
}

export interface Notification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export interface AppSettings {
  eventName: string;
  websiteUrl: string;
  officeName: string;
  eventSummary: string;
  signature: string;
  communicationStyle: '非常に丁寧' | '丁寧' | 'ややカジュアル';
  knowledgeBase: Array<{ id: string; key: string; value: string; }>;
}