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
  ChevronRight,
  X,
  FileDown,
  LayoutList,
  CalendarDays,
  LayoutGrid,
  Eye,
  FileText,
  UserCheck,
  Timer,
  AlertCircle
} from 'lucide-react';
import { Employee, ArrivalRecord, Department } from '../types';
import { 
  formatDateVN, 
  formatDateVNDetailed, 
  formatLateDuration, 
  exportToExcel 
} from '../utils/helpers';
import { RecordDetailModal } from './modals/RecordDetailModal';

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
  // View mode: 'by_date' (Nhóm theo ngày - Mặc định, cực kỳ gọn gàng) | 'table' (Bảng chuẩn) | 'cards' (Dạng thẻ)
  const [viewMode, setViewMode] = useState<'by_date' | 'table' | 'cards'>('by_date');

  // Quick filter tab: 'all' | 'late' | 'ontime'
  const [quickFilter, setQuickFilter] = useState<'all' | 'late' | 'ontime'>('all');

  // Search and advanced filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Selected record for detail drawer/modal
  const [inspectingRecord, setInspectingRecord] = useState<ArrivalRecord | null>(null);

  // Collapsed date groups
  const [collapsedDates, setCollapsedDates] = useState<Record<string, boolean>>({});

  const toggleDateGroup = (date: string) => {
    setCollapsedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

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

      // Quick filter
      if (quickFilter === 'late' && !rec.isLate) return false;
      if (quickFilter === 'ontime' && rec.isLate) return false;

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

      // Month filter
      if (selectedMonth && !rec.date.startsWith(selectedMonth)) return false;

      // Exact Date filter
      if (selectedDate && rec.date !== selectedDate) return false;

      return true;
    }).sort((a, b) => new Date(b.date + 'T' + b.arrivalTime).getTime() - new Date(a.date + 'T' + a.arrivalTime).getTime());
  }, [records, employees, quickFilter, searchTerm, selectedDept, selectedMonth, selectedDate]);

  // Aggregate stats across filtered records
  const totalCount = filteredRecords.length;
  const lateCount = filteredRecords.filter(r => r.isLate).length;
  const onTimeCount = filteredRecords.filter(r => !r.isLate).length;
  const totalLateSeconds = filteredRecords.reduce((sum, r) => sum + (r.isLate ? r.lateSeconds : 0), 0);

  // Group records by Date (for the 'by_date' view)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, ArrivalRecord[]>();
    filteredRecords.forEach(rec => {
      const group = map.get(rec.date) || [];
      group.push(rec);
      map.set(rec.date, group);
    });
    // Array of { date, records }
    return Array.from(map.entries()).map(([date, recs]) => ({
      date,
      records: recs,
      total: recs.length,
      late: recs.filter(r => r.isLate).length,
      onTime: recs.filter(r => !r.isLate).length,
      lateSeconds: recs.reduce((sum, r) => sum + (r.isLate ? r.lateSeconds : 0), 0),
    }));
  }, [filteredRecords]);

  // Duplicate detection for same employee on same date
  const dateEmpFrequency = useMemo(() => {
    const map = new Map<string, number>();
    records.forEach(r => {
      const key = `${r.employeeId}_${r.date}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    return map;
  }, [records]);

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
      'Thời gian trễ',
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
        r.isLate ? formatLateDuration(r.lateSeconds) : '-',
        r.notes || '',
        r.createdBy,
        r.createdAt
      ];
    });

    exportToExcel('Danh_Sach_Di_Tre_VPC.xlsx', 'ChamCong', headers, rows);
  };

  const hasActiveFilters = searchTerm || selectedDept !== 'all' || selectedMonth || selectedDate || quickFilter !== 'all';

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedDept('all');
    setSelectedMonth('');
    setSelectedDate('');
    setQuickFilter('all');
  };

  const inspectingEmployee = inspectingRecord 
    ? employees.find(e => e.id === inspectingRecord.employeeId) || null 
    : null;

  return (
    <div className="space-y-5">
      
      {/* 1. Header & Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Quản lý & Theo dõi Giờ đến Nhân viên
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Ngưỡng: {thresholdTime}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận và tra cứu tình hình chấp hành giờ làm việc. Giờ đến lớn hơn {thresholdTime} xác định là Đi trễ.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={onOpenExcelModal}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập từ Excel</span>
          </button>

          <button
            onClick={onOpenRecordModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Ghi nhận giờ đến</span>
          </button>
        </div>
      </div>

      {/* 2. Sleek Summary Metrics Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng số ca ghi nhận</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-400">bản ghi</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-900">Số ca đi trễ</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-amber-800">{lateCount}</span>
            <span className="text-xs text-amber-700 font-medium">
              ({totalCount > 0 ? Math.round((lateCount / totalCount) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-900">Số ca đúng giờ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-emerald-800">{onTimeCount}</span>
            <span className="text-xs text-emerald-700 font-medium">
              ({totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Tổng thời gian trễ</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Timer className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-xl font-bold text-slate-800">
              {formatLateDuration(totalLateSeconds)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Smart Controls Toolbar: Quick Filters + View Switcher + Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
        
        {/* Top line of toolbar: Segmented Filters + View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Segmented Filter Buttons */}
          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl space-x-1">
            <button
              onClick={() => setQuickFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                quickFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({records.length})
            </button>
            <button
              onClick={() => setQuickFilter('late')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                quickFilter === 'late'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>⏳ Chỉ ca đi trễ</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                quickFilter === 'late' ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-800'
              }`}>
                {records.filter(r => r.isLate).length}
              </span>
            </button>
            <button
              onClick={() => setQuickFilter('ontime')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                quickFilter === 'ontime'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-800 hover:bg-emerald-50'
              }`}
            >
              <span>✅ Đúng giờ</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                quickFilter === 'ontime' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {records.filter(r => !r.isLate).length}
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">Kiểu xem:</span>
            <div className="flex items-center p-1 bg-slate-100/80 rounded-xl space-x-1">
              <button
                onClick={() => setViewMode('by_date')}
                title="Mẫu xem gom theo Ngày làm việc (Gọn gàng nhất)"
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'by_date'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Theo ngày</span>
              </button>

              <button
                onClick={() => setViewMode('table')}
                title="Mẫu Bảng danh sách tiêu chuẩn"
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Bảng chuẩn</span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                title="Mẫu Dạng thẻ trực quan"
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  viewMode === 'cards'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Dạng thẻ</span>
              </button>
            </div>

            <button
              onClick={handleExportFiltered}
              title="Xuất các bản ghi đang lọc ra file Excel"
              className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
          </div>

        </div>

        {/* Bottom line: Detailed Search & Filtering inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã NV, họ tên, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Department */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-pointer focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
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
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              title="Lọc theo tháng"
            />
          </div>

          {/* Specific Date */}
          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedMonth('');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              title="Lọc theo ngày cụ thể"
            />

            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="shrink-0 p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Đặt lại toàn bộ bộ lọc"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

      {/* 4. Main Record Presentation Area based on View Mode */}

      {/* Empty State */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">Không tìm thấy bản ghi giờ đến nào</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Không có dữ liệu phù hợp với bộ lọc hiện tại. Bạn có thể xóa bộ lọc hoặc bấm "Ghi nhận giờ đến" / "Nhập từ Excel".
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="mt-4 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          )}
        </div>
      ) : (

        <>
          {/* ======================================================== */}
          {/* MẪU 1: THEO NGÀY (GROUPED BY DATE - MẶC ĐỊNH, CỰC KỲ GỌN) */}
          {/* ======================================================== */}
          {viewMode === 'by_date' && (
            <div className="space-y-4">
              {groupedByDate.map(group => {
                const isCollapsed = !!collapsedDates[group.date];
                const isToday = group.date === new Date().toISOString().slice(0, 10);

                return (
                  <div 
                    key={group.date}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all"
                  >
                    {/* Date Section Header */}
                    <div 
                      onClick={() => toggleDateGroup(group.date)}
                      className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 transition-colors select-none"
                    >
                      <div className="flex items-center space-x-3">
                        <button className="text-slate-400 hover:text-slate-600 transition-transform">
                          <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 text-sm sm:text-base">
                            {formatDateVNDetailed(group.date)}
                          </span>
                          {isToday && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                              Hôm nay
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Daily summary badges */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500 font-medium">
                          {group.total} lượt quét
                        </span>
                        <span>•</span>
                        {group.late > 0 ? (
                          <span className="inline-flex items-center space-x-1 font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>{group.late} đi trễ (+{formatLateDuration(group.lateSeconds)})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>100% đúng giờ</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group records list */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100">
                        {group.records.map(rec => {
                          const emp = employees.find(e => e.id === rec.employeeId);
                          const isDuplicateDate = (dateEmpFrequency.get(`${rec.employeeId}_${rec.date}`) || 0) > 1;

                          return (
                            <div 
                              key={rec.id}
                              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors group ${
                                rec.isLate ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
                              }`}
                            >
                              {/* Left: Time & Status */}
                              <div className="flex items-center space-x-3 sm:w-60 shrink-0">
                                <div className="font-mono text-base font-bold text-slate-900 tracking-tight">
                                  {rec.arrivalTime}
                                </div>
                                
                                {rec.isLate ? (
                                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                    <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>Trễ +{formatLateDuration(rec.lateSeconds)}</span>
                                  </div>
                                ) : (
                                  <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span>Đúng giờ</span>
                                  </div>
                                )}
                              </div>

                              {/* Center: Employee info */}
                              <div 
                                onClick={() => emp && onSelectEmployee(emp)}
                                className="flex items-center space-x-3 cursor-pointer sm:flex-1 min-w-0"
                              >
                                <img
                                  src={emp?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                                  alt=""
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                                      {emp?.fullName || rec.employeeCode}
                                    </span>
                                    <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                      {rec.employeeCode}
                                    </span>
                                    {isDuplicateDate && (
                                      <span 
                                        className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0"
                                        title="Nhân viên có nhiều hơn 1 bản ghi trong ngày"
                                      >
                                        Đa bản ghi
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-slate-400 truncate mt-0.5">
                                    {emp?.department} {emp?.position ? `• ${emp.position}` : ''}
                                  </div>
                                </div>
                              </div>

                              {/* Note snippet */}
                              <div className="sm:w-64 shrink-0 text-xs text-slate-600">
                                {rec.notes ? (
                                  <div className="flex items-center space-x-1.5 text-slate-700" title={rec.notes}>
                                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span className="truncate italic">"{rec.notes}"</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Không có ghi chú</span>
                                )}
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Ghi nhận bởi: {rec.createdBy}
                                </div>
                              </div>

                              {/* Right: Actions */}
                              <div className="flex items-center space-x-1 sm:justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                <button
                                  onClick={() => setInspectingRecord(rec)}
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xem chi tiết bản ghi"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                <button
                                  onClick={() => onEditRecord(rec)}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Chỉnh sửa bản ghi"
                                >
                                  <FileEdit className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (confirm(`Bạn có chắc muốn xóa bản ghi ngày ${formatDateVN(rec.date)} của nhân viên ${rec.employeeCode}?`)) {
                                      onDeleteRecord(rec.id);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Xóa bản ghi"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}

          {/* ======================================================== */}
          {/* MẪU 2: BẢNG TIÊU CHUẨN HIỆN ĐẠI (CLEAN DATA GRID)         */}
          {/* ======================================================== */}
          {viewMode === 'table' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50/90 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nhân viên</th>
                      <th className="py-3 px-4">Ngày làm việc</th>
                      <th className="py-3 px-4">Giờ đến</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4">Thời gian trễ</th>
                      <th className="py-3 px-4">Ghi chú</th>
                      <th className="py-3 px-4">Người ghi nhận</th>
                      <th className="py-3 px-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRecords.map(rec => {
                      const emp = employees.find(e => e.id === rec.employeeId);
                      const isDuplicateDate = (dateEmpFrequency.get(`${rec.employeeId}_${rec.date}`) || 0) > 1;

                      return (
                        <tr 
                          key={rec.id} 
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Employee */}
                          <td className="py-3 px-4">
                            <div 
                              onClick={() => emp && onSelectEmployee(emp)}
                              className="flex items-center space-x-3 cursor-pointer"
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
                                  <span className="font-mono text-slate-600 font-semibold">{rec.employeeCode}</span> • {emp?.department}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{formatDateVN(rec.date)}</div>
                            {isDuplicateDate && (
                              <span 
                                className="inline-flex items-center space-x-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 mt-0.5"
                                title="Nhân viên này có nhiều hơn 1 bản ghi trong ngày"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                <span>Đa bản ghi</span>
                              </span>
                            )}
                          </td>

                          {/* Arrival Time */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                            {rec.arrivalTime}
                          </td>

                          {/* Status */}
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
                              <span className="text-amber-700 font-semibold">
                                +{formatLateDuration(rec.lateSeconds)}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">-</span>
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
                            <div className="text-[10px] text-slate-400 font-mono">
                              {new Date(rec.createdAt).toLocaleDateString('vi-VN')} {new Date(rec.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center space-x-1">
                              <button
                                onClick={() => setInspectingRecord(rec)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onEditRecord(rec)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Sửa bản ghi"
                              >
                                <FileEdit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xóa bản ghi ngày ${formatDateVN(rec.date)} của nhân viên ${rec.employeeCode}?`)) {
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
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* MẪU 3: DẠNG THẺ TRỰC QUAN (CARDS GRID)                    */}
          {/* ======================================================== */}
          {viewMode === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecords.map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                const isDuplicateDate = (dateEmpFrequency.get(`${rec.employeeId}_${rec.date}`) || 0) > 1;

                return (
                  <div 
                    key={rec.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                      rec.isLate ? 'border-amber-200' : 'border-slate-200/90'
                    }`}
                  >
                    <div>
                      {/* Card Top: Employee Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div 
                          onClick={() => emp && onSelectEmployee(emp)}
                          className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0"
                        >
                          <img
                            src={emp?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm truncate">
                              {emp?.fullName || rec.employeeCode}
                            </h4>
                            <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded font-semibold">
                                {rec.employeeCode}
                              </span>
                              <span>•</span>
                              <span className="truncate">{emp?.department}</span>
                            </div>
                          </div>
                        </div>

                        {/* Date badge */}
                        <div className="text-right shrink-0">
                          <span className="text-xs font-semibold text-slate-700 block">
                            {formatDateVN(rec.date)}
                          </span>
                          {isDuplicateDate && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                              Đa bản ghi
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Middle: Time & Status */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Giờ đến</span>
                          <span className="font-mono text-base font-bold text-slate-900 block mt-0.5">
                            {rec.arrivalTime}
                          </span>
                        </div>

                        <div className="text-right">
                          {rec.isLate ? (
                            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Trễ +{formatLateDuration(rec.lateSeconds)}</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đúng giờ</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Notes */}
                      <div className="mt-3 text-xs text-slate-600 min-h-[38px]">
                        {rec.notes ? (
                          <p className="line-clamp-2 italic text-slate-700 bg-slate-50/60 p-2 rounded-lg border border-slate-100" title={rec.notes}>
                            "{rec.notes}"
                          </p>
                        ) : (
                          <p className="text-slate-400 italic text-[11px] pt-1">
                            Không có ghi chú
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Meta & Action buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px]">Bởi: {rec.createdBy}</span>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setInspectingRecord(rec)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onEditRecord(rec)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <FileEdit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa bản ghi ngày ${formatDateVN(rec.date)} của nhân viên ${rec.employeeCode}?`)) {
                              onDeleteRecord(rec.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Record Inspection Modal / Drawer */}
      <RecordDetailModal
        isOpen={!!inspectingRecord}
        onClose={() => setInspectingRecord(null)}
        record={inspectingRecord}
        employee={inspectingEmployee}
        thresholdTime={thresholdTime}
        onEdit={(rec) => {
          setInspectingRecord(null);
          onEditRecord(rec);
        }}
        onDelete={(id) => {
          setInspectingRecord(null);
          onDeleteRecord(id);
        }}
        onSelectEmployee={onSelectEmployee}
      />

    </div>
  );
};
