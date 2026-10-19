import React, { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, CheckCircle2, User, Calendar } from 'lucide-react';
import { Employee, ArrivalRecord } from '../../types';
import { evaluateArrivalLate, normalizeTimeString } from '../../utils/helpers';

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
  const today = new Date().toISOString().slice(0, 10);
  
  const [employeeId, setEmployeeId] = useState<string>('');
  const [date, setDate] = useState<string>(today);
  const [arrivalTime, setArrivalTime] = useState<string>('08:32:00');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (editingRecord) {
      setEmployeeId(editingRecord.employeeId);
      setDate(editingRecord.date);
      setArrivalTime(editingRecord.arrivalTime);
      setNotes(editingRecord.notes || '');
    } else {
      setEmployeeId(initialEmployeeId || employees[0]?.id || '');
      setDate(today);
      setArrivalTime('08:32:00');
      setNotes('');
    }
  }, [editingRecord, initialEmployeeId, isOpen, employees]);

  if (!isOpen) return null;

  // Real-time evaluation using central function
  const evaluation = evaluateArrivalLate(arrivalTime, thresholdTime);

  // Check potential duplicate in existing records (same employee & date)
  const isDuplicateDate = existingRecords.some(r => {
    if (editingRecord && r.id === editingRecord.id) return false;
    return r.employeeId === employeeId && r.date === date;
  });

  const selectedEmployee = employees.find(e => e.id === employeeId);

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
          
          {/* Employee Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nhân viên <span className="text-rose-500">*</span>
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
              required
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.code} - {emp.fullName} ({emp.englishName}) • {emp.department}
                </option>
              ))}
            </select>
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
                <span className="text-[10px] text-slate-400 font-normal">HH:mm:ss</span>
              </label>
              <input
                type="text"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value)}
                placeholder={thresholdTime}
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
