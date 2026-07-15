"use client";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-xl bg-[#111318]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="flex-1 text-xs font-medium py-2 px-3 rounded-lg transition-all duration-200"
          style={{
            background: activeTab === tab.id ? "var(--bg)" : "transparent",
            color: activeTab === tab.id ? "var(--text)" : "var(--muted)",
            boxShadow: activeTab === tab.id ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}