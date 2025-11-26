interface Tab {
  id: string;
  label: string;
  count: number;
}

interface TabSwitchProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

function TabSwitch({ tabs, activeTab, onTabChange }: TabSwitchProps) {
  return (
    <div className="flex gap-1 space-x-1 rounded-xl bg-gray-100 p-1 mb-6 max-w-md">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-100 ring-indigo-400 cursor-pointer ${
            activeTab === tab.id
              ? 'bg-white text-indigo-700 shadow'
              : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-900'
          }`}
        >
          {tab.label} ({tab.count})
        </button>
      ))}
    </div>
  );
}

export default TabSwitch;
