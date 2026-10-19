import React, { useState, useMemo } from 'react';
import { 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Clock, 
  LayoutGrid, 
  List, 
  FileEdit, 
  Trash2, 
  ChevronRight,
  UserCheck,
  X
} from 'lucide-react';
import { Employee, ArrivalRecord, Department } from '../types';
import { formatDateVN } from '../utils/helpers';

interface EmployeeDirectoryTabProps {
  employees: Employee[];
  records: ArrivalRecord[];
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onSelectEmployeeDetail: (employee: Employee) => void;
}

export const EmployeeDirectoryTab: React.FC<EmployeeDirectoryTabProps> = ({
  employees,
  records,
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onSelectEmployeeDetail,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const departments: Department[] = [
    'Kế toán',
    'Hành chính Nhân sự',
    'Kinh doanh & Marketing',
    'Kỹ thuật & Công nghệ',
    'Vận hành',
    'Ban Giám đốc',
  ];

  // Calculate actual attendance & late statistics per employee
  const employeeStats = useMemo(() => {
    const stats: Record<string, { totalLate: number; totalMinutes: number; totalRecords: number }> = {};
    employees.forEach(emp => {
      stats[emp.id] = { totalLate: 0, totalMinutes: 0, totalRecords: 0 };
    });

    records.forEach(rec => {
      if (stats[rec.employeeId]) {
        stats[rec.employeeId].totalRecords += 1;
        if (rec.isLate) {
          stats[rec.employeeId].totalLate += 1;
          stats[rec.employeeId].totalMinutes += Math.round(rec.lateSeconds / 60);
        }
      }
    });

    return stats;
  }, [employees, records]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = emp.fullName.toLowerCase().includes(term);
        const matchesEnglish = emp.englishName.toLowerCase().includes(term);
        const matchesCode = emp.code.toLowerCase().includes(term);
        const matchesPosition = emp.position.toLowerCase().includes(term);
        if (!matchesName && !matchesEnglish && !matchesCode && !matchesPosition) {
          return false;
        }
      }

      if (selectedDept !== 'all' && emp.department !== selectedDept) {
        return false;
      }

      if (selectedStatus !== 'all' && emp.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  return (
    <div className="space-y-5">
      
      {/* Top Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Danh bạ Nhân sự Công ty VPC</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {filteredEmployees.length} nhân sự
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý mã nhân viên, họ tên tiếng Việt, tên tiếng Anh, phòng ban và theo dõi tình hình đi trễ
          </p>
        </div>

        <button
          onClick={onAddEmployee}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Thêm nhân viên mới</span>
        </button>
      </div>

      {/* Filter and View mode Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã NV, tên Việt, tên Anh, vị trí..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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

          {/* Department Select */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            <option value="all">Tất cả phòng ban</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status Select */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 cursor-pointer font-medium"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang làm việc</option>
            <option value="inactive">Không còn làm việc</option>
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Dạng thẻ lưới"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-700'
            }`}
            title="Dạng bảng chi tiết"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map(emp => {
            const stats = employeeStats[emp.id] || { totalLate: 0, totalMinutes: 0, totalRecords: 0 };
            return (
              <div
                key={emp.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={emp.fullName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm leading-tight">{emp.fullName}</h4>
                        <div className="text-xs text-slate-500 font-medium">{emp.englishName}</div>
                        <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                          {emp.code}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      emp.status === 'active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {emp.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-800">{emp.position}</span>
                      <span className="text-slate-400">•</span>
                      <span>{emp.department}</span>
                    </div>

                    {emp.email && (
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{emp.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Attendance Performance Card */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Số lượt đi trễ</span>
                      <span className={`font-bold text-sm ${stats.totalLate > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {stats.totalLate} ca
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tổng phút trễ</span>
                      <span className="font-bold text-sm text-slate-800">{stats.totalMinutes} phút</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onSelectEmployeeDetail(emp)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Lịch sử chấm công</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => onEditEmployee(emp)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Sửa thông tin"
                    >
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xóa nhân viên ${emp.fullName} (${emp.code})? Hành động này không thể hoàn tác.`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa nhân viên"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Mã NV</th>
                  <th className="py-3 px-4">Họ và tên tiếng Việt</th>
                  <th className="py-3 px-4">Họ tên tiếng Anh</th>
                  <th className="py-3 px-4">Phòng ban & Vị trí</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-center">Số lượt đi trễ</th>
                  <th className="py-3 px-4 text-center">Tổng phút trễ</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEmployees.map(emp => {
                  const stats = employeeStats[emp.id] || { totalLate: 0, totalMinutes: 0, totalRecords: 0 };
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {emp.code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{emp.fullName}</div>
                        {emp.email && <div className="text-[11px] text-slate-400">{emp.email}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {emp.englishName}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{emp.position}</div>
                        <div className="text-[11px] text-slate-500">{emp.department}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          emp.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.status === 'active' ? 'Đang làm việc' : 'Đã nghỉ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold">
                        {stats.totalLate > 0 ? (
                          <span className="text-amber-600">{stats.totalLate} ca</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {stats.totalMinutes} phút
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1">
                          <button
                            onClick={() => onSelectEmployeeDetail(emp)}
                            className="px-2 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          >
                            Chi tiết
                          </button>
                          <button
                            onClick={() => onEditEmployee(emp)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded"
                          >
                            <FileEdit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa nhân viên ${emp.fullName}?`)) {
                                onDeleteEmployee(emp.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
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

    </div>
  );
};
