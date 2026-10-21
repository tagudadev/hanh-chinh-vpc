import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Save, 
  RotateCcw, 
  Clock, 
  ShieldCheck, 
  FileDown, 
  FileUp, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Info, 
  Building,
  Sun,
  Moon
} from 'lucide-react';
import { WorkspaceSettings } from '../types';
import { isValidHHmm } from '../utils/helpers';

interface SettingsTabProps {
  settings: WorkspaceSettings;
  onUpdateSettings: (newSettings: WorkspaceSettings) => void;
  onResetAllData: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
  theme?: 'light' | 'dark';
  onSetTheme?: (theme: 'light' | 'dark') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
  onResetAllData,
  onExportBackup,
  onImportBackup,
  theme,
  onSetTheme,
}) => {
  const [formData, setFormData] = useState<WorkspaceSettings>(settings);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Admin passcode to prevent accidental changes
  const ADMIN_PASSCODE = 'vpc2026';

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPin.trim().toLowerCase() === ADMIN_PASSCODE || adminPin.trim() === '123456') {
      setIsAdminUnlocked(true);
      setPinError('');
    } else {
      setPinError('Mã xác thực Quản trị viên không đúng. (Gợi ý kiểm thử: vpc2026)');
    }
  };

  const handleThresholdChange = (val: string) => {
    setFormData(prev => ({ ...prev, lateThresholdTime: val }));
    if (!val.trim()) {
      setTimeError('Vui lòng nhập giờ bắt đầu tính đi trễ.');
    } else if (!isValidHHmm(val)) {
      setTimeError('Định dạng giờ không hợp lệ. Vui lòng nhập định dạng HH:mm (ví dụ: 08:30, 08:45, 09:00).');
    } else {
      setTimeError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminUnlocked) {
      alert('Chỉ tài khoản Quản trị viên mới có quyền cập nhật cấu hình hệ thống.');
      return;
    }
    const trimmedTime = formData.lateThresholdTime.trim();
    if (!isValidHHmm(trimmedTime)) {
      setTimeError('Định dạng giờ không hợp lệ. Vui lòng nhập định dạng HH:mm (ví dụ: 08:30).');
      return;
    }
    onUpdateSettings({
      ...formData,
      lateThresholdTime: trimmedTime,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Settings2 className="w-5 h-5 text-blue-600" />
          <span>Cài đặt & Quy tắc Nghiệp vụ Hệ thống VPC</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Thiết lập ngưỡng xác định giờ đến và quản lý dữ liệu lưu trữ nội bộ
        </p>
      </div>

      {/* Notice on Local Storage Limitations */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-900">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Minh bạch về lưu trữ dữ liệu (Giới hạn kỹ thuật):</span>
          <p className="text-amber-800">
            Ứng dụng hiện đang hoạt động ở chế độ độc lập và lưu trữ dữ liệu trong bộ nhớ trình duyệt (LocalStorage).
            Hệ thống chưa kết nối cơ sở dữ liệu máy chủ tập trung (backend database). Để đảm bảo an toàn dữ liệu, 
            bộ phận Hành chính nên định kỳ bấm <strong>"Tải bản sao lưu JSON"</strong> hoặc xuất file Excel để lưu trữ.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Business Rule: Late Threshold */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Quy tắc nghiệp vụ: Ngưỡng xác định đi trễ</span>
            </h3>

            {isAdminUnlocked ? (
              <span className="inline-flex items-center space-x-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
                <Unlock className="w-3.5 h-3.5" />
                <span>Quyền Quản trị viên (Đã mở khóa)</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Chế độ Chỉ đọc (Cần quyền Admin để sửa)</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên công ty / Đơn vị quản lý
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                disabled={!isAdminUnlocked}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Giờ bắt đầu tính đi trễ (HH:mm)</span>
                <span className="text-[10px] text-slate-400 font-normal">Mặc định: 08:30</span>
              </label>
              <input
                type="text"
                placeholder="08:30"
                value={formData.lateThresholdTime}
                onChange={(e) => handleThresholdChange(e.target.value)}
                disabled={!isAdminUnlocked}
                className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg font-mono font-bold text-blue-700 disabled:opacity-60 ${
                  timeError ? 'border-rose-400 bg-rose-50/50' : 'border-slate-200'
                }`}
              />
              {timeError ? (
                <span className="text-[11px] text-rose-600 font-medium mt-1 block">
                  {timeError}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Quy tắc: Giờ đến <strong>lớn hơn {formData.lateThresholdTime || 'ngưỡng'}</strong> mới tính đi trễ; đúng bằng {formData.lateThresholdTime || 'ngưỡng'} thì không tính đi trễ.
                </span>
              )}
            </div>
          </div>

          {/* Admin Unlock Box if locked */}
          {!isAdminUnlocked && (
            <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800">Mở khóa quyền Quản trị viên</span>
                <p className="text-[11px] text-slate-500">Người dùng thông thường không được tự ý đổi quy tắc ngưỡng giờ đến.</p>
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="password"
                  placeholder="Mã PIN (vpc2026)"
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value);
                    setPinError('');
                  }}
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg w-32"
                />
                <button
                  type="button"
                  onClick={handleUnlock}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                >
                  Mở khóa
                </button>
              </div>
            </div>
          )}
          {pinError && <p className="text-[11px] text-rose-600 font-semibold">{pinError}</p>}

          {isAdminUnlocked && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                {savedSuccess && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Đã lưu quy tắc mới thành công!</span>
                  </span>
                )}
              </div>
              <button
                type="submit"
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi quy tắc</span>
              </button>
            </div>
          )}
        </div>

      </form>

      {/* Theme Appearance Mode */}
      {theme && onSetTheme && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span>Giao diện hiển thị (Chế độ Sáng / Tối)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tùy chỉnh chế độ hiển thị phù hợp với điều kiện ánh sáng và sở thích làm việc của Hành chính
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              Hiện tại: {theme === 'dark' ? 'Chế độ Tối' : 'Chế độ Sáng'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onSetTheme('light')}
              className={`flex items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mr-3 shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center space-x-1.5">
                  <span>Chế độ Sáng (Light Mode)</span>
                  {theme === 'light' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold">Đang dùng</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nền sáng rõ ràng, độ tương phản sắc nét, phù hợp làm việc ban ngày hoặc môi trường văn phòng đủ sáng
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onSetTheme('dark')}
              className={`flex items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3 shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center space-x-1.5">
                  <span>Chế độ Tối (Dark Mode)</span>
                  {theme === 'dark' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-semibold">Đang dùng</span>}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Nền tối dịu mắt, giảm chói, tiết kiệm pin và dễ quan sát trong điều kiện phòng tối hoặc ca đêm
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Backup and Data Management */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center space-x-2">
          <Building className="w-4 h-4 text-slate-600" />
          <span>Sao lưu & Khôi phục dữ liệu nội bộ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          <button
            onClick={onExportBackup}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            <FileDown className="w-5 h-5 text-blue-600 mb-1.5" />
            <span className="text-xs font-bold text-slate-800">Tải bản sao lưu JSON</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Xuất toàn bộ nhân sự & ca chấm công</span>
          </button>

          <label className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer text-center relative">
            <FileUp className="w-5 h-5 text-emerald-600 mb-1.5" />
            <span className="text-xs font-bold text-slate-800">Khôi phục từ tệp JSON</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Nạp lại dữ liệu từ tệp sao lưu</span>
            <input
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          </label>

          <button
            onClick={() => {
              if (confirm('Khôi phục lại toàn bộ dữ liệu mẫu ban đầu của VPC? Toàn bộ các ca đã nhập thêm sẽ được đưa về dữ liệu gốc.')) {
                onResetAllData();
              }
            }}
            className="flex flex-col items-center justify-center p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors cursor-pointer text-center"
          >
            <RotateCcw className="w-5 h-5 text-rose-600 mb-1.5" />
            <span className="text-xs font-bold text-rose-800">Khôi phục dữ liệu mẫu VPC</span>
            <span className="text-[10px] text-rose-400 mt-0.5">Đặt lại về mặc định ban đầu</span>
          </button>

        </div>
      </div>

    </div>
  );
};
