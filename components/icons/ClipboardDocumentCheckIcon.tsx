import React from 'react';

const ClipboardDocumentCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25H7.525A2.25 2.25 0 0 0 5.25 7.5v10.5A2.25 2.25 0 0 0 7.5 20.25h9a2.25 2.25 0 0 0 2.25-2.25V7.5A2.25 2.25 0 0 0 16.5 5.25H15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5.25V3.75A1.5 1.5 0 0 1 10.5 2.25h3A1.5 1.5 0 0 1 15 3.75v1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 14.25 1.5 1.5 3-3" />
  </svg>
);

export default ClipboardDocumentCheckIcon;
