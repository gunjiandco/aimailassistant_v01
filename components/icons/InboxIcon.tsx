
import React from 'react';

const InboxIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.25 2.25v4.5A2.25 2.25 0 0 1 6.11 22.5H2.25a2.25 2.25 0 0 1-2.25-2.25v-4.5A2.25 2.25 0 0 1 2.25 13.5zM8.25 13.5h3.86a2.25 2.25 0 0 1 2.25 2.25v4.5A2.25 2.25 0 0 1 12.11 22.5H8.25a2.25 2.25 0 0 1-2.25-2.25v-4.5A2.25 2.25 0 0 1 8.25 13.5zM14.25 13.5h3.86a2.25 2.25 0 0 1 2.25 2.25v4.5a2.25 2.25 0 0 1-2.25 2.25h-3.86a2.25 2.25 0 0 1-2.25-2.25v-4.5a2.25 2.25 0 0 1 2.25-2.25z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 1.5h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" />
  </svg>
);

export default InboxIcon;