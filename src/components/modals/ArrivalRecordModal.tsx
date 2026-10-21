import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, AlertTriangle, CheckCircle2, User, Calendar, Search, ChevronDown } from 'lucide-react';
import { Employee, ArrivalRecord, PriorNoticeStatus, NoticeMethod } from '../../types';
import { evaluateArrivalLate, normalizeTimeString, getVietnamToday, getVietnamCurrentTime } from '../../utils/helpers';

interface ArrivalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  existingRecords: ArrivalRecord[];
  thresholdTime: string;
  editingRecord?: ArrivalRecord | null;
  initialEmployeeId?: string;
  onSave: (recordData: Omit<ArrivalRecord, 'id' | 'createdAt'>, existingId?: string) => void;
}

export const ArrivalRecordModal: React.FC<ArrivalRecordModalProps> = ({
  isOpen,
  onClose,
  employees,
  existingRecords,
  thresholdTime,
  editingRecord,
  initialEmployeeId,
  onSave,
}) => {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [date, setDate] = useState<string>(getVietnamToday());
  const [arrivalTime, setArrivalTime] = useState<string>(getVietnamCurrentTime());
  const [notes, setNotes] = useState<string>('');

  // Thông tin báo trước với Hành chính
  const [priorNoticeStatus, setPriorNoticeStatus] = useState<PriorNoticeStatus>('unverified');
  const [noticeTime, setNoticeTime] = useState<string>('');
  const [noticeMethod, setNoticeMethod] = useState<NoticeMethod | ''>('');

  // State tìm kiếm nhân viên
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsEmployeeDropdownOpen(false);
      setEmployeeSearch('');
      return;
    }

    if (editingRecord) {
      setEmployeeId(editingRecord.employeeId);
      setDate(editingRecord.date);
      setArrivalTime(editingRecord.arrivalTime);
      setNotes(editingRecord.notes || '');
      setPriorNoticeStatus(editingRecord.priorNoticeStatus || 'unverified');
      setNoticeTime(editingRecord.noticeTime || '');
      setNoticeMethod(editingRecord.noticeMethod || '');
      setEmployeeSearch('');
      setIsEmployeeDropdownOpen(false);
    } else {
      const defaultId = initialEmployeeId || (employees.length > 0 ? employees[0].id : '');
      setEmployeeId(defaultId);
      setDate(getVietnamToday());
      setArrivalTime(getVietnamCurrentTime());
      setNotes('');
      setPriorNoticeStatus('unverified');
      setNoticeTime('');
      setNoticeMethod('');
      setEmployeeSearch('');
      setIsEmployeeDropdownOpen(false);
    }
  }, [isOpen, editingRecord, initialEmployeeId]);

  if (!isOpen) return null;

  // Real-time evaluation using central function
  const evaluation = evaluateArrivalLate(arrivalTime, thresholdTime);

  // Check potential duplicate in existing records (same employee & date)
  const isDuplicateDate = existingRecords.some(r => {
    if (editingRecord && r.id === editingRecord.id) return false;
    return r.employeeId === employeeId && r.date === date;
  });

  const selectedEmployee = employees.find(e => e.id === employeeId);

  // Lọc danh sách nhân viên theo từ khóa (Mã NV, Họ tên tiếng Việt, Tên tiếng Anh)
  const filteredEmployees = employees.filter(emp => {
    if (!employeeSearch.trim()) return true;
    const query = employeeSearch.toLowerCase().trim();
    const matchCode = emp.code.toLowerCase().includes(query);
    const matchName = emp.fullName.toLowerCase().includes(query);
    const matchEnglish = (emp.englishName || '').toLowerCase().includes(query);
    const matchDept = (emp.department || '').toLowerCase().includes(query);
    return matchCode || matchName || matchEnglish || matchDept;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !selectedEmployee) return;

    const normalizedTime = normalizeTimeString(arrivalTime) || arrivalTime;

    onSave({
      employeeId,
      employeeCode: selectedEmployee.code,
      date,
      arrivalTime: normalizedTime,
      isLate: evaluation.isLate,
      lateSeconds: evaluation.lateSeconds,
      priorNoticeStatus,
      noticeTime: noticeTime.trim() || undefined,
      noticeMethod: (noticeMethod as NoticeMethod) || undefined,
      notes: notes.trim() || undefined,
      createdBy: editingRecord?.createdBy || 'Nguyễn Thị Minh Hạnh (Admin)',
      updatedAt: editingRecord ? new Date().toISOString() : undefined,
    }, editingRecord?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingRecord ? 'Chỉnh Sửa Bản Ghi Chấm Công' : 'Ghi Nhận Chấm Công & Đi Trễ'}
              </h3>
              <p className="text-xs text-slate-500">
                Xác định tự động theo ngưỡng giờ đến chuẩn {thresholdTime}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Employee Select with Searchable List */}
          <div className="relative" ref={employeeDropdownRef}>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Nhân viên <span className="text-rose-500">*</span></span>
              {selectedEmployee && (
                <span className="text-[11px] font-normal text-slate-500">
                  {selectedEmployee.department}
                </span>
              )}
            </label>

            {/* Selected Employee Card / Trigger */}
            <div
              onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
              className={`w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                isEmployeeDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white' : 'border-slate-200 hover:bg-slate-100/70'
              }`}
            >
              {selectedEmployee ? (
                <div className="flex items-center space-x-2 truncate">
                  <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-xs shrink-0">
                    {selectedEmployee.code}
                  </span>
                  <span className="font-semibold text-slate-900 truncate">
                    {selectedEmployee.fullName}
                  </span>
                  <span className="text-slate-400 text-xs truncate">
                    ({selectedEmployee.englishName})
                  </span>
                </div>
              ) : (
                <span className="text-slate-400">Chọn nhân viên...</span>
              )}
              <div className="flex items-center space-x-1 ml-2 text-slate-400 shrink-0">
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isEmployeeDropdownOpen ? 'rotate-180 text-blue-600' : ''}`} />
              </div>
            </div>

            {/* Dropdown Panel with Search Input */}
            {isEmployeeDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-20 overflow-hidden flex flex-col max-h-72">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-slate-100 bg-slate-50/70">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Tìm theo mã NV, họ tên hoặc tên tiếng Anh..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {employeeSearch && (
                      <button
                        type="button"
                        onClick={() => setEmployeeSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* List of filtered employees */}
                <div className="overflow-y-auto divide-y divide-slate-100">
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map(emp => {
                      const isSelected = emp.id === employeeId;
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => {
                            setEmployeeId(emp.id);
                            setIsEmployeeDropdownOpen(false);
                            setEmployeeSearch('');
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-blue-50/60 transition-colors ${
                            isSelected ? 'bg-blue-50/80 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="font-mono font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.5 rounded text-[11px] shrink-0">
                              {emp.code}
                            </span>
                            <div className="truncate">
                              <span className="text-slate-900 font-semibold">{emp.fullName}</span>
                              <span className="text-slate-500 ml-1.5 text-[11px]">({emp.englishName})</span>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                            {emp.department}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-6 text-center text-xs text-slate-500">
                      Không tìm thấy nhân viên phù hợp
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ngày làm việc <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Giờ đến thực tế <span className="text-rose-500">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">HH:mm hoặc HH:mm:ss</span>
              </label>
              <input
                type="text"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder="08:30"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-blue-700"
                required
              />
            </div>
          </div>

          {/* Real-time Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
            evaluation.isLate 
              ? 'bg-amber-50 border-amber-200 text-amber-900' 
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center space-x-2">
              {evaluation.isLate ? (
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>
                Trạng thái: <strong>{evaluation.lateDisplay}</strong>
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              Ngưỡng: {thresholdTime}
            </span>
          </div>

          {/* Duplicate Warning */}
          {isDuplicateDate && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Cảnh báo nghi trùng:</span> Nhân viên này đã có bản ghi chấm công trong ngày <strong>{date}</strong>. 
                Bạn vẫn có thể lưu bản ghi nếu đây là lần quẹt thẻ bổ sung hoặc ca làm việc tiếp theo.
              </div>
            </div>
          )}

          {/* Thông tin Báo trước với Hành chính */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Đã báo trước với Hành chính?</span>
                <span className="text-[10px] text-slate-400 font-normal">Quản lý chuyên cần</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPriorNoticeStatus('reported')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    priorNoticeStatus === 'reported'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Đã báo trước
                </button>
                <button
                  type="button"
                  onClick={() => setPriorNoticeStatus('unreported')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    priorNoticeStatus === 'unreported'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Không báo trước
                </button>
                <button
                  type="button"
                  onClick={() => setPriorNoticeStatus('unverified')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    priorNoticeStatus === 'unverified'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Chưa xác minh
                </button>
              </div>
            </div>

            {/* Thời điểm và Hình thức báo (Tùy chọn, chỉ nhập khi có thông tin thực tế) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/60">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Thời điểm báo trước <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={noticeTime}
                  onChange={(e) => setNoticeTime(e.target.value)}
                  placeholder="VD: 08:10 hoặc trước ca 20p"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hình thức báo <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <select
                  value={noticeMethod}
                  onChange={(e) => setNoticeMethod(e.target.value as NoticeMethod | '')}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
                >
                  <option value="">-- Chưa chọn --</option>
                  <option value="zalo">Zalo</option>
                  <option value="phone">Điện thoại</option>
                  <option value="direct">Trực tiếp</option>
                  <option value="email">Email</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              * Thời điểm và hình thức báo không bắt buộc. Chỉ nhập khi có thông tin thực tế.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ghi chú tùy chọn
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Lý do đi trễ, xác nhận trưởng bộ phận, hoặc quẹt thẻ bổ sung..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              {editingRecord ? 'Lưu thay đổi' : 'Ghi nhận bản ghi'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
