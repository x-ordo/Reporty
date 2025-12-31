
import React from 'react';

export const COLORS = {
  primary: '#0f172a',
  secondary: '#334155',
  accent: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

const createIcon = (
  children: React.ReactNode,
  displayName: string
) => {
  const Icon = ({ title, ...props }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={!title}
      role={title ? 'img' : undefined}
      {...props}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
  Icon.displayName = displayName;
  return Icon;
};

export const ICONS = {
  Shield: createIcon(
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
    'ShieldIcon'
  ),
  Lock: createIcon(
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>,
    'LockIcon'
  ),
  Eye: createIcon(
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>,
    'EyeIcon'
  ),
  FileText: createIcon(
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </>,
    'FileTextIcon'
  ),
  Activity: createIcon(
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
    'ActivityIcon'
  ),
  AlertOctagon: createIcon(
    <>
      <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </>,
    'AlertOctagonIcon'
  ),
  Search: createIcon(
    <>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </>,
    'SearchIcon'
  ),
  Check: createIcon(
    <polyline points="20 6 9 17 4 12" />,
    'CheckIcon'
  ),
  X: createIcon(
    <>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </>,
    'XIcon'
  ),
};
