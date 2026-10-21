import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Calendar, 
  Building, 
  Filter,
  Search,
  UserCheck
} from 'lucide-react';
import { Employee, ArrivalRecord, ActiveTab } from '../types';
import { formatDateVN, evaluateArrivalLate } from '../utils/helpers';

interface OverviewTabProps {
  employees: Employee[];
  records: ArrivalRecord[];
  thresholdTime: string;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenRecordModal: () => void;
  onOpenExcelModal: () => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  employees,
  records,
  thresholdTime,
  onNavigateTab,
  onOpenRecordModal,
  onOpenExcelModal,
  onSelectEmployee,
}) => {
  // Bộ lọc thời gian hiện có của Dashboard: Theo tháng | 7 ngày gần nhất | Toàn bộ dữ liệu
  const [timeFilter, setTimeFilter] = useState<'month' | 'week' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Bộ lọc phụ cho bảng danh sách nhân viên tra cứu: 'all' | 'late-only' | 'on-time'
  const [empStatusFilter, setEmpStatusFilter] = useState<'all' | 'late-only' | 'on-time'>('all');
  const [empSearchKeyword, setEmpSearchKeyword] = useState<string>('');

  // Hàm kiểm tra ca đi trễ tuân thủ nghiêm ngặt ngưỡng giờ đến hiện tại (Single Source of Truth)
  const isRecordLate = (arrivalTime: string) => {
    return evaluateArrivalLate(arrivalTime, thresholdTime).isLate;
  };

  // 1. Dữ liệu ca chấm công thuộc kỳ đang chọn
  const filteredRecords = useMemo(() => {
    if (timeFilter === 'month') {
      return records.filter(r => r.date.startsWith(selectedMonth));
    } else if (timeFilter === 'week') {
      const dates = [...new Set(records.map(r => r.date))].sort().reverse().slice(0, 7);
      return records.filter(r => dates.includes(r.date));
    }
    return records;
  }, [records, timeFilter, selectedMonth]);

  // Các chỉ số thực tế trong kỳ đang chọn (tuân theo ngưỡng hiện tại)
  const totalRecords = filteredRecords.length;
  const lateRecords = filteredRecords.filter(r => isRecordLate(r.arrivalTime));
  const onTimeRecords = filteredRecords.filter(r => !isRecordLate(r.arrivalTime));
  
  // KPI CHÍNH: Tổng số lượt đi trễ trong kỳ đang chọn
  const totalLateCount = lateRecords.length;

  // Số nhân viên phát sinh đi trễ trong kỳ
  const lateEmployeeIds = new Set(lateRecords.map(r => r.employeeId));
  const uniqueLateEmployeesCount = lateEmployeeIds.size;

  // 2. Thống kê kỳ trước và đối soát mức tăng/giảm (nếu đủ dữ liệu)
  const comparisonStats = useMemo(() => {
    let prevRecords: ArrivalRecord[] = [];
    let currentPeriodLabel = '';
    let prevPeriodLabel = '';

    if (timeFilter === 'month') {
      const [yearStr, monthStr] = selectedMonth.split('-');
      let y = parseInt(yearStr, 10);
      let m = parseInt(monthStr, 10);
      currentPeriodLabel = `Tháng ${m}/${y}`;

      if (m === 1) {
        y -= 1;
        m = 12;
      } else {
        m -= 1;
      }
      const prevMonthStr = `${y}-${String(m).padStart(2, '0')}`;
      prevPeriodLabel = `Tháng ${m}/${y}`;
      prevRecords = records.filter(r => r.date.startsWith(prevMonthStr));
    } else if (timeFilter === 'week') {
      const allDates = [...new Set(records.map(r => r.date))].sort().reverse();
      const prevDates = allDates.slice(7, 14);
      currentPeriodLabel = '7 ngày gần nhất';
      prevPeriodLabel = '7 ngày trước đó';
      prevRecords = records.filter(r => prevDates.includes(r.date));
    } else {
      currentPeriodLabel = 'Toàn bộ dữ liệu';
      prevPeriodLabel = '';
      prevRecords = [];
    }

    const hasPrevData = prevRecords.length > 0;
    const prevLateCount = prevRecords.filter(r => isRecordLate(r.arrivalTime)).length;
    const diff = totalLateCount - prevLateCount;
    const percentChange = prevLateCount > 0 
      ? Math.round(((totalLateCount - prevLateCount) / prevLateCount) * 100) 
      : null;

    return {
      hasPrevData,
      currentPeriodLabel,
      prevPeriodLabel,
      prevLateCount,
      prevTotalCount: prevRecords.length,
      diff,
      percentChange,
    };
  }, [records, timeFilter, selectedMonth, totalLateCount, thresholdTime]);

  // 3. Bảng tổng hợp số lượt đi trễ theo phòng ban
  const deptStats = useMemo(() => {
    const depts = [...new Set(employees.map(e => e.department))];
    
    return depts.map(dept => {
      const deptEmployees = employees.filter(e => e.department === dept);
      const deptEmpIds = new Set(deptEmployees.map(e => e.id));
      const deptRecords = filteredRecords.filter(r => deptEmpIds.has(r.employeeId));
      const deptLateRecords = deptRecords.filter(r => isRecordLate(r.arrivalTime));
      const deptLateEmpIds = new Set(deptLateRecords.map(r => r.employeeId));
      const lateRate = deptRecords.length > 0 
        ? Math.round((deptLateRecords.length / deptRecords.length) * 100) 
        : 0;

      return {
        department: dept,
        totalEmployees: deptEmployees.length,
        lateEmployeesCount: deptLateEmpIds.size,
        totalRecords: deptRecords.length,
        lateRecordsCount: deptLateRecords.length,
        onTimeRecordsCount: deptRecords.length - deptLateRecords.length,
        lateRate,
      };
    }).sort((a, b) => b.lateRecordsCount - a.lateRecordsCount || b.lateEmployeesCount - a.lateEmployeesCount);
  }, [employees, filteredRecords, thresholdTime]);

  // 4. Bảng danh sách nhân viên và số lượt đi trễ trong kỳ (sắp xếp từ nhiều đến ít)
  const employeeLateStats = useMemo(() => {
    return employees.map(emp => {
      const empRecords = filteredRecords.filter(r => r.employeeId === emp.id);
      const empLateRecords = empRecords.filter(r => isRecordLate(r.arrivalTime));
      const lateCount = empLateRecords.length;
      const totalCount = empRecords.length;
      const onTimeCount = totalCount - lateCount;
      const lateRate = totalCount > 0 ? Math.round((lateCount / totalCount) * 100) : 0;

      return {
        employee: emp,
        lateCount,
        onTimeCount,
        totalCount,
        lateRate,
      };
    }).sort((a, b) => {
      // Ưu tiên số lượt đi trễ từ nhiều nhất đến ít nhất
      if (b.lateCount !== a.lateCount) {
        return b.lateCount - a.lateCount;
      }
      // Nếu bằng nhau thì sắp xếp theo tổng số ca và tên tiếng Việt
      if (b.totalCount !== a.totalCount) {
        return b.totalCount - a.totalCount;
      }
      return a.employee.fullName.localeCompare(b.employee.fullName, 'vi');
    });
  }, [employees, filteredRecords, thresholdTime]);

  // Lọc bảng nhân viên theo từ khóa tìm kiếm & trạng thái
  const filteredEmployeeStats = useMemo(() => {
    return employeeLateStats.filter(item => {
      // Lọc trạng thái
      if (empStatusFilter === 'late-only' && item.lateCount === 0) return false;
      if (empStatusFilter === 'on-time' && item.lateCount > 0) return false;

      // Lọc từ khóa
      if (empSearchKeyword.trim()) {
        const kw = empSearchKeyword.trim().toLowerCase();
        const matchName = item.employee.fullName.toLowerCase().includes(kw);
        const matchCode = item.employee.code.toLowerCase().includes(kw);
        const matchDept = item.employee.department.toLowerCase().includes(kw);
        if (!matchName && !matchCode && !matchDept) return false;
      }

      return true;
    });
  }, [employeeLateStats, empStatusFilter, empSearchKeyword]);

  // Các ca chấm công gần nhất
  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.date + 'T' + b.arrivalTime).getTime() - new Date(a.date + 'T' + a.arrivalTime).getTime())
      .slice(0, 5);
  }, [records]);

  return (
    <div className="space-y-6">
      
      {/* 1. Bộ lọc thời gian hiện có */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Khoảng thời gian báo cáo:</span>
          
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50">
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === 'month' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Theo tháng
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === 'week' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              7 ngày gần nhất
            </button>
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                timeFilter === 'all' ? 'bg-white shadow-xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Toàn bộ dữ liệu
            </button>
          </div>
        </div>

        {timeFilter === 'month' && (
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <span className="text-xs text-slate-500">Chọn tháng:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        )}
      </div>

      {/* 2. KHU VỰC THẺ CHỈ SỐ: KPI CHÍNH VÀ CÁC THẺ PHỤ TRỢ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI CHÍNH: TỔNG LƯỢT ĐI TRỄ TRONG KỲ ĐANG CHỌN */}
        <div className="md:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-5 rounded-xl border-2 border-amber-400/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-600 text-white">
                KPI Chính
              </span>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Tổng lượt đi trễ trong kỳ
              </span>
            </div>
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl sm:text-5xl font-black text-amber-700 tracking-tight">
              {totalLateCount}
            </span>
            <span className="text-sm font-bold text-amber-800">
              lượt ghi nhận
            </span>

            {/* Mức tăng/giảm so với kỳ trước nếu đủ dữ liệu */}
            {comparisonStats.hasPrevData ? (
              <div className="ml-auto flex items-center">
                {comparisonStats.diff > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" />
                    +{comparisonStats.diff} lượt {comparisonStats.percentChange !== null ? `(+${comparisonStats.percentChange}%)` : ''}
                  </span>
                ) : comparisonStats.diff < 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <TrendingDown className="w-3.5 h-3.5 mr-1" />
                    {comparisonStats.diff} lượt {comparisonStats.percentChange !== null ? `(${comparisonStats.percentChange}%)` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <Minus className="w-3.5 h-3.5 mr-1" />
                    Không đổi
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1.5">
            <div>
              Kỳ đang chọn: <strong className="text-slate-800">{comparisonStats.currentPeriodLabel}</strong>
              {' '}&bull; Tỷ lệ: <strong>{totalRecords > 0 ? Math.round((totalLateCount / totalRecords) * 100) : 0}%</strong> ({totalLateCount}/{totalRecords} ca chấm công)
            </div>
            <div>
              {comparisonStats.hasPrevData ? (
                <span className="text-slate-500">
                  Kỳ trước ({comparisonStats.prevPeriodLabel}): <strong className="text-slate-700">{comparisonStats.prevLateCount}</strong> lượt trễ
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  {timeFilter === 'all' ? 'Toàn bộ dữ liệu hệ thống' : 'Chưa có đủ dữ liệu kỳ trước để đối soát'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* THẺ PHỤ 1: SỐ LƯỢT ĐẾN ĐÚNG GIỜ */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Lượt đến đúng giờ
              </span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-600">
                {onTimeRecords.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">lượt ghi nhận</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
            {totalRecords > 0 ? (
              <>Tỷ lệ đúng giờ: <strong>{Math.round((onTimeRecords.length / totalRecords) * 100)}%</strong></>
            ) : (
              'Chưa có dữ liệu'
            )}
          </div>
        </div>

        {/* THẺ PHỤ 2: NHÂN SỰ PHÁT SINH ĐI TRỄ & NGƯỠNG VPC */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Nhân sự có ca trễ
              </span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">
                {uniqueLateEmployeesCount}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                / {employees.length} nhân viên
              </span>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span>Ngưỡng áp dụng:</span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              {thresholdTime}
            </span>
          </div>
        </div>

      </div>

      {/* 3. BẢNG TỔNG HỢP SỐ LƯỢT ĐI TRỄ THEO PHÒNG BAN */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Tổng hợp Số lượt Đi trễ theo Phòng ban</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Thống kê tổng số lượt trễ của từng phòng ban trong kỳ đang chọn (không tính phút cộng dồn)
            </p>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto font-medium">
            Tổng cộng: <strong className="text-amber-700">{totalLateCount}</strong> lượt trễ toàn công ty
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Phòng ban</th>
                <th className="py-2.5 px-3 text-center">Quy mô nhân sự</th>
                <th className="py-2.5 px-3 text-center">Nhân sự có ca trễ</th>
                <th className="py-2.5 px-3 text-center">Tổng ca chấm công</th>
                <th className="py-2.5 px-3 text-center font-bold text-amber-700">Tổng lượt đi trễ</th>
                <th className="py-2.5 px-3 text-center">Lượt đúng giờ</th>
                <th className="py-2.5 px-3 text-center">Tỷ lệ ca trễ</th>
                <th className="py-2.5 px-3">Mức độ phân bổ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {deptStats.map(item => {
                const maxLate = Math.max(...deptStats.map(d => d.lateRecordsCount), 1);
                const percent = Math.min(100, Math.round((item.lateRecordsCount / maxLate) * 100));

                return (
                  <tr key={item.department} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>{item.department}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                      {item.totalEmployees} nhân sự
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {item.lateEmployeesCount > 0 ? (
                        <span className="font-semibold text-amber-800">
                          {item.lateEmployeesCount} / {item.totalEmployees}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium">0 / {item.totalEmployees}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                      {item.totalRecords} ca
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                        item.lateRecordsCount > 0 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-emerald-100 text-emerald-800 font-bold'
                      }`}>
                        {item.lateRecordsCount} lượt
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-slate-600 whitespace-nowrap">
                      {item.onTimeRecordsCount} ca
                    </td>
                    <td className="py-3 px-3 text-center font-semibold whitespace-nowrap">
                      {item.lateRate > 0 ? (
                        <span className="text-amber-700">{item.lateRate}%</span>
                      ) : (
                        <span className="text-emerald-700">0%</span>
                      )}
                    </td>
                    <td className="py-3 px-3 min-w-[140px]">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            item.lateRecordsCount > 5 ? 'bg-rose-500' : item.lateRecordsCount > 2 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${item.lateRecordsCount === 0 ? 0 : percent}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BẢNG DANH SÁCH NHÂN VIÊN VÀ SỐ LƯỢT ĐI TRỄ TRONG KỲ (SẮP XẾP TỪ NHIỀU ĐẾN ÍT) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center space-x-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span>Bảng theo dõi Số lượt Đi trễ theo Từng Nhân viên</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Danh sách quy mô toàn công ty, được sắp xếp từ nhiều lượt trễ nhất đến ít nhất để Hành chính dễ tra cứu
            </p>
          </div>

          {/* Công cụ tìm kiếm & lọc nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên, mã NV, phòng ban..."
                value={empSearchKeyword}
                onChange={(e) => setEmpSearchKeyword(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                onClick={() => setEmpStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  empStatusFilter === 'all' 
                    ? 'bg-white shadow-xs text-blue-700 font-bold' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Tất cả ({employeeLateStats.length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('late-only')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  empStatusFilter === 'late-only' 
                    ? 'bg-white shadow-xs text-amber-700 font-bold' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Có đi trễ ({employeeLateStats.filter(e => e.lateCount > 0).length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('on-time')}
                className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  empStatusFilter === 'on-time' 
                    ? 'bg-white shadow-xs text-emerald-700 font-bold' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Đúng giờ ({employeeLateStats.filter(e => e.lateCount === 0).length})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 text-center w-12">Hạng</th>
                <th className="py-2.5 px-3">Nhân viên</th>
                <th className="py-2.5 px-3">Phòng ban</th>
                <th className="py-2.5 px-3">Chức vụ</th>
                <th className="py-2.5 px-3 text-center font-bold text-amber-700">Số lượt đi trễ</th>
                <th className="py-2.5 px-3 text-center">Số lượt đúng giờ</th>
                <th className="py-2.5 px-3 text-center">Tổng ca chấm công</th>
                <th className="py-2.5 px-3 text-center">Tỷ lệ ca trễ</th>
                <th className="py-2.5 px-3 text-center">Tình trạng chuyên cần</th>
                <th className="py-2.5 px-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredEmployeeStats.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Không tìm thấy nhân viên phù hợp với tiêu chí lọc.
                  </td>
                </tr>
              ) : (
                filteredEmployeeStats.map((item, index) => {
                  const isTopRanked = item.lateCount > 0 && index < 3 && empStatusFilter !== 'on-time';

                  return (
                    <tr 
                      key={item.employee.id}
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectEmployee(item.employee)}
                    >
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold ${
                          isTopRanked && index === 0
                            ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                            : isTopRanked && index === 1
                            ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                            : isTopRanked && index === 2
                            ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-300'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2.5">
                          <img
                            src={item.employee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {item.employee.fullName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {item.employee.code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                        {item.employee.department}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {item.employee.position}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black ${
                          item.lateCount >= 3
                            ? 'bg-rose-100 text-rose-800'
                            : item.lateCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600 font-semibold'
                        }`}>
                          {item.lateCount} lượt
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap">
                        {item.onTimeCount} ca
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600 whitespace-nowrap">
                        {item.totalCount} ca
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.lateRate > 0 ? (
                          <span className={`font-bold ${item.lateRate >= 30 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {item.lateRate}%
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium">0%</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.lateCount >= 3 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Cần nhắc nhở
                          </span>
                        ) : item.lateCount > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Có ca trễ
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <UserCheck className="w-3 h-3 mr-1" />
                            Đúng giờ tuyệt đối
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(item.employee);
                          }}
                          className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          Hồ sơ &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. GHI NHẬN CHẤM CÔNG GẦN ĐÂY */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Ghi nhận Chấm công Mới nhất
            </h3>
            <p className="text-xs text-slate-500">
              Các ca quét vân tay / chấm công mới nhất được cập nhật trên hệ thống VPC
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenRecordModal}
              className="text-xs font-semibold px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors cursor-pointer"
            >
              + Ghi nhận thủ công
            </button>
            <button
              onClick={onOpenExcelModal}
              className="text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
            >
              📥 Nhập Excel
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-semibold px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Xem tất cả ({records.length}) &rarr;
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-y border-slate-200 text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Nhân viên</th>
                <th className="py-2.5 px-3">Ngày làm việc</th>
                <th className="py-2.5 px-3">Giờ đến</th>
                <th className="py-2.5 px-3">Trạng thái</th>
                <th className="py-2.5 px-3">Ghi chú</th>
                <th className="py-2.5 px-3">Người ghi nhận</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentRecords.map(rec => {
                const emp = employees.find(e => e.id === rec.employeeId);
                const isLate = isRecordLate(rec.arrivalTime);

                return (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={emp?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{emp?.fullName || rec.employeeCode}</div>
                          <div className="text-[11px] text-slate-400">{rec.employeeCode} &bull; {emp?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium whitespace-nowrap">
                      {formatDateVN(rec.date)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap text-slate-800">
                      {rec.arrivalTime}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {isLate ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            Đi trễ
                          </span>
                          <div className="text-[10px]">
                            {rec.priorNoticeStatus === 'reported' ? (
                              <span className="text-blue-700 font-semibold">Đã báo trước</span>
                            ) : rec.priorNoticeStatus === 'unreported' ? (
                              <span className="text-rose-600 font-semibold">Không báo</span>
                            ) : (
                              <span className="text-slate-400">Chưa xác minh</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Đúng giờ
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 max-w-xs truncate text-slate-600" title={rec.notes}>
                      {rec.notes || <span className="text-slate-400 italic">Không có</span>}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {rec.createdBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
