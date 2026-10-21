export type Department = 
  | 'Kế toán'
  | 'Hành chính Nhân sự'
  | 'Kinh doanh & Marketing'
  | 'Kỹ thuật & Công nghệ'
  | 'Vận hành'
  | 'Ban Giám đốc';

export interface Employee {
  id: string;
  code: string;            // Mã nhân viên (duy nhất, đối chiếu chính xác)
  fullName: string;        // Họ tên tiếng Việt
  englishName: string;     // Họ tên tiếng Anh
  department: Department;  // Phòng ban
  position: string;        // Vị trí / Chức danh
  status: 'active' | 'inactive'; // Đang làm việc | Không còn làm việc
  dateOfBirth?: string;    // Ngày sinh (YYYY-MM-DD)
  notes?: string;          // Ghi chú tự do
  startDate?: string;
  email?: string;
  phone?: string;
  avatar?: string;
}

export type PriorNoticeStatus = 'reported' | 'unreported' | 'unverified';
export type NoticeMethod = 'zalo' | 'phone' | 'direct' | 'email' | 'other';

export interface ArrivalRecord {
  id: string;
  employeeId: string;
  employeeCode: string;
  date: string;          // YYYY-MM-DD
  arrivalTime: string;   // HH:mm:ss hoặc HH:mm
  isLate: boolean;       // Xác định tập trung qua hàm parse & so sánh ngưỡng
  lateSeconds: number;   // Số giây trễ tính từ 08:30:00 (nếu > 0)
  priorNoticeStatus?: PriorNoticeStatus; // 'reported' (Đã báo trước) | 'unreported' (Không báo trước) | 'unverified' (Chưa xác minh)
  noticeTime?: string;   // Thời điểm báo trước (VD: "08:10", "Trước ca 20p", ...)
  noticeMethod?: NoticeMethod; // Hình thức báo: Zalo, điện thoại, trực tiếp, email, khác
  notes?: string;        // Ghi chú tùy chọn
  createdAt: string;     // Thời điểm tạo bản ghi (ISO string)
  createdBy: string;     // Người tạo bản ghi
  updatedAt?: string;    // Thời điểm sửa lần cuối
}

export interface WorkspaceSettings {
  companyName: string;
  lateThresholdTime: string; // Mặc định "08:30" (định dạng HH:mm)
}

export type ActiveTab = 'overview' | 'attendance' | 'employees' | 'reports' | 'settings';

export interface ExcelImportRow {
  rowNumber: number;
  rawCode: string;
  rawDate: string;
  rawTime: string;
  rawNotes?: string;
  
  // Validation status
  isValid: boolean;
  isDuplicateWarning: boolean;
  isExactDuplicate?: boolean;
  errors: string[];
  warnings: string[];
  
  // Normalized data (if valid)
  matchedEmployee?: Employee;
  normalizedDate?: string;
  normalizedTime?: string;
  isLate?: boolean;
  lateSeconds?: number;
}
