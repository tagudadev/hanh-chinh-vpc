import React from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Building, 
  User, 
  FileEdit, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  History
} from 'lucide-react';
import { Employee, ArrivalRecord } from '../../types';
import { formatDateVNDetailed, formatLateDuration } from '../../utils/helpers';

interface RecordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ArrivalRecord | null;
  employee: Employee | null;
  thresholdTime: string;
  onEdit: (record: ArrivalRecord) => void;
  onDelete: (id: string) => void;
  onSelectEmployee?: (employee: Employee) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  isOpen,
  onClose,
  record,
  employee,
  thresholdTime,
  onEdit,
  onDelete,
  onSelectEmployee,
}) => {
  if (!isOpen || !record) return null;

  const lateMinutes = Math.round(record.lateSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              record.isLate ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Chi tiết Bản ghi Giờ đến</h3>
              <p className="text-[11px] text-slate-500">{formatDateVNDetailed(record.date)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* Employee Card */}
          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={employee?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt=""
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div>
                <div className="font-bold text-slate-900 text-sm sm:text-base">
                  {employee?.fullName || record.employeeCode}
                </div>
                <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                  <span className="font-mono font-semibold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {record.employeeCode}
                  </span>
                  <span>•</span>
                  <span>{employee?.department || 'Chưa phân bổ'}</span>
                </div>
              </div>
            </div>

            {employee && onSelectEmployee && (
              <button
                onClick={() => {
                  onClose();
                  onSelectEmployee(employee);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                Hồ sơ NV
              </button>
            )}
          </div>

          {/* Time & Late Evaluation Result */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl">
              <span className="text-[11px] text-slate-500 font-medium block">Giờ đến ghi nhận</span>
              <span className="text-xl font-bold font-mono text-slate-900 mt-1 block">
                {record.arrivalTime}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Ngưỡng chuẩn: {thresholdTime}
              </span>
            </div>

            <div className={`p-3.5 border rounded-xl ${
              record.isLate 
                ? 'bg-amber-50/60 border-amber-200 text-amber-900' 
                : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
            }`}>
              <span className="text-[11px] font-medium block opacity-80">Trạng thái</span>
              <div className="flex items-center space-x-1.5 mt-1">
                {record.isLate ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="font-bold text-sm text-amber-800">
                      Đi trễ (+{formatLateDuration(record.lateSeconds)})
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-sm text-emerald-800">Đúng giờ</span>
                  </>
                )}
              </div>
              <span className="text-[11px] opacity-75 mt-0.5 block">
                {record.isLate 
                  ? `Đến sau mốc ${thresholdTime}` 
                  : `Đến đúng hoặc trước ${thresholdTime}`}
              </span>
            </div>
          </div>

          {/* Notes section */}
          <div className="p-4 border border-slate-200 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Ghi chú lý do / giải trình</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              {record.notes ? record.notes : <span className="text-slate-400 italic">Không có ghi chú nào cho ca này</span>}
            </p>
          </div>

          {/* Audit trail */}
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Người ghi nhận:</span>
              <span className="font-medium text-slate-700">{record.createdBy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Thời điểm tạo:</span>
              <span className="font-mono text-slate-600">
                {new Date(record.createdAt).toLocaleString('vi-VN')}
              </span>
            </div>
            {record.updatedAt && (
              <div className="flex items-center justify-between">
                <span>Cập nhật lần cuối:</span>
                <span className="font-mono text-slate-600">
                  {new Date(record.updatedAt).toLocaleString('vi-VN')}
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm(`Bạn có chắc muốn xóa bản ghi ngày ${record.date} của nhân viên ${record.employeeCode}?`)) {
                onDelete(record.id);
                onClose();
              }
            }}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa bản ghi</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
