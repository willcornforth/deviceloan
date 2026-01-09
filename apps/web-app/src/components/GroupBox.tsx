import { ReactNode, useState } from 'react';

interface GroupBoxProps {
  title: string;
  children: ReactNode;
  count?: number;
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

function GroupBox({ 
  title, 
  children, 
  count, 
  collapsible = false, 
  defaultExpanded = true 
}: GroupBoxProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpand = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (collapsible && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleExpand();
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm mb-4">
      <div 
        className={`bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between ${
          collapsible ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
        }`}
        onClick={toggleExpand}
        role={collapsible ? 'button' : undefined}
        tabIndex={collapsible ? 0 : undefined}
        onKeyDown={handleKeyDown}
        aria-expanded={collapsible ? isExpanded : undefined}
        aria-label={collapsible ? `${isExpanded ? 'Collapse' : 'Expand'} ${title} section` : undefined}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {count !== undefined && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {count}
            </span>
          )}
        </div>
        {collapsible && (
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${
              isExpanded ? 'transform rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </div>
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

export default GroupBox;
