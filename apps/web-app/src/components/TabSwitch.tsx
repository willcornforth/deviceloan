interface Tab {
  id: string;
  label: string;
  count?: number;
  badgeColor?: 'yellow' | 'green' | 'gray' | 'indigo';
}

interface TabSwitchProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function TabSwitch({ tabs, activeTab, onTabChange }: TabSwitchProps) {
  const getBadgeColor = (color?: 'yellow' | 'green' | 'gray' | 'indigo') => {
    switch (color) {
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800';
      case 'green':
        return 'bg-green-100 text-green-800';
      case 'gray':
        return 'bg-gray-100 text-gray-600';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-600';
      default:
        return 'bg-indigo-100 text-indigo-600';
    }
  };

  return (
    <div className="mb-6 border-b border-gray-200">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === tab.id
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${getBadgeColor(tab.badgeColor)}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default TabSwitch;
