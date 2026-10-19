import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Building2, 
  PlusCircle, 
  UserPlus, 
  FileSpreadsheet, 
  RotateCcw,
  AlertTriangle,
  FileDown
} from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  lateCountToday: number;
  onOpenRecordModal: () => void;
  onOpenExcelModal: () => void;
  onOpenEmployeeModal: () => void;
  onNavigateToTab: (tab: ActiveTab) => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lateCountToday,
  onOpenRecordModal,
  onOpenExcelModal,
  onOpenEmployeeModal,
  onNavigateToTab,
  onResetData,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">VPC WORKSPACE</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Hành chính Nội bộ
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Hệ thống Ghi nhận & Báo cáo Tình hình Đi trễ</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-2.5">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="capitalize">{currentDate}</span>
              <span className="font-bold text-slate-800 font-mono ml-1">{currentTime}</span>
            </div>

            {/* Quick Record Button */}
            <button
              onClick={onOpenRecordModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Ghi nhận ca đi trễ thủ công"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Ghi nhận đi trễ</span>
            </button>

            {/* Import Excel Button */}
            <button
              onClick={onOpenExcelModal}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
              title="Nhập dữ liệu chấm công từ file Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Nhập Excel</span>
            </button>

            {/* Add Employee Button */}
            <button
              onClick={onOpenEmployeeModal}
              className="hidden md:inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm nhân viên</span>
            </button>

            {/* Reset Data Button */}
            <div className="relative">
              <button
                onClick={() => setShowResetConfirm(!showResetConfirm)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Khôi phục dữ liệu mẫu ban đầu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {showResetConfirm && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 text-xs">
                  <div className="flex items-start space-x-2 text-amber-800 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="font-semibold">Khôi phục dữ liệu mẫu?</span>
                  </div>
                  <p className="text-slate-500 mb-3">Tất cả thay đổi thêm mới sẽ được đặt lại về dữ liệu ban đầu của VPC.</p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded text-xs font-medium"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => {
                        onResetData();
                        setShowResetConfirm(false);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium"
                    >
                      Xác nhận
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
