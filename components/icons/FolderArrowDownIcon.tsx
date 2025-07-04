
import React from 'react';

const FolderArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V7.5a2.25 2.25 0 0 1 2.25-2.25h3.75a.75.75 0 0 1 .6.3L11.25 9h8.25a2.25 2.25 0 0 1 2.25 2.25v4.5" />
  </svg>
);

export default FolderArrowDownIcon;
