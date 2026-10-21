import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, Building } from 'lucide-react';
import { Employee, Department } from '../../types';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employee: Omit<Employee, 'id'>, existingId?: string) => void;
  editingEmployee?: Employee | null;
  existingCodes: string[];
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingEmployee,
  existingCodes,
}) => {
  const departments: Department[] = [
    'Kế toán',
    'Hành chính Nhân sự',
    'Kinh doanh & Marketing',
    'Kỹ thuật & Công nghệ',
    'Vận hành',
    'Ban Giám đốc',
  ];

  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [englishName, setEnglishName] = useState('');
  const [department, setDepartment] = useState<Department>('Kế toán');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [notes, setNotes] = useState('');
  const [codeError, setCodeError] = useState('');

  useEffect(() => {
    if (editingEmployee) {
      setCode(editingEmployee.code);
      setFullName(editingEmployee.fullName);
      setEnglishName(editingEmployee.englishName || '');
      setDepartment(editingEmployee.department);
      setPosition(editingEmployee.position);
      setStatus(editingEmployee.status);
      setEmail(editingEmployee.email || '');
      setPhone(editingEmployee.phone || '');
      setStartDate(editingEmployee.startDate || new Date().toISOString().slice(0, 10));
      setDateOfBirth(editingEmployee.dateOfBirth || '');
      setNotes(editingEmployee.notes || '');
      setCodeError('');
    } else {
      const nextNum = existingCodes.length + 101;
      setCode(`VPC-${nextNum}`);
      setFullName('');
      setEnglishName('');
      setDepartment('Kế toán');
      setPosition('');
      setStatus('active');
      setEmail('');
      setPhone('');
      setStartDate(new Date().toISOString().slice(0, 10));
      setDateOfBirth('');
      setNotes('');
      setCodeError('');
    }
  }, [editingEmployee, existingCodes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const upperCode = code.trim().toUpperCase();

    // Check code duplication
    if (!editingEmployee && existingCodes.includes(upperCode)) {
      setCodeError('Mã nhân viên này đã tồn tại trong hệ thống nhân sự VPC.');
      return;
    }

    onSave({
      code: upperCode,
      fullName: fullName.trim(),
      englishName: englishName.trim() || fullName.trim(),
      department,
      position: position.trim() || 'Nhân viên',
      status,
      startDate,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      dateOfBirth: dateOfBirth.trim() || undefined,
      notes: notes.trim() || undefined,
    }, editingEmployee?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingEmployee ? 'Chỉnh Sửa Hồ Sơ Nhân Viên' : 'Thêm Nhân Viên Mới'}
              </h3>
              <p className="text-xs text-slate-500">Hệ thống Quản lý nhân sự Công ty Cổ phần VPC</p>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mã nhân viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError('');
                }}
                placeholder="VD: VPC-101"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold uppercase"
                required
              />
              {codeError && <span className="text-[11px] text-rose-500 mt-1 block">{codeError}</span>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Trạng thái làm việc <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-semibold"
              >
                <option value="active">Đang làm việc</option>
                <option value="inactive">Không còn làm việc</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ tên tiếng Việt <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Thị Minh Hạnh"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ tên tiếng Anh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={englishName}
                onChange={(e) => setEnglishName(e.target.value)}
                placeholder="VD: Hanh Nguyen"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Phòng ban <span className="text-rose-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Chức vụ / Vị trí <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="VD: Kế toán trưởng"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="VD: hanh.nguyen@vpc.com.vn"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912 345 678"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Ngày sinh (Không bắt buộc) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">
                Ngày sinh
              </label>
              <span className="text-[11px] text-slate-400">Không bắt buộc</span>
            </div>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            />
          </div>

          {/* Ghi chú tự do (Không bắt buộc) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-600">
                Ghi chú
              </label>
              <span className="text-[11px] text-slate-400">Không bắt buộc</span>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Nhập ghi chú tự do về nhân sự (VD: đặc điểm, chuyên môn, thông tin nội bộ...)"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg resize-none text-slate-700 placeholder:text-slate-400"
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
              {editingEmployee ? 'Lưu thay đổi' : 'Thêm nhân viên'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
