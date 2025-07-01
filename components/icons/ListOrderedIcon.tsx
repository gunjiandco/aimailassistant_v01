import React from 'react';

const ListOrderedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <line x1="10" y1="6" x2="21" y2="6" />
        <line x1="10" y1="12" x2="21" y2="12" />
        <line x1="10" y1="18" x2="21" y2="18" />
        <path d="M4 6h1v4" />
        <path d="M4 12h1.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H4a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1.5" />
        <path d="M4 20h2a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5H4" />
    </svg>
);

export default ListOrderedIcon;
