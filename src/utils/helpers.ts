import * as XLSX from 'xlsx';

export const DEFAULT_LATE_THRESHOLD = '08:30';

/**
 * Kiểm tra chuỗi thời gian có đúng định dạng HH:mm hợp lệ không (00:00 đến 23:59)
 */
export function isValidHHmm(timeStr: string): boolean {
  if (!timeStr || typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeStr.trim());
}

/**
 * Chuyển đổi chuỗi thời gian (HH:mm:ss hoặc HH:mm) thành tổng số giây tính từ 00:00:00
 * Trả về null nếu định dạng thời gian không hợp lệ.
 */
export function parseTimeToSeconds(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== 'string') return null;
  
  const trimmed = timeStr.trim();
  const parts = trimmed.split(':');
  
  if (parts.length < 2 || parts.length > 3) return null;
  
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts.length === 3 ? Number(parts[2]) : 0;
  
  if (
    isNaN(hours) || isNaN(minutes) || isNaN(seconds) ||
    hours < 0 || hours > 23 ||
    minutes < 0 || minutes > 59 ||
    seconds < 0 || seconds > 59
  ) {
    return null;
  }
  
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * QUY TẮC XÁC ĐỊNH ĐI TRỄ TẬP TRUNG (Single Source of Truth):
 * - Giờ đến < ngưỡng: không đi trễ.
 * - Giờ đến = ngưỡng: không đi trễ.
 * - Giờ đến > ngưỡng: ĐI TRỄ.
 */
export function evaluateArrivalLate(
  arrivalTimeStr: string,
  thresholdTimeStr: string = DEFAULT_LATE_THRESHOLD
): {
  isLate: boolean;
  lateSeconds: number;
  lateDisplay: string;
  isValid: boolean;
} {
  const arrivalSec = parseTimeToSeconds(arrivalTimeStr);
  const thresholdSec = parseTimeToSeconds(thresholdTimeStr);
  
  if (arrivalSec === null || thresholdSec === null) {
    return {
      isLate: false,
      lateSeconds: 0,
      lateDisplay: 'Sai định dạng',
      isValid: false,
    };
  }
  
  // Đúng quy tắc: <= 08:30:00 là KHÔNG trễ, > 08:30:00 là TRỄ
  if (arrivalSec <= thresholdSec) {
    return {
      isLate: false,
      lateSeconds: 0,
      lateDisplay: 'Đúng giờ',
      isValid: true,
    };
  }
  
  const lateSec = arrivalSec - thresholdSec;
  const hours = Math.floor(lateSec / 3600);
  const minutes = Math.floor((lateSec % 3600) / 60);
  const seconds = lateSec % 60;
  
  let lateDisplay = '';
  if (hours > 0) {
    lateDisplay += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    lateDisplay += `${minutes}p `;
  }
  if (seconds > 0 || (hours === 0 && minutes === 0)) {
    lateDisplay += `${seconds}s`;
  }
  
  return {
    isLate: true,
    lateSeconds: lateSec,
    lateDisplay: `Trễ ${lateDisplay.trim()}`,
    isValid: true,
  };
}

/**
 * Chuẩn hóa chuỗi thời gian thành HH:mm:ss
 */
export function normalizeTimeString(timeStr: string): string | null {
  const sec = parseTimeToSeconds(timeStr);
  if (sec === null) return null;
  
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Chuẩn hóa chuỗi ngày thành YYYY-MM-DD
 */
export function normalizeDateString(dateInput: any): string | null {
  if (!dateInput) return null;
  
  // Nếu là Date object
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    const y = dateInput.getFullYear();
    const m = String(dateInput.getMonth() + 1).padStart(2, '0');
    const d = String(dateInput.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  
  const str = String(dateInput).trim();
  
  // TH: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, d] = str.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return str;
  }
  
  // TH: DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // TH: YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('/').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }
  
  return null;
}

export function formatDateVN(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Xuất dữ liệu ra file Excel (.xlsx) bằng SheetJS
 */
export function exportToExcel(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Định dạng độ rộng cột cơ bản
  const colWidths = headers.map((_, colIdx) => {
    let maxLen = headers[colIdx].length;
    rows.forEach(row => {
      const cellVal = String(row[colIdx] ?? '');
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

/**
 * Xuất dữ liệu ra file CSV chuẩn UTF-8 BOM
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '\uFEFF';
  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(',')
    )
  ].join('\r\n');

  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Tạo và tải xuống file Excel mẫu để người dùng nhập liệu
 */
export function downloadExcelSampleTemplate() {
  const headers = ['Mã nhân viên', 'Ngày làm việc (YYYY-MM-DD)', 'Giờ đến (HH:mm:ss)', 'Ghi chú'];
  const sampleRows = [
    ['VPC-101', '2026-10-15', '08:25:30', 'Đến đúng giờ'],
    ['VPC-102', '2026-10-15', '08:30:00', 'Đến đúng ngưỡng 08:30:00'],
    ['VPC-103', '2026-10-15', '08:30:01', 'Trễ 1 giây'],
    ['VPC-105', '2026-10-15', '08:45:00', 'Tắc đường ngập nước'],
    ['VPC-106', '2026-10-15', '09:05:15', 'Đi khám sức khỏe'],
  ];
  
  exportToExcel(
    'Mau_Nhap_Lieu_Cham_Cong_VPC.xlsx',
    'MauNhapChamCong',
    headers,
    sampleRows
  );
}

/**
 * So sánh 2 bản ghi chấm công để xác định có trùng khớp hoàn toàn tất cả các trường dữ liệu nghiệp vụ hay không:
 * 1. Nhân viên: khớp theo mã nhân viên (không phân biệt hoa thường) hoặc ID nhân viên
 * 2. Ngày làm việc: YYYY-MM-DD
 * 3. Giờ đến: so sánh theo số giây trong ngày (parseTimeToSeconds)
 * 4. Ghi chú nghiệp vụ: chuỗi sau khi trim (coi rỗng / undefined / null là như nhau)
 * 
 * Bỏ qua hoàn toàn các trường kỹ thuật tự sinh: ID, createdAt, updatedAt, createdBy.
 * Nếu có bất kỳ trường nghiệp vụ nào khác nhau -> trả về false (không trùng hoàn toàn).
 */
export function isExactDuplicateRecord(
  a: {
    employeeId?: string;
    employeeCode?: string;
    date: string;
    arrivalTime: string;
    notes?: string | null;
  },
  b: {
    employeeId?: string;
    employeeCode?: string;
    date: string;
    arrivalTime: string;
    notes?: string | null;
  }
): boolean {
  // 1. So sánh Nhân viên (ưu tiên theo mã nhân viên hoặc ID)
  const codeA = (a.employeeCode || '').trim().toUpperCase();
  const codeB = (b.employeeCode || '').trim().toUpperCase();
  const idA = (a.employeeId || '').trim();
  const idB = (b.employeeId || '').trim();

  let empMatches = false;
  if (codeA && codeB) {
    empMatches = codeA === codeB;
  } else if (idA && idB) {
    empMatches = idA === idB;
  }
  if (!empMatches) return false;

  // 2. So sánh Ngày làm việc (YYYY-MM-DD)
  const dateA = (a.date || '').trim();
  const dateB = (b.date || '').trim();
  if (dateA !== dateB) return false;

  // 3. So sánh Giờ đến (chuẩn hóa giây)
  const secA = parseTimeToSeconds(a.arrivalTime);
  const secB = parseTimeToSeconds(b.arrivalTime);
  if (secA === null || secB === null || secA !== secB) return false;

  // 4. So sánh Ghi chú nghiệp vụ
  const noteA = (a.notes ?? '').trim();
  const noteB = (b.notes ?? '').trim();
  if (noteA !== noteB) return false;

  return true;
}

/**
 * Lấy ngày hiện tại theo giờ địa phương Việt Nam (Asia/Ho_Chi_Minh - UTC+7) định dạng YYYY-MM-DD
 */
export function getVietnamToday(): string {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Lùi số ngày từ một chuỗi ngày YYYY-MM-DD
 */
export function subtractDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Lùi số tháng từ một chuỗi ngày YYYY-MM-DD
 */
export function subtractMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setMonth(date.getMonth() - months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Xác định chính xác ngày bắt đầu và ngày kết thúc của một Quý theo Năm:
 * - Quý 1: 01/01 -> 31/03
 * - Quý 2: 01/04 -> 30/06
 * - Quý 3: 01/07 -> 30/09
 * - Quý 4: 01/10 -> 31/12
 */
export function getQuarterDateRange(quarter: number, year: number): { startDate: string; endDate: string } {
  switch (quarter) {
    case 1:
      return { startDate: `${year}-01-01`, endDate: `${year}-03-31` };
    case 2:
      return { startDate: `${year}-04-01`, endDate: `${year}-06-30` };
    case 3:
      return { startDate: `${year}-07-01`, endDate: `${year}-09-30` };
    case 4:
    default:
      return { startDate: `${year}-10-01`, endDate: `${year}-12-31` };
  }
}

