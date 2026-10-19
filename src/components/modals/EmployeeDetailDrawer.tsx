import React from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  Building, 
  Calendar, 
  Clock, 
  PlusCircle, 
  FileEdit, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { Employee, ArrivalRecord } from '../../types';
import { formatDateVN } from '../../utils/helpers';

interface EmployeeDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  records: ArrivalRecord[];
  onAddRecordForEmp: (empId: string) => void;
  onEditEmployee: (emp: Employee) => void;
}

export const EmployeeDetailDrawer: React.FC<EmployeeDetailDrawerProps> = ({
  isOpen,
  onClose,
  employee,
  records,
  onAddRecordForEmp,
  onEditEmployee,
}) => {
  if (!isOpen || !employee) return null;

  const empRecords = records
    .filter(r => r.employeeId === employee.id)
    .sort((a, b) => new Date(b.date + 'T' + b.arrivalTime).getTime() - new Date(a.date + 'T' + a.arrivalTime).getTime());

  const totalLateCount = empRecords.filter(r => r.isLate).length;
  const onTimeCount = empRecords.filter(r => !r.isLate).length;
  const totalLateSeconds = empRecords.reduce((sum, r) => sum + (r.isLate ? r.lateSeconds : 0), 0);
  const totalLateMinutes = Math.round(totalLateSeconds / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <img
              src={employee.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt={employee.fullName}
              className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">{employee.fullName}</h3>
                <span className="text-xs text-slate-500 font-medium">({employee.englishName})</span>
                <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {employee.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">{employee.position} • {employee.department}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEditEmployee(employee)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Chỉnh sửa thông tin"
            >
              <FileEdit className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Quick info and Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-800 block text-xs mb-1">Thông tin nhân sự</span>
              <div className="flex items-center space-x-2 text-slate-600">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Trạng thái: </span>
                <span className={`font-semibold ${employee.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {employee.status === 'active' ? 'Đang làm việc' : 'Không còn làm việc'}
                </span>
              </div>
              {employee.email && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <a href={`mailto:${employee.email}`} className="hover:text-blue-600">{employee.email}</a>
                </div>
              )}
              {employee.phone && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{employee.phone}</span>
                </div>
              )}
              {employee.startDate && (
                <div className="flex items-center space-x-2 text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Vào làm: {formatDateVN(employee.startDate)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] text-amber-700 uppercase font-bold">Số lượt đi trễ</span>
                <span className="text-xl font-extrabold text-amber-900 mt-0.5">{totalLateCount} ca</span>
                <span className="text-[10px] text-amber-600 font-semibold">{totalLateMinutes} phút trễ</span>
              </div>
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[10px] text-emerald-700 uppercase font-bold">Đúng giờ</span>
                <span className="text-xl font-extrabold text-emerald-900 mt-0.5">{onTimeCount} ca</span>
                <span className="text-[10px] text-emerald-600 font-semibold">Tổng {empRecords.length} lần chấm</span>
              </div>
            </div>
          </div>

          {/* Timeline of Arrivals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">
                Lịch sử Chấm công & Đi trễ ({empRecords.length})
              </h4>
              <button
                onClick={() => onAddRecordForEmp(employee.id)}
                className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Ghi nhận bản ghi mới</span>
              </button>
            </div>

            {empRecords.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-1 text-emerald-500" />
                <p className="font-bold text-slate-700">Chưa có bản ghi chấm công</p>
                <p className="text-slate-400 mt-0.5">Nhân viên này chưa có bản ghi nào trên hệ thống.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Ngày làm việc</th>
                      <th className="py-2 px-3">Giờ đến</th>
                      <th className="py-2 px-3">Trạng thái</th>
                      <th className="py-2 px-3">Thời gian trễ</th>
                      <th className="py-2 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {empRecords.map(rec => (
                      <tr key={rec.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {formatDateVN(rec.date)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                          {rec.arrivalTime}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {rec.isLate ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              Đi trễ
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Đúng giờ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold">
                          {rec.isLate ? (
                            <span className="text-amber-700">+{Math.round(rec.lateSeconds / 60)} phút ({rec.lateSeconds}s)</span>
                          ) : (
                            <span className="text-emerald-700 font-normal">-</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs text-slate-600">
                          {rec.notes || <span className="text-slate-400 italic">Không có</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
