import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Filter, 
  Calendar, 
  Clock, 
  Users, 
  Building,
  ChevronRight,
  X,
  FileSpreadsheet,
  CalendarRange,
  UserCheck,
  Info
} from 'lucide-react';
import { Employee, ArrivalRecord, Department } from '../types';
import { 
  formatDateVN, 
  exportToExcel, 
  getVietnamToday, 
  subtractDays, 
  subtractMonths, 
  getQuarterDateRange,
  formatPriorNoticeText,
  formatNoticeMethodText
} from '../utils/helpers';

interface ReportsTabProps {
  employees: Employee[];
  records: ArrivalRecord[];
  thresholdTime: string;
}

export type TimePreset = 
  | '1_day' 
  | '7_days' 
  | '14_days' 
  | '1_month' 
  | '3_months' 
  | 'quarter' 
  | 'custom';

export const ReportsTab: React.FC<ReportsTabProps> = ({
  employees,
  records,
  thresholdTime,
}) => {
  // Lấy ngày hiện tại theo giờ địa phương Việt Nam (Asia/Ho_Chi_Minh)
  const todayVN = getVietnamToday();
  const currentYear = parseInt(todayVN.slice(0, 4), 10);
  const currentMonth = parseInt(todayVN.slice(5, 7), 10);
  const currentQuarter = Math.ceil(currentMonth / 3);

  // Time Filter State: Mặc định 14 ngày qua
  const [timePreset, setTimePreset] = useState<TimePreset>('14_days');
  const [startDate, setStartDate] = useState<string>(() => subtractDays(getVietnamToday(), 13));
  const [endDate, setEndDate] = useState<string>(() => getVietnamToday());

  // Quarter selector state
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentQuarter);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Filters for Department, Employee, and Prior Notice Status
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('all');
  const [selectedPriorNotice, setSelectedPriorNotice] = useState<string>('all'); // 'all' | 'reported' | 'unreported' | 'unverified'

  // View modes
  const [reportView, setReportView] = useState<'by_employee' | 'by_department' | 'by_date' | 'detailed_raw'>('by_employee');
  const [copied, setCopied] = useState(false);

  // Drilldown modal state
  const [drilldownEmpId, setDrilldownEmpId] = useState<string | null>(null);

  const departments: Department[] = [
    'Kế toán',
    'Hành chính Nhân sự',
    'Kinh doanh & Marketing',
    'Kỹ thuật & Công nghệ',
    'Vận hành',
    'Ban Giám đốc',
  ];

  // Danh sách các năm cho bộ lọc Quý
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  // Xử lý chọn nhanh các khoảng thời gian
  const handleSelectPreset = (preset: '1_day' | '7_days' | '14_days' | '1_month' | '3_months') => {
    const today = getVietnamToday();
    setTimePreset(preset);
    setEndDate(today);
    if (preset === '1_day') {
      setStartDate(today);
    } else if (preset === '7_days') {
      setStartDate(subtractDays(today, 6));
    } else if (preset === '14_days') {
      setStartDate(subtractDays(today, 13));
    } else if (preset === '1_month') {
      setStartDate(subtractMonths(today, 1));
    } else if (preset === '3_months') {
      setStartDate(subtractMonths(today, 3));
    }
  };

  // Xử lý chọn Quý theo Năm
  const handleSelectQuarter = (quarter: number, year: number) => {
    setTimePreset('quarter');
    setSelectedQuarter(quarter);
    setSelectedYear(year);
    const range = getQuarterDateRange(quarter, year);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  // Nhãn hiển thị kỳ báo cáo hiện tại
  const periodLabel = useMemo(() => {
    if (timePreset === '1_day') return `1 ngày qua (${formatDateVN(startDate)})`;
    if (timePreset === '7_days') return `7 ngày qua (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
    if (timePreset === '14_days') return `14 ngày qua (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
    if (timePreset === '1_month') return `1 tháng qua (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
    if (timePreset === '3_months') return `3 tháng qua (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
    if (timePreset === 'quarter') return `Quý ${selectedQuarter}/${selectedYear} (${formatDateVN(startDate)} - ${formatDateVN(endDate)})`;
    return `${formatDateVN(startDate)} - ${formatDateVN(endDate)}`;
  }, [timePreset, startDate, endDate, selectedQuarter, selectedYear]);

  // Lọc bản ghi dựa trên khoảng thời gian, phòng ban, nhân viên và trạng thái báo trước
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Khoảng thời gian chính xác
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // 2. Nhân viên
      if (selectedEmployeeId !== 'all' && r.employeeId !== selectedEmployeeId) {
        return false;
      }

      // 3. Phòng ban
      const emp = employees.find(e => e.id === r.employeeId);
      if (selectedDept !== 'all' && emp?.department !== selectedDept) {
        return false;
      }

      // 4. Trạng thái báo trước với Hành chính (các bản ghi cũ chưa có thông tin coi là unverified)
      if (selectedPriorNotice !== 'all') {
        const noticeStatus = r.priorNoticeStatus || 'unverified';
        if (noticeStatus !== selectedPriorNotice) return false;
      }

      return true;
    });
  }, [records, employees, startDate, endDate, selectedDept, selectedEmployeeId, selectedPriorNotice]);

  // Kiểm tra xem có đang lọc theo 1 nhân viên cụ thể hay không
  const isSingleEmployeeSelected = selectedEmployeeId !== 'all';
  const selectedEmployeeObj = isSingleEmployeeSelected ? employees.find(e => e.id === selectedEmployeeId) : null;

  // Thống kê cá nhân: Tổng thời gian đi trễ của cá nhân (Chỉ tính khi có nhân viên cụ thể)
  const singleEmployeeLateMinutes = useMemo(() => {
    if (!isSingleEmployeeSelected) return null;
    return Math.round(
      filteredRecords.reduce((sum, r) => sum + (r.isLate ? r.lateSeconds : 0), 0) / 60
    );
  }, [isSingleEmployeeSelected, filteredRecords]);

  // Bảng tổng hợp theo Nhân viên
  const employeeReport = useMemo(() => {
    const map: Record<string, {
      employee: Employee;
      totalCheckins: number;
      lateCount: number;
      onTimeCount: number;
      totalLateMinutes: number; // Tổng thời gian trễ cá nhân
      records: ArrivalRecord[];
    }> = {};

    employees.forEach(emp => {
      if (
        (selectedDept === 'all' || emp.department === selectedDept) &&
        (selectedEmployeeId === 'all' || emp.id === selectedEmployeeId)
      ) {
        map[emp.id] = {
          employee: emp,
          totalCheckins: 0,
          lateCount: 0,
          onTimeCount: 0,
          totalLateMinutes: 0,
          records: [],
        };
      }
    });

    filteredRecords.forEach(r => {
      if (map[r.employeeId]) {
        map[r.employeeId].totalCheckins += 1;
        map[r.employeeId].records.push(r);
        if (r.isLate) {
          map[r.employeeId].lateCount += 1;
          // Tính tổng thời gian trễ của riêng cá nhân này
          map[r.employeeId].totalLateMinutes += Math.round(r.lateSeconds / 60);
        } else {
          map[r.employeeId].onTimeCount += 1;
        }
      }
    });

    return Object.values(map)
      .sort((a, b) => b.lateCount - a.lateCount || b.totalLateMinutes - a.totalLateMinutes);
  }, [employees, filteredRecords, selectedDept, selectedEmployeeId]);

  // Bảng tổng hợp theo Phòng ban
  // QUY TẮC: Với phòng ban hoặc toàn công ty, KHÔNG tính hoặc hiển thị tổng thời gian đi trễ cộng dồn.
  // Chỉ hiển thị số lượt đi trễ và danh sách chi tiết (mỗi lượt hiển thị số phút trễ riêng).
  const departmentReport = useMemo(() => {
    const deptMap: Record<string, {
      department: string;
      totalEmployees: number;
      totalCheckins: number;
      lateCount: number; // Số lượt đi trễ
      onTimeCount: number;
      lateEmployees: Set<string>;
      lateIncidents: {
        employeeName: string;
        employeeCode: string;
        date: string;
        arrivalTime: string;
        lateMinutes: number;
      }[];
    }> = {};

    departments.forEach(dept => {
      if (selectedDept === 'all' || selectedDept === dept) {
        const empsInDept = employees.filter(e => e.department === dept);
        deptMap[dept] = {
          department: dept,
          totalEmployees: empsInDept.length,
          totalCheckins: 0,
          lateCount: 0,
          onTimeCount: 0,
          lateEmployees: new Set(),
          lateIncidents: [],
        };
      }
    });

    filteredRecords.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      if (emp && deptMap[emp.department]) {
        deptMap[emp.department].totalCheckins += 1;
        if (r.isLate) {
          deptMap[emp.department].lateCount += 1;
          deptMap[emp.department].lateEmployees.add(emp.id);
          deptMap[emp.department].lateIncidents.push({
            employeeName: emp.fullName,
            employeeCode: emp.code,
            date: r.date,
            arrivalTime: r.arrivalTime,
            lateMinutes: Math.round(r.lateSeconds / 60),
          });
        } else {
          deptMap[emp.department].onTimeCount += 1;
        }
      }
    });

    return Object.values(deptMap);
  }, [employees, filteredRecords, selectedDept, departments]);

  // Bảng tổng hợp theo Ngày làm việc
  // QUY TẮC: Không tính tổng thời gian cộng dồn cho cả ngày; mỗi lượt hiển thị số phút trễ riêng.
  const dateReport = useMemo(() => {
    const map: Record<string, {
      date: string;
      totalCheckins: number;
      lateCount: number;
      onTimeCount: number;
      lateDetails: {
        employeeName: string;
        employeeCode: string;
        arrivalTime: string;
        lateMinutes: number;
      }[];
    }> = {};

    filteredRecords.forEach(r => {
      if (!map[r.date]) {
        map[r.date] = {
          date: r.date,
          totalCheckins: 0,
          lateCount: 0,
          onTimeCount: 0,
          lateDetails: [],
        };
      }
      map[r.date].totalCheckins += 1;
      if (r.isLate) {
        map[r.date].lateCount += 1;
        const emp = employees.find(e => e.id === r.employeeId);
        map[r.date].lateDetails.push({
          employeeName: emp?.fullName || r.employeeCode,
          employeeCode: r.employeeCode,
          arrivalTime: r.arrivalTime,
          lateMinutes: Math.round(r.lateSeconds / 60),
        });
      } else {
        map[r.date].onTimeCount += 1;
      }
    });

    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredRecords, employees]);

  // Tổng số liệu chung
  const totalLateInFilter = filteredRecords.filter(r => r.isLate).length;
  const distinctLateEmployeesInFilter = new Set(
    filteredRecords.filter(r => r.isLate).map(r => r.employeeId)
  ).size;
  const onTimeCountInFilter = filteredRecords.filter(r => !r.isLate).length;
  const onTimeRate = filteredRecords.length > 0 
    ? Math.round((onTimeCountInFilter / filteredRecords.length) * 100) 
    : 100;

  // Xuất Excel: Tuân thủ tuyệt đối quy tắc thời gian và quy tắc không cộng dồn cấp phòng ban/công ty
  const handleExportExcel = () => {
    const timeStr = `${startDate}_den_${endDate}`;
    
    if (reportView === 'by_employee') {
      const filename = `Bao_Cao_Di_Tre_Theo_Nhan_Vien_${timeStr}.xlsx`;
      const headers = [
        'STT',
        'Mã nhân viên',
        'Họ và tên',
        'Tên tiếng Anh',
        'Phòng ban',
        'Chức vụ',
        'Số lượt đi trễ',
        'Tổng thời gian trễ cá nhân (phút)',
        'Số lượt đúng giờ',
        'Tổng số ca chấm'
      ];
      const rows = employeeReport.map((item, idx) => [
        idx + 1,
        item.employee.code,
        item.employee.fullName,
        item.employee.englishName,
        item.employee.department,
        item.employee.position,
        item.lateCount,
        item.totalLateMinutes,
        item.onTimeCount,
        item.totalCheckins
      ]);
      exportToExcel(filename, 'TheoNhanVien', headers, rows);
    } else if (reportView === 'by_department') {
      const filename = `Bao_Cao_Di_Tre_Theo_Phong_Ban_${timeStr}.xlsx`;
      const headers = [
        'STT',
        'Phòng ban',
        'Tổng nhân sự',
        'Số nhân sự có ca trễ',
        'Tổng số lượt đi trễ',
        'Số ca đúng giờ',
        'Tổng số ca chấm',
        'Chi tiết các ca đi trễ (kèm số phút từng ca)'
      ];
      const rows = departmentReport.map((d, idx) => [
        idx + 1,
        d.department,
        d.totalEmployees,
        d.lateEmployees.size,
        d.lateCount,
        d.onTimeCount,
        d.totalCheckins,
        d.lateIncidents.map(inc => `${inc.employeeName} (${formatDateVN(inc.date)} ${inc.arrivalTime}, trễ ${inc.lateMinutes}p)`).join('; ')
      ]);
      exportToExcel(filename, 'TheoPhongBan', headers, rows);
    } else if (reportView === 'by_date') {
      const filename = `Bao_Cao_Di_Tre_Theo_Ngay_${timeStr}.xlsx`;
      const headers = [
        'STT',
        'Ngày làm việc',
        'Số lượt đi trễ',
        'Số ca đúng giờ',
        'Tổng số ca chấm',
        'Chi tiết các ca đi trễ (kèm số phút từng ca)'
      ];
      const rows = dateReport.map((d, idx) => [
        idx + 1,
        formatDateVN(d.date),
        d.lateCount,
        d.onTimeCount,
        d.totalCheckins,
        d.lateDetails.map(det => `${det.employeeName} (${det.arrivalTime}, trễ ${det.lateMinutes}p)`).join('; ')
      ]);
      exportToExcel(filename, 'TheoNgay', headers, rows);
    } else {
      const filename = `Nhat_Ky_Chi_Tiet_Cham_Cong_${timeStr}.xlsx`;
      const headers = [
        'STT',
        'Mã nhân viên',
        'Họ và tên',
        'Phòng ban',
        'Ngày làm việc',
        'Giờ đến',
        'Trạng thái',
        'Thời gian trễ từng ca (phút)',
        'Đã báo trước?',
        'Thời điểm báo',
        'Hình thức báo',
        'Ghi chú',
        'Người ghi nhận'
      ];
      const rows = filteredRecords.map((r, idx) => {
        const emp = employees.find(e => e.id === r.employeeId);
        return [
          idx + 1,
          r.employeeCode,
          emp?.fullName || '',
          emp?.department || '',
          formatDateVN(r.date),
          r.arrivalTime,
          r.isLate ? 'Đi trễ' : 'Đúng giờ',
          r.isLate ? Math.round(r.lateSeconds / 60) : 0,
          formatPriorNoticeText(r.priorNoticeStatus),
          r.noticeTime || '',
          formatNoticeMethodText(r.noticeMethod),
          r.notes || '',
          r.createdBy
        ];
      });
      exportToExcel(filename, 'NhatKyChiTiet', headers, rows);
    }
  };

  // Copy data to clipboard (TSV format)
  const handleCopyClipboard = () => {
    let tsv = '';
    if (reportView === 'by_employee') {
      tsv = ['Mã NV\tHọ Tên\tPhòng Ban\tLượt Trễ\tPhút Trễ Cá Nhân\tĐúng Giờ\tTổng Ca']
        .concat(
          employeeReport.map(item => 
            `${item.employee.code}\t${item.employee.fullName}\t${item.employee.department}\t${item.lateCount}\t${item.totalLateMinutes}\t${item.onTimeCount}\t${item.totalCheckins}`
          )
        ).join('\n');
    } else if (reportView === 'by_department') {
      tsv = ['Phòng Ban\tTổng Nhân Sự\tNV Có Ca Trễ\tTổng Lượt Trễ\tĐúng Giờ\tTổng Ca']
        .concat(
          departmentReport.map(d => 
            `${d.department}\t${d.totalEmployees}\t${d.lateEmployees.size}\t${d.lateCount}\t${d.onTimeCount}\t${d.totalCheckins}`
          )
        ).join('\n');
    } else {
      tsv = ['Mã NV\tHọ Tên\tNgày\tGiờ Đến\tTrạng Thái\tPhút Trễ Riêng\tBáo Trước\tThời Điểm Báo\tHình Thức Báo\tGhi Chú']
        .concat(
          filteredRecords.map(r => {
            const emp = employees.find(e => e.id === r.employeeId);
            return `${r.employeeCode}\t${emp?.fullName}\t${r.date}\t${r.arrivalTime}\t${r.isLate ? 'Trễ' : 'Đúng giờ'}\t${r.isLate ? Math.round(r.lateSeconds/60) : 0}\t${formatPriorNoticeText(r.priorNoticeStatus)}\t${r.noticeTime || ''}\t${formatNoticeMethodText(r.noticeMethod)}\t${r.notes || ''}`;
          })
        ).join('\n');
    }

    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const drilldownEmployee = employees.find(e => e.id === drilldownEmpId);
  const drilldownRecords = drilldownEmpId 
    ? filteredRecords.filter(r => r.employeeId === drilldownEmpId)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex flex-wrap items-center gap-2">
            <span>Báo cáo Thống kê Tình hình Đi trễ VPC</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {periodLabel}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu chính xác theo khoảng thời gian thực tế. Quy chuẩn: Tính tổng thời gian trễ cho từng cá nhân, không cộng dồn cấp phòng ban/công ty.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Xuất file Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            title="Sao chép bảng để dán vào Google Sheets"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép!' : 'Sao chép bảng'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer"
            title="In biểu mẫu"
          >
            <Printer className="w-4 h-4" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Filter and View Mode Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        
        {/* ROW 1: Quick Time Presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <CalendarRange className="w-4 h-4 text-blue-600" />
              <span>Bộ lọc thời gian:</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Ngày địa phương (VN): {formatDateVN(todayVN)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset('1_day')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                timePreset === '1_day'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              1 ngày qua
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('7_days')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                timePreset === '7_days'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              7 ngày qua
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('14_days')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                timePreset === '14_days'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              14 ngày qua
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('1_month')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                timePreset === '1_month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              1 tháng qua
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('3_months')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                timePreset === '3_months'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              3 tháng qua
            </button>

            <button
              type="button"
              onClick={() => handleSelectQuarter(selectedQuarter, selectedYear)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer flex items-center space-x-1 ${
                timePreset === 'quarter'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
              }`}
            >
              <span>Theo Quý</span>
            </button>

            <button
              type="button"
              onClick={() => setTimePreset('custom')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                timePreset === 'custom'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tự chọn khoảng ngày
            </button>
          </div>
        </div>

        {/* ROW 2: Detailed Date Inputs & Quarter Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          {/* Quarter & Year Picker */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Chọn Quý theo Năm:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={selectedQuarter}
                onChange={(e) => {
                  const q = parseInt(e.target.value, 10);
                  handleSelectQuarter(q, selectedYear);
                }}
                className={`w-full px-2 py-1.5 text-xs rounded-lg border font-semibold cursor-pointer ${
                  timePreset === 'quarter' ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <option value={1}>Quý 1 (T1 - T3)</option>
                <option value={2}>Quý 2 (T4 - T6)</option>
                <option value={3}>Quý 3 (T7 - T9)</option>
                <option value={4}>Quý 4 (T10 - T12)</option>
              </select>

              <select
                value={selectedYear}
                onChange={(e) => {
                  const y = parseInt(e.target.value, 10);
                  handleSelectQuarter(selectedQuarter, y);
                }}
                className={`w-full px-2 py-1.5 text-xs rounded-lg border font-semibold cursor-pointer ${
                  timePreset === 'quarter' ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                {availableYears.map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setTimePreset('custom');
              }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setTimePreset('custom');
              }}
              className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white"
            />
          </div>

          {/* View Mode */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Góc nhìn tổng hợp:</label>
            <select
              value={reportView}
              onChange={(e) => setReportView(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs bg-blue-50 border border-blue-200 rounded-lg text-blue-900 font-bold cursor-pointer"
            >
              <option value="by_employee">👤 Tổng hợp theo Nhân viên</option>
              <option value="by_department">🏢 Tổng hợp theo Phòng ban</option>
              <option value="by_date">📅 Tổng hợp theo Ngày làm việc</option>
              <option value="detailed_raw">📋 Nhật ký chi tiết từng ca</option>
            </select>
          </div>

        </div>

        {/* ROW 3: Department, Employee and Prior Notice Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          
          {/* Department Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Lọc theo Phòng ban:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả phòng ban</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Employee Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Lọc theo Nhân viên:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả nhân sự ({employees.length})</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.code} - {e.fullName} ({e.department})</option>
              ))}
            </select>
          </div>

          {/* Prior Notice Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Báo trước với HC:</label>
            <select
              value={selectedPriorNotice}
              onChange={(e) => setSelectedPriorNotice(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
            >
              <option value="all">Tất cả trạng thái báo trước</option>
              <option value="reported">📢 Đã báo trước</option>
              <option value="unreported">🚫 Không báo trước</option>
              <option value="unverified">❓ Chưa xác minh</option>
            </select>
          </div>

        </div>

        {/* Aggregate KPI Strip - Tuân thủ Quy tắc 4 */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          
          {/* KPI 1: Tổng số ca chấm */}
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng ca ghi nhận</span>
            <span className="text-lg font-bold text-slate-900">{filteredRecords.length} ca</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{onTimeCountInFilter} ca đúng giờ</span>
          </div>

          {/* KPI 2: Số lượt đi trễ */}
          <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200">
            <span className="text-[10px] text-amber-800 font-bold uppercase block">Số lượt đi trễ</span>
            <span className="text-lg font-bold text-amber-900">{totalLateInFilter} lượt</span>
            <span className="text-[10px] text-amber-700 block mt-0.5">Trong khoảng thời gian chọn</span>
          </div>

          {/* KPI 3: QUY TẮC: Với 1 nhân viên cụ thể -> hiển thị tổng thời gian trễ cá nhân.
              Với phòng ban/công ty -> KHÔNG tính hoặc hiển thị tổng cộng dồn, chỉ hiển thị số nhân sự có ca trễ */}
          {isSingleEmployeeSelected ? (
            <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-800 font-bold uppercase block">Tổng thời gian trễ cá nhân</span>
              <span className="text-lg font-bold text-rose-900">{singleEmployeeLateMinutes} phút</span>
              <span className="text-[10px] text-rose-700 block mt-0.5 truncate">
                Của {selectedEmployeeObj?.fullName}
              </span>
            </div>
          ) : (
            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200">
              <span className="text-[10px] text-blue-800 font-bold uppercase block">Số nhân sự có ca trễ</span>
              <span className="text-lg font-bold text-blue-900">{distinctLateEmployeesInFilter} người</span>
              <span className="text-[10px] text-blue-700 block mt-0.5">
                (Không cộng dồn phút cấp PB/Cty)
              </span>
            </div>
          )}

          {/* KPI 4: Tỷ lệ đúng giờ */}
          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-[10px] text-emerald-800 font-bold uppercase block">Tỷ lệ đúng giờ</span>
            <span className="text-lg font-bold text-emerald-900">{onTimeRate}%</span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">Ngưỡng chuẩn {thresholdTime}</span>
          </div>

        </div>

      </div>

      {/* Main Report Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 print:p-0 print:border-none print:shadow-none space-y-6">
        
        {/* Letterhead (Print view) */}
        <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm tracking-wide">CÔNG TY CỔ PHẦN VPC (VPC CORPORATION)</h4>
            <p className="text-xs text-slate-500">Phòng Hành chính - Nhân sự & Quản trị Nội bộ</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Ngưỡng giờ đến chuẩn: <strong>{thresholdTime}</strong></div>
            <div>Ngày kết xuất: <strong>{formatDateVN(todayVN)}</strong></div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center py-2">
          <h3 className="text-base sm:text-lg font-extrabold uppercase text-slate-900 tracking-wide">
            {reportView === 'by_employee' && `BÁO CÁO TỔNG HỢP TÌNH HÌNH ĐI TRỄ THEO NHÂN VIÊN`}
            {reportView === 'by_department' && `BÁO CÁO TỔNG HỢP TÌNH HÌNH ĐI TRỄ THEO PHÒNG BAN`}
            {reportView === 'by_date' && `BÁO CÁO TỔNG HỢP TÌNH HÌNH ĐI TRỄ THEO CÁC NGÀY`}
            {reportView === 'detailed_raw' && `NHẬT KÝ CHI TIẾT CÁC CA CHẤM CÔNG VÀ ĐI TRỄ`}
          </h3>
          <p className="text-xs text-blue-700 font-semibold mt-1">
            Khoảng thời gian: Từ ngày {formatDateVN(startDate)} đến ngày {formatDateVN(endDate)} ({periodLabel})
          </p>
        </div>

        {/* TABLE 1: By Employee */}
        {reportView === 'by_employee' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã NV</th>
                  <th className="py-2.5 px-3">Họ và tên</th>
                  <th className="py-2.5 px-3">Tên tiếng Anh</th>
                  <th className="py-2.5 px-3">Phòng ban</th>
                  <th className="py-2.5 px-3 text-center">Số lượt trễ</th>
                  <th className="py-2.5 px-3 text-center">Tổng thời gian trễ cá nhân</th>
                  <th className="py-2.5 px-3 text-center">Đúng giờ</th>
                  <th className="py-2.5 px-3 text-center">Tổng ca chấm</th>
                  <th className="py-2.5 px-3 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {employeeReport.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400">
                      Không có dữ liệu trong khoảng thời gian đã chọn ({formatDateVN(startDate)} - {formatDateVN(endDate)}).
                    </td>
                  </tr>
                ) : (
                  employeeReport.map((item, idx) => (
                    <tr key={item.employee.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.employee.code}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item.employee.fullName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.employee.englishName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{item.employee.department}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {item.lateCount > 0 ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-bold">
                            {item.lateCount} lượt
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-normal">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                        {item.lateCount > 0 ? `${item.totalLateMinutes} phút` : '0 phút'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">
                        {item.onTimeCount} ca
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700 font-medium">
                        {item.totalCheckins} ca
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setDrilldownEmpId(item.employee.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                        >
                          Xem các bản ghi ({item.records.length})
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-300 font-extrabold text-slate-900 bg-slate-50">
                <tr>
                  <td colSpan={5} className="py-3 px-3 text-right uppercase">Tổng cộng:</td>
                  <td className="py-3 px-3 text-center text-amber-800">{totalLateInFilter} lượt trễ</td>
                  {/* QUY TẮC: Với toàn công ty, không hiển thị tổng thời gian đi trễ cộng dồn */}
                  <td className="py-3 px-3 text-center text-slate-400 font-normal italic text-[11px]" title="Theo quy định, không cộng dồn thời gian đi trễ ở cấp toàn công ty">
                    — (Không cộng dồn)
                  </td>
                  <td className="py-3 px-3 text-center text-emerald-700">
                    {onTimeCountInFilter} ca
                  </td>
                  <td className="py-3 px-3 text-center">{filteredRecords.length} ca</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TABLE 2: By Department */}
        {/* QUY TẮC: Với phòng ban hoặc toàn công ty: không tính hoặc hiển thị tổng thời gian đi trễ cộng dồn.
            Chỉ hiển thị số lượt đi trễ và danh sách chi tiết (mỗi lượt hiển thị số phút trễ riêng). */}
        {reportView === 'by_department' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Phòng Ban</th>
                  <th className="py-2.5 px-3 text-center">Tổng nhân sự</th>
                  <th className="py-2.5 px-3 text-center">Số NV có ca trễ</th>
                  <th className="py-2.5 px-3 text-center">Tổng số lượt đi trễ</th>
                  <th className="py-2.5 px-3 text-center">Số ca đúng giờ</th>
                  <th className="py-2.5 px-3 text-center">Tổng số ca chấm</th>
                  <th className="py-2.5 px-3">Chi tiết các ca đi trễ (kèm số phút từng ca)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {departmentReport.map((d, idx) => (
                  <tr key={d.department} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{d.department}</td>
                    <td className="py-2.5 px-3 text-center">{d.totalEmployees} người</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-800">{d.lateEmployees.size} người</td>
                    <td className="py-2.5 px-3 text-center font-bold">
                      {d.lateCount > 0 ? (
                        <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {d.lateCount} lượt
                        </span>
                      ) : (
                        <span className="text-emerald-700">0</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">{d.onTimeCount} ca</td>
                    <td className="py-2.5 px-3 text-center font-semibold">{d.totalCheckins} ca</td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-md">
                      {d.lateIncidents.length > 0 ? (
                        <div className="space-y-1">
                          {d.lateIncidents.slice(0, 3).map((inc, iIdx) => (
                            <div key={iIdx} className="truncate">
                              <span className="font-semibold text-slate-800">{inc.employeeName}</span> ({formatDateVN(inc.date)} {inc.arrivalTime}): <span className="text-amber-700 font-bold">trễ {inc.lateMinutes}p</span>
                            </div>
                          ))}
                          {d.lateIncidents.length > 3 && (
                            <span className="text-blue-600 italic">Và {d.lateIncidents.length - 3} lượt trễ khác...</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-emerald-700 italic">100% đúng giờ trong kỳ</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 3: By Date */}
        {/* QUY TẮC: Với toàn công ty trong ngày, không cộng dồn tổng phút; mỗi lượt hiển thị số phút trễ riêng */}
        {reportView === 'by_date' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Ngày làm việc</th>
                  <th className="py-2.5 px-3 text-center">Số lượt đi trễ</th>
                  <th className="py-2.5 px-3 text-center">Số ca đúng giờ</th>
                  <th className="py-2.5 px-3 text-center">Tổng ca chấm</th>
                  <th className="py-2.5 px-3">Chi tiết nhân sự đi trễ trong ngày (kèm số phút riêng)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dateReport.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Không có dữ liệu trong khoảng thời gian đã chọn ({formatDateVN(startDate)} - {formatDateVN(endDate)}).
                    </td>
                  </tr>
                ) : (
                  dateReport.map((d, idx) => (
                    <tr key={d.date} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{formatDateVN(d.date)}</td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {d.lateCount > 0 ? (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            {d.lateCount} lượt
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-normal">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center text-emerald-700 font-semibold">{d.onTimeCount} ca</td>
                      <td className="py-2.5 px-3 text-center font-medium">{d.totalCheckins} ca</td>
                      <td className="py-2.5 px-3 text-slate-700 text-[11px] max-w-md">
                        {d.lateDetails.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {d.lateDetails.map((det, detIdx) => (
                              <span key={detIdx} className="bg-amber-50 border border-amber-200 text-amber-900 px-2 py-0.5 rounded text-[11px]">
                                <strong>{det.employeeName}</strong> ({det.arrivalTime} - <span className="font-bold text-amber-700">trễ {det.lateMinutes}p</span>)
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Không có ai đi trễ</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TABLE 4: Detailed Raw Log */}
        {reportView === 'detailed_raw' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Mã NV</th>
                  <th className="py-2.5 px-3">Họ và tên</th>
                  <th className="py-2.5 px-3">Phòng ban</th>
                  <th className="py-2.5 px-3">Ngày</th>
                  <th className="py-2.5 px-3">Giờ đến</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3">Thời gian trễ từng ca</th>
                  <th className="py-2.5 px-3">Báo trước với HC</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                  <th className="py-2.5 px-3">Người ghi nhận</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-8 text-center text-slate-400">
                      Không có bản ghi nào trong khoảng thời gian đã chọn ({formatDateVN(startDate)} - {formatDateVN(endDate)}).
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((r, idx) => {
                    const emp = employees.find(e => e.id === r.employeeId);
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{r.employeeCode}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{emp?.fullName}</td>
                        <td className="py-2.5 px-3 text-slate-600">{emp?.department}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">{formatDateVN(r.date)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">{r.arrivalTime}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.isLate ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Đi trễ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Đúng giờ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-amber-800">
                          {r.isLate ? `+${Math.round(r.lateSeconds / 60)} phút` : '-'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.priorNoticeStatus === 'reported' ? (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                Đã báo trước
                              </span>
                              {(r.noticeMethod || r.noticeTime) && (
                                <div className="text-[10px] text-slate-500">
                                  {r.noticeMethod && <span>{formatNoticeMethodText(r.noticeMethod)}</span>}
                                  {r.noticeMethod && r.noticeTime && <span> • </span>}
                                  {r.noticeTime && <span>{r.noticeTime}</span>}
                                </div>
                              )}
                            </div>
                          ) : r.priorNoticeStatus === 'unreported' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              Không báo trước
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              Chưa xác minh
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs truncate text-slate-600">{r.notes || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{r.createdBy}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Corporate Signatures */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-xs">
          <div>
            <p className="font-bold text-slate-800 uppercase">Người Lập Báo Cáo</p>
            <p className="text-[11px] text-slate-400 italic">(Ký & ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-semibold text-slate-700">Phạm Đức Duy</p>
            <p className="text-[11px] text-slate-400">Chuyên viên Chấm công & Hành chính</p>
          </div>

          <div>
            <p className="font-bold text-slate-800 uppercase">Trưởng Phòng Hành Chính Nhân Sự</p>
            <p className="text-[11px] text-slate-400 italic">(Ký & ghi rõ họ tên)</p>
            <div className="h-16" />
            <p className="font-semibold text-slate-700">Lê Thu Hương</p>
            <p className="text-[11px] text-slate-400">Xác nhận tình hình chuyên cần</p>
          </div>
        </div>

      </div>

      {/* Drilldown Modal: Xem chi tiết các bản ghi của một nhân viên cụ thể trong khoảng thời gian chọn */}
      {drilldownEmpId && drilldownEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Chi Tiết Bản Ghi Chấm Công: {drilldownEmployee.fullName}
                </h4>
                <p className="text-xs text-slate-500">
                  Mã: {drilldownEmployee.code} • Phòng ban: {drilldownEmployee.department} • Kỳ: {formatDateVN(startDate)} - {formatDateVN(endDate)}
                </p>
              </div>
              <button
                onClick={() => setDrilldownEmpId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Ngày</th>
                    <th className="py-2 px-3">Giờ đến</th>
                    <th className="py-2 px-3">Trạng thái</th>
                    <th className="py-2 px-3">Thời gian trễ</th>
                    <th className="py-2 px-3">Báo trước với HC</th>
                    <th className="py-2 px-3">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {drilldownRecords.map(r => (
                    <tr key={r.id}>
                      <td className="py-2 px-3 font-semibold">{formatDateVN(r.date)}</td>
                      <td className="py-2 px-3 font-mono font-bold">{r.arrivalTime}</td>
                      <td className="py-2 px-3">
                        {r.isLate ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Đi trễ
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Đúng giờ
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-bold">
                        {r.isLate ? `+${Math.round(r.lateSeconds / 60)} phút` : '-'}
                      </td>
                      <td className="py-2 px-3 whitespace-nowrap">
                        {r.priorNoticeStatus === 'reported' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              Đã báo trước
                            </span>
                            {(r.noticeMethod || r.noticeTime) && (
                              <div className="text-[10px] text-slate-500">
                                {r.noticeMethod && <span>{formatNoticeMethodText(r.noticeMethod)}</span>}
                                {r.noticeMethod && r.noticeTime && <span> • </span>}
                                {r.noticeTime && <span>{r.noticeTime}</span>}
                              </div>
                            )}
                          </div>
                        ) : r.priorNoticeStatus === 'unreported' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            Không báo trước
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Chưa xác minh
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-500">{r.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-600">
                Tổng cộng: <strong className="text-slate-900">{drilldownRecords.length} ca</strong> | Trễ: <strong className="text-amber-700">{drilldownRecords.filter(r => r.isLate).length} lượt</strong> | Tổng phút trễ cá nhân: <strong className="text-rose-700">{Math.round(drilldownRecords.reduce((sum, r) => sum + (r.isLate ? r.lateSeconds : 0), 0) / 60)} phút</strong>
              </div>
              <button
                onClick={() => setDrilldownEmpId(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
