import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  FileSpreadsheet, 
  Clock, 
  Calendar, 
  Building, 
  CheckCircle2, 
  AlertTriangle, 
  FileEdit, 
  Trash2, 
  ChevronDown, 
  X,
  FileDown
} from 'lucide-react';
import { Employee, ArrivalRecord, Department } from '../types';
import { 
  formatDateVN, 
  exportToExcel, 
  downloadExcelSampleTemplate,
  formatPriorNoticeText,
  formatNoticeMethodText
} from '../utils/helpers';

interface AttendanceTabProps {
  employees: Employee[];
  records: ArrivalRecord[];
  thresholdTime: string;
  onOpenRecordModal: () => void;
  onOpenExcelModal: () => void;
  onEditRecord: (record: ArrivalRecord) => void;
  onDeleteRecord: (id: string) => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  employees,
  records,
  thresholdTime,
  onOpenRecordModal,
  onOpenExcelModal,
  onEditRecord,
  onDeleteRecord,
  onSelectEmployee,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all' | 'late' | 'ontime'
  const [selectedPriorNotice, setSelectedPriorNotice] = useState<string>('all'); // 'all' | 'reported' | 'unreported' | 'unverified'
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // e.g. "2026-10" or empty
  const [selectedDate, setSelectedDate] = useState<string>('');

  const departments: Department[] = [
    'Kế toán',
    'Hành chính Nhân sự',
    'Kinh doanh & Marketing',
    'Kỹ thuật & Công nghệ',
    'Vận hành',
    'Ban Giám đốc',
  ];

  // Filter records
  const filteredRecords = useMemo(() => {
    return records.filter(rec => {
      const emp = employees.find(e => e.id === rec.employeeId);

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const empName = emp?.fullName.toLowerCase() || '';
        const empEnglish = emp?.englishName.toLowerCase() || '';
        const empCode = rec.employeeCode.toLowerCase();
        const notes = (rec.notes || '').toLowerCase();
        if (!empName.includes(term) && !empEnglish.includes(term) && !empCode.includes(term) && !notes.includes(term)) {
          return false;
        }
      }

      // Department filter
      if (selectedDept !== 'all' && emp?.department !== selectedDept) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'late' && !rec.isLate) return false;
      if (selectedStatus === 'ontime' && rec.isLate) return false;

      // Prior notice filter (bản ghi cũ chưa có thông tin coi là unverified)
      if (selectedPriorNotice !== 'all') {
        const noticeStatus = rec.priorNoticeStatus || 'unverified';
        if (noticeStatus !== selectedPriorNotice) return false;
      }

      // Month filter
      if (selectedMonth && !rec.date.startsWith(selectedMonth)) return false;

      // Exact Date filter
      if (selectedDate && rec.date !== selectedDate) return false;

      return true;
    }).sort((a, b) => new Date(b.date + 'T' + b.arrivalTime).getTime() - new Date(a.date + 'T' + a.arrivalTime).getTime());
  }, [records, employees, searchTerm, selectedDept, selectedStatus, selectedPriorNotice, selectedMonth, selectedDate]);

  // Duplicate detection for badges in the list
  const dateEmpFrequency = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach(r => {
      const key = `${r.employeeId}_${r.date}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [records]);

  // Aggregate stats of filtered results
  const totalCount = filteredRecords.length;
  const lateCount = filteredRecords.filter(r => r.isLate).length;
  const onTimeCount = filteredRecords.filter(r => !r.isLate).length;
  const totalLateMinutes = Math.round(
    filteredRecords.reduce((sum, r) => sum + (r.isLate ? r.lateSeconds : 0), 0) / 60
  );

  // Quick export filtered list to Excel
  const handleExportFiltered = () => {
    const headers = [
      'STT',
      'Mã nhân viên',
      'Họ và tên',
      'Tên tiếng Anh',
      'Phòng ban',
      'Ngày làm việc',
      'Giờ đến',
      'Trạng thái',
      'Số phút trễ',
      'Báo trước với HC',
      'Thời điểm báo',
      'Hình thức báo',
      'Ghi chú',
      'Người ghi nhận',
      'Thời điểm tạo'
    ];
    const rows = filteredRecords.map((r, idx) => {
      const emp = employees.find(e => e.id === r.employeeId);
      return [
        idx + 1,
        r.employeeCode,
        emp?.fullName || '',
        emp?.englishName || '',
        emp?.department || '',
        formatDateVN(r.date),
        r.arrivalTime,
        r.isLate ? 'Đi trễ' : 'Đúng giờ',
        r.isLate ? Math.round(r.lateSeconds / 60) : 0,
        formatPriorNoticeText(r.priorNoticeStatus),
        r.noticeTime || '',
        formatNoticeMethodText(r.noticeMethod),
        r.notes || '',
        r.createdBy,
        r.createdAt
      ];
    });

    exportToExcel('Danh_Sach_Cham_Cong_VPC.xlsx', 'ChamCong', headers, rows);
  };

  return (
    <div className="space-y-5">
      
      {/* Header bar */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Ghi nhận & Danh sách Giờ đến Nhân viên</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {filteredRecords.length} bản ghi
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ngưỡng giờ đến chuẩn: <strong>{thresholdTime}</strong>. Đúng {thresholdTime} là Đúng giờ; lớn hơn {thresholdTime} tính là Đi trễ.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenExcelModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập từ Excel</span>
          </button>

          <button
            onClick={onOpenRecordModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ghi nhận thủ công</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã NV, họ tên, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="late">⏳ Chỉ ca đi trễ ({records.filter(r => r.isLate).length})</option>
              <option value="ontime">✅ Chỉ ca đúng giờ ({records.filter(r => !r.isLate).length})</option>
            </select>
          </div>

          {/* Prior Notice Filter */}
          <div className="relative">
            <select
              value={selectedPriorNotice}
              onChange={(e) => setSelectedPriorNotice(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả báo trước</option>
              <option value="reported">📢 Đã báo trước</option>
              <option value="unreported">🚫 Không báo trước</option>
              <option value="unverified">❓ Chưa xác minh</option>
            </select>
          </div>

          {/* Month */}
          <div>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedDate('');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              title="Lọc theo tháng"
            />
          </div>

          {/* Specific Date */}
          <div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedMonth('');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
              title="Lọc theo ngày cụ thể"
            />
          </div>

        </div>

        {/* Filter Summary Strip */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center space-x-4">
            <span>Hiển thị: <strong className="text-slate-900">{totalCount}</strong> ca</span>
            <span>Đi trễ: <strong className="text-amber-700">{lateCount}</strong></span>
            <span>Đúng giờ: <strong className="text-emerald-700">{onTimeCount}</strong></span>
            <span>Tổng thời gian trễ: <strong className="text-slate-800">{totalLateMinutes}</strong> phút</span>
          </div>

          <div className="flex items-center space-x-3">
            {(searchTerm || selectedDept !== 'all' || selectedStatus !== 'all' || selectedPriorNotice !== 'all' || selectedMonth || selectedDate) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDept('all');
                  setSelectedStatus('all');
                  setSelectedPriorNotice('all');
                  setSelectedMonth('');
                  setSelectedDate('');
                }}
                className="text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}

            <button
              onClick={handleExportFiltered}
              className="inline-flex items-center space-x-1 text-slate-600 hover:text-blue-600 font-semibold cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Xuất danh sách này (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nhân viên</th>
                <th className="py-3 px-4">Ngày làm việc</th>
                <th className="py-3 px-4">Giờ đến</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Thời gian trễ</th>
                <th className="py-3 px-4">Báo trước với HC</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4">Người ghi nhận</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">Không tìm thấy bản ghi chấm công nào phù hợp</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Hãy thử đổi bộ lọc hoặc bấm "Ghi nhận thủ công" / "Nhập từ Excel" để thêm dữ liệu mới.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  const isDuplicateDate = (dateEmpFrequency.get(`${rec.employeeId}_${rec.date}`) || 0) > 1;

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Employee */}
                      <td className="py-3 px-4">
                        <div 
                          onClick={() => emp && onSelectEmployee(emp)}
                          className="flex items-center space-x-3 cursor-pointer group"
                        >
                          <img
                            src={emp?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {emp?.fullName || rec.employeeCode}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              <span className="font-mono text-slate-600">{rec.employeeCode}</span> • {emp?.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Date with duplicate warning indicator */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{formatDateVN(rec.date)}</div>
                        {isDuplicateDate && (
                          <span 
                            className="inline-flex items-center space-x-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-0.5"
                            title="Nhân viên này có nhiều hơn 1 bản ghi trong ngày"
                          >
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Đa bản ghi / ngày</span>
                          </span>
                        )}
                      </td>

                      {/* Arrival Time */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                        {rec.arrivalTime}
                      </td>

                      {/* Late Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rec.isLate ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Đi trễ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đúng giờ</span>
                          </span>
                        )}
                      </td>

                      {/* Late Duration */}
                      <td className="py-3 px-4 whitespace-nowrap font-bold text-xs">
                        {rec.isLate ? (
                          <span className="text-amber-700">
                            +{Math.round(rec.lateSeconds / 60)} phút <span className="text-[10px] text-slate-400 font-normal font-mono">({rec.lateSeconds}s)</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>

                      {/* Báo trước với HC */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {rec.priorNoticeStatus === 'reported' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                              Đã báo trước
                            </span>
                            {(rec.noticeMethod || rec.noticeTime) && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                {rec.noticeMethod && <span className="font-semibold text-slate-700">{formatNoticeMethodText(rec.noticeMethod)}</span>}
                                {rec.noticeMethod && rec.noticeTime && <span> • </span>}
                                {rec.noticeTime && <span>{rec.noticeTime}</span>}
                              </div>
                            )}
                          </div>
                        ) : rec.priorNoticeStatus === 'unreported' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Không báo trước
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Chưa xác minh
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-4 max-w-xs text-xs text-slate-700">
                        <p className="line-clamp-2" title={rec.notes}>
                          {rec.notes || <span className="text-slate-400 italic">Không có ghi chú</span>}
                        </p>
                      </td>

                      {/* Created By & Date */}
                      <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                        <div>{rec.createdBy}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(rec.createdAt).toLocaleDateString('vi-VN')} {new Date(rec.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => onEditRecord(rec)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Sửa bản ghi"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa bản ghi chấm công ngày ${formatDateVN(rec.date)} của nhân viên ${rec.employeeCode}? Hành động này không thể hoàn tác.`)) {
                                onDeleteRecord(rec.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa bản ghi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
