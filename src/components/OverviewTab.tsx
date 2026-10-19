import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Building, 
  ArrowUpRight,
  FileSpreadsheet,
  PlusCircle,
  Filter
} from 'lucide-react';
import { Employee, ArrivalRecord, ActiveTab } from '../types';
import { formatDateVN, formatDateVNDetailed, formatLateDuration } from '../utils/helpers';

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
  // Time period filter: 'month' (Tháng này) | 'week' (7 ngày qua) | 'all' (Tất cả) | 'custom'
  const [timeFilter, setTimeFilter] = useState<'month' | 'week' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-10');

  // Filter records dynamically based on selected period
  const filteredRecords = useMemo(() => {
    if (timeFilter === 'month') {
      return records.filter(r => r.date.startsWith(selectedMonth));
    } else if (timeFilter === 'week') {
      // 7 days up to latest date in records or current date
      const dates = [...new Set(records.map(r => r.date))].sort().reverse().slice(0, 7);
      return records.filter(r => dates.includes(r.date));
    }
    return records;
  }, [records, timeFilter, selectedMonth]);

  // Actual calculated metrics from filtered records
  const totalRecords = filteredRecords.length;
  const lateRecords = filteredRecords.filter(r => r.isLate);
  const onTimeRecords = filteredRecords.filter(r => !r.isLate);
  
  const totalLateCount = lateRecords.length;
  const totalLateSeconds = lateRecords.reduce((sum, r) => sum + r.lateSeconds, 0);
  const totalLateMinutes = Math.round(totalLateSeconds / 60);

  // Distinct employees who had late arrivals in this period
  const lateEmployeeIds = new Set(lateRecords.map(r => r.employeeId));
  const uniqueLateEmployeesCount = lateEmployeeIds.size;

  // Department breakdown of late arrivals
  const deptLateStats = useMemo(() => {
    const stats: Record<string, { totalLate: number; totalMinutes: number }> = {};
    employees.forEach(e => {
      if (!stats[e.department]) stats[e.department] = { totalLate: 0, totalMinutes: 0 };
    });

    lateRecords.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      if (emp && stats[emp.department]) {
        stats[emp.department].totalLate += 1;
        stats[emp.department].totalMinutes += Math.round(r.lateSeconds / 60);
      }
    });

    return stats;
  }, [employees, lateRecords]);

  // Top late employees
  const topLateEmployees = useMemo(() => {
    const map: Record<string, { employee: Employee; count: number; minutes: number }> = {};
    lateRecords.forEach(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      if (emp) {
        if (!map[emp.id]) {
          map[emp.id] = { employee: emp, count: 0, minutes: 0 };
        }
        map[emp.id].count += 1;
        map[emp.id].minutes += Math.round(r.lateSeconds / 60);
      }
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count || b.minutes - a.minutes)
      .slice(0, 5);
  }, [employees, lateRecords]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    const dayMap: Record<string, { date: string; lateCount: number; onTimeCount: number }> = {};
    filteredRecords.forEach(r => {
      if (!dayMap[r.date]) {
        dayMap[r.date] = { date: r.date, lateCount: 0, onTimeCount: 0 };
      }
      if (r.isLate) {
        dayMap[r.date].lateCount += 1;
      } else {
        dayMap[r.date].onTimeCount += 1;
      }
    });

    return Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRecords]);

  // Recent 6 records
  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => new Date(b.date + 'T' + b.arrivalTime).getTime() - new Date(a.date + 'T' + a.arrivalTime).getTime())
      .slice(0, 6);
  }, [records]);

  return (
    <div className="space-y-6">
      
      {/* Time Filter Toolbar */}
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Late Incidents */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Số lượt đi trễ</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-amber-600">{totalLateCount}</span>
            <span className="text-xs text-slate-500 font-medium">lượt ghi nhận</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Trên tổng số <strong>{totalRecords}</strong> lượt chấm công trong kỳ
          </div>
        </div>

        {/* Unique Late Employees */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nhân sự phát sinh đi trễ</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{uniqueLateEmployeesCount}</span>
            <span className="text-xs text-slate-500 font-medium">/ {employees.length} nhân sự</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {uniqueLateEmployeesCount === 0 
              ? 'Tất cả nhân sự đều đến đúng giờ' 
              : `${Math.round((uniqueLateEmployeesCount / Math.max(employees.length, 1)) * 100)}% nhân sự có ca trễ`}
          </div>
        </div>

        {/* Total Late Minutes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng thời gian trễ</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{totalLateMinutes}</span>
            <span className="text-xs text-slate-500 font-medium">phút toàn cty</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Trung bình <strong>{totalLateCount > 0 ? Math.round(totalLateMinutes / totalLateCount) : 0} phút</strong> / ca đi trễ
          </div>
        </div>

        {/* Threshold Reference Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngưỡng giờ đến VPC</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold font-mono text-blue-600">{thresholdTime}</span>
            <span className="text-xs text-blue-600 font-semibold">Đang áp dụng</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Đúng {thresholdTime}: đúng giờ • Lớn hơn {thresholdTime}: đi trễ
          </div>
        </div>

      </div>

      {/* Main Grid: Department Breakdown & Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Department Breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Tình hình Đi trễ theo Phòng ban</h3>
              <p className="text-xs text-slate-500">Số lượt và tổng số phút trễ trong khoảng thời gian đã chọn</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Xem báo cáo chi tiết &rarr;
            </button>
          </div>

          <div className="space-y-4">
            {Object.entries(deptLateStats).map(([dept, data]) => {
              const maxMinutes = Math.max(...Object.values(deptLateStats).map(d => d.totalMinutes), 60);
              const percent = Math.min(100, Math.round((data.totalMinutes / maxMinutes) * 100));
              return (
                <div key={dept} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{dept}</span>
                    </span>
                    <div className="flex items-center space-x-3 text-slate-500">
                      <span><strong className="text-slate-800">{data.totalLate}</strong> lượt</span>
                      <span>•</span>
                      <span><strong className="text-slate-800">{data.totalMinutes}</strong> phút trễ</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        data.totalMinutes > 60 ? 'bg-rose-500' : data.totalMinutes > 20 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent || 2}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Trend Summary Bar */}
          {dailyTrend.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-2">Biến động lượt trễ theo các ngày trong kỳ:</h4>
              <div className="flex items-end space-x-2 h-20 overflow-x-auto pt-2">
                {dailyTrend.map(d => {
                  const maxDayLate = Math.max(...dailyTrend.map(t => t.lateCount), 5);
                  const barHeight = Math.max(12, Math.round((d.lateCount / maxDayLate) * 60));
                  return (
                    <div key={d.date} className="flex flex-col items-center flex-1 min-w-[36px]">
                      <span className="text-[10px] font-bold text-slate-700 mb-1">{d.lateCount}</span>
                      <div 
                        className={`w-full rounded-t transition-all ${d.lateCount > 0 ? 'bg-amber-500' : 'bg-slate-200'}`}
                        style={{ height: `${barHeight}px` }}
                      />
                      <span className="text-[9px] text-slate-400 mt-1 truncate max-w-full">
                        {d.date.slice(8)}/{d.date.slice(5, 7)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Top Late Employees */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Nhân sự phát sinh nhiều lượt trễ</h3>
                <p className="text-xs text-slate-500">Theo dõi chuyên cần để nhắc nhở hành chính</p>
              </div>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>

            {topLateEmployees.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Không có nhân viên nào đi trễ trong kỳ này.
              </div>
            ) : (
              <div className="space-y-3">
                {topLateEmployees.map(({ employee, count, minutes }, idx) => (
                  <div
                    key={employee.id}
                    onClick={() => onSelectEmployee(employee)}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50/40 transition-all cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <img
                        src={employee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h5 className="text-xs font-bold text-slate-900">{employee.fullName}</h5>
                        <p className="text-[11px] text-slate-500">{employee.code} • {employee.department}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-700">{count} lượt</span>
                      <p className="text-[10px] text-slate-400 font-semibold">{minutes} phút</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('employees')}
              className="w-full text-center text-xs text-blue-600 hover:text-blue-800 font-semibold py-1 cursor-pointer"
            >
              Xem toàn bộ danh bạ nhân viên &rarr;
            </button>
          </div>
        </div>

      </div>

      {/* Recent Records Modern Feed */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Ghi nhận Chấm công Gần đây</h3>
            <p className="text-xs text-slate-500 mt-0.5">Các ca ghi nhận mới nhất được cập nhật trên hệ thống</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenRecordModal}
              className="text-xs font-semibold px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors cursor-pointer"
            >
              + Ghi nhận thủ công
            </button>
            <button
              onClick={onOpenExcelModal}
              className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-colors cursor-pointer"
            >
              📥 Nhập Excel
            </button>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs font-semibold px-3 py-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Xem toàn bộ ({records.length}) &rarr;
            </button>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {recentRecords.map(rec => {
            const emp = employees.find(e => e.id === rec.employeeId);
            return (
              <div 
                key={rec.id} 
                className={`py-3.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 rounded-xl transition-colors ${
                  rec.isLate ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
                }`}
              >
                {/* Employee */}
                <div 
                  onClick={() => emp && onSelectEmployee(emp)}
                  className="flex items-center space-x-3 cursor-pointer group flex-1 min-w-0"
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
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-0.5">
                      {emp?.department} • Ngày {formatDateVN(rec.date)}
                    </div>
                  </div>
                </div>

                {/* Arrival Time & Late status */}
                <div className="flex items-center space-x-3 sm:w-56 shrink-0">
                  <div className="font-mono text-sm sm:text-base font-bold text-slate-900">
                    {rec.arrivalTime}
                  </div>

                  {rec.isLate ? (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Trễ +{formatLateDuration(rec.lateSeconds)}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Đúng giờ</span>
                    </span>
                  )}
                </div>

                {/* Notes & CreatedBy */}
                <div className="text-xs text-slate-500 sm:w-48 truncate">
                  {rec.notes ? (
                    <span className="italic text-slate-700">"{rec.notes}"</span>
                  ) : (
                    <span className="text-slate-400">Không có ghi chú</span>
                  )}
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Bởi: {rec.createdBy}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
