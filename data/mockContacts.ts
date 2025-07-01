import { Contact, MailingList } from '../types';

export const mockContacts: Contact[] = [
  { id: 'c1', name: '田中 健司', email: 'kenji.tanaka@example.com', affiliation: 'Example Corp', requiredCc: ['manager.tanaka@example.com'] },
  { id: 'c2', name: '佐藤 佑紀', email: 'yuki.sato@example-corp.jp', affiliation: 'Example Corp' },
  { id: 'c3', name: 'マリア・ロドリゲス', email: 'maria.r@web-innovations.com', affiliation: 'Web Innovations' },
  { id: 'c4', name: 'ジョン・ドウ', email: 'john.d@tech-solutions.io', affiliation: 'Tech Solutions', requiredCc: ['sales@tech-solutions.io', 'support@tech-solutions.io'] },
  { id: 'c5', name: 'エミリー・カーター', email: 'emily.carter@creative-designs.net', affiliation: 'Creative Designs' },
  { id: 'c6', name: 'ジェームズ・ハリソン', email: 'james.harrison@creative-designs.net', affiliation: 'Creative Designs', requiredCc: ['emily.carter@creative-designs.net'] },
  { id: 'c7', name: 'スポンサーチーム', email: 'sponsors@example.com', affiliation: 'Sponsor Co.' },
  { id: 'c8', name: 'Next Tokyo Logistics', email: 'logistics@nexttokyo.events', affiliation: 'Gunji Inc.' },
  { id: 'c9', name: '伊藤 文子', email: 'ayako.ito@speaker-group.com', affiliation: 'Speaker Group' },
  { id: 'c10', name: 'デビッド・チェン', email: 'david.chen@speaker-group.com', affiliation: 'Speaker Group' },
];

export const mockMailingLists: MailingList[] = [
  {
    id: 'ml1',
    name: '全参加者',
    contactIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'],
  },
  {
    id: 'ml2',
    name: 'VIPスピーカー',
    contactIds: ['c9', 'c10'],
  },
  {
    id: 'ml3',
    name: 'スポンサー',
    contactIds: ['c7'],
  },
  {
    id: 'ml4',
    name: '内部チーム',
    contactIds: ['c8'],
  },
];