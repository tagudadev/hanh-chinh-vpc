import { Employee, ArrivalRecord, WorkspaceSettings } from '../types';
import { evaluateArrivalLate, DEFAULT_LATE_THRESHOLD } from '../utils/helpers';

export const DEFAULT_SETTINGS: WorkspaceSettings = {
  companyName: 'Công ty Cổ phần VPC (VPC Corporation)',
  lateThresholdTime: DEFAULT_LATE_THRESHOLD, // 08:30:00
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    code: 'VPC-101',
    fullName: 'Nguyễn Thị Minh Hạnh',
    englishName: 'Hanh Nguyen',
    department: 'Kế toán',
    position: 'Kế toán trưởng',
    status: 'active',
    startDate: '2021-03-15',
    email: 'hanh.nguyen@vpc.com.vn',
    phone: '0912 345 678',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-2',
    code: 'VPC-102',
    fullName: 'Trần Văn Hoàng',
    englishName: 'Hoang Tran',
    department: 'Kế toán',
    position: 'Kế toán thanh toán',
    status: 'active',
    startDate: '2022-06-01',
    email: 'hoang.tran@vpc.com.vn',
    phone: '0988 765 432',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-3',
    code: 'VPC-103',
    fullName: 'Lê Thu Hương',
    englishName: 'Helen Le',
    department: 'Hành chính Nhân sự',
    position: 'Trưởng phòng HC-NS',
    status: 'active',
    startDate: '2020-11-10',
    email: 'huong.le@vpc.com.vn',
    phone: '0903 112 233',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-4',
    code: 'VPC-104',
    fullName: 'Phạm Đức Duy',
    englishName: 'David Pham',
    department: 'Hành chính Nhân sự',
    position: 'Chuyên viên Chấm công & Hành chính',
    status: 'active',
    startDate: '2023-01-16',
    email: 'duy.pham@vpc.com.vn',
    phone: '0934 556 789',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-5',
    code: 'VPC-105',
    fullName: 'Vũ Quốc Bảo',
    englishName: 'Kevin Vu',
    department: 'Kỹ thuật & Công nghệ',
    position: 'Kỹ sư phần mềm Lead',
    status: 'active',
    startDate: '2022-02-20',
    email: 'bao.vu@vpc.com.vn',
    phone: '0977 123 999',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-6',
    code: 'VPC-106',
    fullName: 'Đặng Mai Phương',
    englishName: 'Mia Dang',
    department: 'Kinh doanh & Marketing',
    position: 'Trưởng nhóm Sales B2B',
    status: 'active',
    startDate: '2022-09-01',
    email: 'phuong.dang@vpc.com.vn',
    phone: '0945 667 889',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-7',
    code: 'VPC-107',
    fullName: 'Hoàng Tuấn Kiệt',
    englishName: 'Kenny Hoang',
    department: 'Kinh doanh & Marketing',
    position: 'Chuyên viên Phát triển thị trường',
    status: 'active',
    startDate: '2023-04-10',
    email: 'kiet.hoang@vpc.com.vn',
    phone: '0962 334 455',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-8',
    code: 'VPC-108',
    fullName: 'Bùi Thanh Thảo',
    englishName: 'Chloe Bui',
    department: 'Vận hành',
    position: 'Điều phối viên Hậu cần',
    status: 'active',
    startDate: '2023-08-15',
    email: 'thao.bui@vpc.com.vn',
    phone: '0981 998 877',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-9',
    code: 'VPC-109',
    fullName: 'Đỗ Anh Dũng',
    englishName: 'Alex Do',
    department: 'Ban Giám đốc',
    position: 'Phó Tổng Giám Đốc Điều Hành',
    status: 'active',
    startDate: '2019-05-01',
    email: 'dung.do@vpc.com.vn',
    phone: '0909 888 777',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'emp-10',
    code: 'VPC-110',
    fullName: 'Ngô Hải Yến',
    englishName: 'Jenny Ngo',
    department: 'Kế toán',
    position: 'Kế toán viên',
    status: 'inactive', // Đã chuyển công tác
    startDate: '2023-10-01',
    email: 'yen.ngo@vpc.com.vn',
    phone: '0938 123 456',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
  }
];

// Helper to construct sample records using central late logic
function createInitialRecord(
  id: string,
  employeeCode: string,
  employeeId: string,
  date: string,
  arrivalTime: string,
  notes?: string
): ArrivalRecord {
  const evalResult = evaluateArrivalLate(arrivalTime, DEFAULT_LATE_THRESHOLD);
  return {
    id,
    employeeId,
    employeeCode,
    date,
    arrivalTime,
    isLate: evalResult.isLate,
    lateSeconds: evalResult.lateSeconds,
    notes,
    createdAt: `${date}T${arrivalTime}Z`,
    createdBy: 'Hệ thống Quản lý VPC',
  };
}

export const INITIAL_ARRIVAL_RECORDS: ArrivalRecord[] = [
  // --- THÁNG 10/2026 (QUÝ 4/2026 - DỮ LIỆU HIỆN TẠI) ---
  // 19/10/2026 (Hôm nay)
  createInitialRecord('arr-261019-1', 'VPC-107', 'emp-7', '2026-10-19', '08:35:10', 'Kẹt xe cầu Sài Gòn'),
  createInitialRecord('arr-261019-2', 'VPC-102', 'emp-2', '2026-10-19', '08:30:00', 'Đến đúng ngưỡng 08:30:00 - Không trễ'),
  createInitialRecord('arr-261019-3', 'VPC-101', 'emp-1', '2026-10-19', '08:22:00', 'Đến sớm chuẩn bị giao ban tuần'),
  createInitialRecord('arr-261019-4', 'VPC-105', 'emp-5', '2026-10-19', '08:41:00', 'Sự cố kết nối VPN cá nhân sáng thứ hai'),
  createInitialRecord('arr-261019-5', 'VPC-104', 'emp-4', '2026-10-19', '08:15:30', 'Đến sớm kiểm tra phòng họp'),

  // 18/10/2026
  createInitialRecord('arr-261018-1', 'VPC-105', 'emp-5', '2026-10-18', '08:32:00', 'Trực ca kỹ thuật cuối tuần'),
  createInitialRecord('arr-261018-2', 'VPC-108', 'emp-8', '2026-10-18', '08:28:00', 'Trực ban kho vận cuối tuần'),

  // 17/10/2026
  createInitialRecord('arr-261017-1', 'VPC-106', 'emp-6', '2026-10-17', '08:44:20', 'Mưa lớn sáng thứ bảy'),
  createInitialRecord('arr-261017-2', 'VPC-103', 'emp-3', '2026-10-17', '08:29:45', 'Đến trước ngưỡng - Đúng giờ'),
  createInitialRecord('arr-261017-3', 'VPC-107', 'emp-7', '2026-10-17', '08:30:01', 'Trễ 1 giây qua ngưỡng 08:30:00'),

  // 16/10/2026
  createInitialRecord('arr-261016-1', 'VPC-101', 'emp-1', '2026-10-16', '08:25:00', 'Đến đúng giờ'),
  createInitialRecord('arr-261016-2', 'VPC-104', 'emp-4', '2026-10-16', '08:38:15', 'Đưa con đi học đầu giờ sáng'),
  createInitialRecord('arr-261016-3', 'VPC-108', 'emp-8', '2026-10-16', '08:30:00', 'Đến đúng 08:30:00'),

  // 15/10/2026
  createInitialRecord('arr-261015-1', 'VPC-102', 'emp-2', '2026-10-15', '08:45:00', 'Hỏng lốp xe máy trên đường đi làm'),
  createInitialRecord('arr-261015-2', 'VPC-106', 'emp-6', '2026-10-15', '08:28:10', 'Đúng giờ'),
  createInitialRecord('arr-261015-3', 'VPC-107', 'emp-7', '2026-10-15', '08:52:00', 'Tắc đường ngập nước'),

  // 14/10/2026
  createInitialRecord('arr-261014-1', 'VPC-107', 'emp-7', '2026-10-14', '08:42:15', 'Tắc đường ngập nước'),
  createInitialRecord('arr-261014-2', 'VPC-105', 'emp-5', '2026-10-14', '08:30:01', 'Trễ 1 giây qua ngưỡng 08:30:00'),
  createInitialRecord('arr-261014-3', 'VPC-101', 'emp-1', '2026-10-14', '08:24:00', 'Đến sớm chuẩn bị giao ban'),
  createInitialRecord('arr-261014-4', 'VPC-103', 'emp-3', '2026-10-14', '08:30:00', 'Đến đúng ngưỡng 08:30:00 - Không trễ'),

  // 13/10/2026
  createInitialRecord('arr-261013-1', 'VPC-102', 'emp-2', '2026-10-13', '08:38:30', 'Sự cố xe máy trên đường'),
  createInitialRecord('arr-261013-2', 'VPC-108', 'emp-8', '2026-10-13', '08:31:45', 'Trễ chuyến xe bus'),
  createInitialRecord('arr-261013-3', 'VPC-104', 'emp-4', '2026-10-13', '08:15:00', 'Đến sớm phụ trách phòng họp'),

  // 10/10/2026
  createInitialRecord('arr-261010-1', 'VPC-107', 'emp-7', '2026-10-10', '08:52:00', 'Gặp khách hàng trước giờ làm'),
  createInitialRecord('arr-261010-2', 'VPC-106', 'emp-6', '2026-10-10', '08:30:20', 'Kẹt thang máy sảnh chính'),

  // 08/10/2026
  createInitialRecord('arr-261008-1', 'VPC-106', 'emp-6', '2026-10-08', '08:34:10', 'Mưa giông lớn'),
  createInitialRecord('arr-261008-2', 'VPC-105', 'emp-5', '2026-10-08', '08:29:59', 'Đến trước ngưỡng 1 giây - Không trễ'),

  // 06/10/2026
  createInitialRecord('arr-261006-1', 'VPC-102', 'emp-2', '2026-10-06', '08:55:00', 'Việc gia đình có xin phép'),
  createInitialRecord('arr-261006-2', 'VPC-101', 'emp-1', '2026-10-06', '08:20:00', 'Đúng giờ'),

  // 02/10/2026
  createInitialRecord('arr-261002-1', 'VPC-107', 'emp-7', '2026-10-02', '09:10:00', 'Quên cài báo thức'),
  createInitialRecord('arr-261002-2', 'VPC-104', 'emp-4', '2026-10-02', '08:36:20', 'Mưa lớn giờ cao điểm'),

  // --- QUÝ 3/2026 (01/07/2026 - 30/09/2026) ---
  createInitialRecord('arr-260925-1', 'VPC-106', 'emp-6', '2026-09-25', '08:40:00', 'Kẹt xe ngã tư Hàng Xanh'),
  createInitialRecord('arr-260920-1', 'VPC-101', 'emp-1', '2026-09-20', '08:28:00', 'Đúng giờ'),
  createInitialRecord('arr-260920-2', 'VPC-102', 'emp-2', '2026-09-20', '08:35:00', 'Mưa lớn ngập đường'),
  createInitialRecord('arr-260912-1', 'VPC-107', 'emp-7', '2026-09-12', '08:48:00', 'Gặp đối tác sáng sớm'),
  createInitialRecord('arr-260828-1', 'VPC-105', 'emp-5', '2026-08-28', '08:37:30', 'Sự cố đường truyền internet'),
  createInitialRecord('arr-260815-1', 'VPC-108', 'emp-8', '2026-08-15', '08:42:00', 'Trục trặc phương tiện cá nhân'),
  createInitialRecord('arr-260805-1', 'VPC-103', 'emp-3', '2026-08-05', '08:26:00', 'Đúng giờ'),
  createInitialRecord('arr-260805-2', 'VPC-104', 'emp-4', '2026-08-05', '08:34:00', 'Kẹt xe cầu Bình Triệu'),
  createInitialRecord('arr-260722-1', 'VPC-102', 'emp-2', '2026-07-22', '08:46:00', 'Kẹt xe đường Cộng Hòa'),
  createInitialRecord('arr-260710-1', 'VPC-106', 'emp-6', '2026-07-10', '08:33:00', 'Thang máy sảnh chính đông'),

  // --- QUÝ 2/2026 (01/04/2026 - 30/06/2026) ---
  createInitialRecord('arr-260618-1', 'VPC-107', 'emp-7', '2026-06-18', '08:50:00', 'Kẹt xe đường Nguyễn Hữu Cảnh'),
  createInitialRecord('arr-260605-1', 'VPC-105', 'emp-5', '2026-06-05', '08:34:00', 'Trễ giờ chuyến tàu điện'),
  createInitialRecord('arr-260522-1', 'VPC-102', 'emp-2', '2026-05-22', '08:38:00', 'Đi khám bệnh có báo trước'),
  createInitialRecord('arr-260510-1', 'VPC-108', 'emp-8', '2026-05-10', '08:32:00', 'Mưa rào buổi sáng'),
  createInitialRecord('arr-260425-1', 'VPC-106', 'emp-6', '2026-04-25', '08:45:00', 'Tiếp đón khách hàng B2B'),
  createInitialRecord('arr-260414-1', 'VPC-104', 'emp-4', '2026-04-14', '08:35:00', 'Hỏng xe máy trên đường'),

  // --- QUÝ 1/2026 (01/01/2026 - 31/03/2026) ---
  createInitialRecord('arr-260320-1', 'VPC-101', 'emp-1', '2026-03-20', '08:24:00', 'Đúng giờ'),
  createInitialRecord('arr-260320-2', 'VPC-102', 'emp-2', '2026-03-20', '08:40:00', 'Kẹt xe đầu tuần'),
  createInitialRecord('arr-260305-1', 'VPC-107', 'emp-7', '2026-03-05', '08:55:00', 'Mưa lớn đầu mùa'),
  createInitialRecord('arr-260224-1', 'VPC-105', 'emp-5', '2026-02-24', '08:33:00', 'Trục trặc xe buýt'),
  createInitialRecord('arr-260212-1', 'VPC-108', 'emp-8', '2026-02-12', '08:39:00', 'Kẹt xe dịp cận Tết'),
  createInitialRecord('arr-260122-1', 'VPC-106', 'emp-6', '2026-01-22', '08:42:00', 'Họp đối tác ngoài công ty'),
  createInitialRecord('arr-260108-1', 'VPC-103', 'emp-3', '2026-01-08', '08:28:00', 'Đúng giờ'),
  createInitialRecord('arr-260108-2', 'VPC-104', 'emp-4', '2026-01-08', '08:36:00', 'Sự cố giao thông trên đường'),

  // --- NĂM 2025 ---
  // Quý 4/2025 (01/10/2025 - 31/12/2025)
  createInitialRecord('arr-251120-1', 'VPC-107', 'emp-7', '2025-11-20', '08:48:00', 'Kẹt xe triều cường ngập nước'),
  createInitialRecord('arr-251110-1', 'VPC-102', 'emp-2', '2025-11-10', '08:36:00', 'Hỏng xe giữa đường'),
  createInitialRecord('arr-251015-1', 'VPC-105', 'emp-5', '2025-10-15', '08:35:00', 'Mưa bão lớn'),

  // Quý 3/2025 (01/07/2025 - 30/09/2025)
  createInitialRecord('arr-250825-1', 'VPC-106', 'emp-6', '2025-08-25', '08:44:00', 'Kẹt xe đường Điện Biên Phủ'),
  createInitialRecord('arr-250718-1', 'VPC-108', 'emp-8', '2025-07-18', '08:33:00', 'Trễ chuyến xe buýt sáng'),

  // Quý 2/2025 (01/04/2025 - 30/06/2025)
  createInitialRecord('arr-250520-1', 'VPC-102', 'emp-2', '2025-05-20', '08:40:00', 'Đi xét nghiệm sức khỏe định kỳ'),
  createInitialRecord('arr-250412-1', 'VPC-107', 'emp-7', '2025-04-12', '08:52:00', 'Kẹt xe giờ cao điểm'),

  // Quý 1/2025 (01/01/2025 - 31/03/2025)
  createInitialRecord('arr-250228-1', 'VPC-104', 'emp-4', '2025-02-28', '08:37:00', 'Mưa phùn đường trơn'),
  createInitialRecord('arr-250115-1', 'VPC-105', 'emp-5', '2025-01-15', '08:34:00', 'Xe bị thủng săm trên đường'),
];
