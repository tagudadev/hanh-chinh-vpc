import React from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Users, 
  BarChart3, 
  Settings2 
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  totalLateCount: number;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, totalLateCount, onSelectTab }) => {
  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance' as ActiveTab,
      label: 'Ghi nhận & Danh sách đi trễ',
      icon: Clock,
      badge: totalLateCount > 0 ? totalLateCount : null,
    },
    {
      id: 'employees' as ActiveTab,
      label: 'Quản lý nhân sự',
      icon: Users,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Báo cáo thống kê',
      icon: BarChart3,
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Cài đặt hệ thống',
      icon: Settings2,
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== null && (
                  <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-white">
                    {item.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
