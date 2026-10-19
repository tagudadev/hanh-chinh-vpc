import * as XLSX from 'xlsx';
import { Employee, ArrivalRecord, ExcelImportRow } from '../types';
import { 
  normalizeDateString, 
  normalizeTimeString, 
  evaluateArrivalLate, 
  DEFAULT_LATE_THRESHOLD,
  isExactDuplicateRecord 
} from './helpers';

/**
 * Tách riêng logic đọc và phân tích file Excel / CSV
 */
export async function parseExcelFile(
  file: File,
  employees: Employee[],
  existingRecords: ArrivalRecord[],
  thresholdTime: string = DEFAULT_LATE_THRESHOLD
): Promise<{
  rows: ExcelImportRow[];
  totalRows: number;
  validCount: number;
  errorCount: number;
  exactDuplicateCount: number;
  duplicateWarningCount: number;
  sheetName: string;
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('Tệp Excel không chứa trang tính (sheet) nào.');
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Chuyển sheet thành mảng 2 chiều (header ở dòng đầu)
  const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
  
  if (rawData.length < 2) {
    throw new Error('Tệp Excel phải có ít nhất 1 dòng tiêu đề và 1 dòng dữ liệu.');
  }

  // Xác định vị trí các cột
  const headerRow = rawData[0].map(h => String(h || '').trim().toLowerCase());
  
  let codeCol = -1;
  let dateCol = -1;
  let timeCol = -1;
  let notesCol = -1;

  headerRow.forEach((colName, idx) => {
    if (
      colName.includes('mã') || 
      colName.includes('code') || 
      colName.includes('manv') ||
      colName.includes('ma nv')
    ) {
      if (codeCol === -1) codeCol = idx;
    } else if (
      colName.includes('ngày') || 
      colName.includes('date') || 
      colName.includes('ngay')
    ) {
      if (dateCol === -1) dateCol = idx;
    } else if (
      colName.includes('giờ') || 
      colName.includes('time') || 
      colName.includes('gio') ||
      colName.includes('checkin') ||
      colName.includes('đến')
    ) {
      if (timeCol === -1) timeCol = idx;
    } else if (
      colName.includes('ghi chú') || 
      colName.includes('note') || 
      colName.includes('ly do') ||
      colName.includes('lý do')
    ) {
      if (notesCol === -1) notesCol = idx;
    }
  });

  // Nếu không khớp theo tên, gán mặc định 0: Mã, 1: Ngày, 2: Giờ, 3: Ghi chú
  if (codeCol === -1) codeCol = 0;
  if (dateCol === -1) dateCol = 1;
  if (timeCol === -1) timeCol = 2;
  if (notesCol === -1 && rawData[0].length > 3) notesCol = 3;

  // Lập bản đồ tra cứu nhân viên theo Mã (viết hoa, chính xác tuyệt đối)
  const employeeMap = new Map<string, Employee>();
  employees.forEach(emp => {
    employeeMap.set(emp.code.trim().toUpperCase(), emp);
  });

  const parsedRows: ExcelImportRow[] = [];
  const inMemoryOccurrences = new Set<string>(); // Set of "CODE_DATE" trong cùng file excel

  for (let i = 1; i < rawData.length; i++) {
    const row = rawData[i];
    
    // Bỏ qua dòng trống hoàn toàn
    const isRowEmpty = row.every((cell: any) => cell === '' || cell === null || cell === undefined);
    if (isRowEmpty) continue;

    const rawCode = String(row[codeCol] ?? '').trim();
    let rawDateVal = row[dateCol];
    let rawTimeVal = row[timeCol];
    const rawNotes = notesCol >= 0 ? String(row[notesCol] ?? '').trim() : '';

    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Kiểm tra Mã nhân viên
    let matchedEmployee: Employee | undefined;
    if (!rawCode) {
      errors.push('Thiếu mã nhân viên.');
    } else {
      const upperCode = rawCode.toUpperCase();
      matchedEmployee = employeeMap.get(upperCode);
      if (!matchedEmployee) {
        errors.push(`Mã nhân viên "${rawCode}" không tồn tại trong danh bạ VPC.`);
      }
    }

    // 2. Kiểm tra Ngày
    let normalizedDate: string | null = null;
    if (rawDateVal instanceof Date && !isNaN(rawDateVal.getTime())) {
      const y = rawDateVal.getFullYear();
      const m = String(rawDateVal.getMonth() + 1).padStart(2, '0');
      const d = String(rawDateVal.getDate()).padStart(2, '0');
      normalizedDate = `${y}-${m}-${d}`;
    } else {
      normalizedDate = normalizeDateString(rawDateVal);
    }

    if (!normalizedDate) {
      errors.push(`Ngày "${String(rawDateVal ?? '')}" không hợp lệ (cần định dạng YYYY-MM-DD hoặc DD/MM/YYYY).`);
    }

    // 3. Kiểm tra Giờ đến
    let normalizedTime: string | null = null;
    if (rawTimeVal instanceof Date && !isNaN(rawTimeVal.getTime())) {
      const h = String(rawTimeVal.getHours()).padStart(2, '0');
      const m = String(rawTimeVal.getMinutes()).padStart(2, '0');
      const s = String(rawTimeVal.getSeconds()).padStart(2, '0');
      normalizedTime = `${h}:${m}:${s}`;
    } else if (typeof rawTimeVal === 'number') {
      // Excel lưu giờ là phân số của ngày (vd 0.354166666 = 08:30)
      const totalSec = Math.round(rawTimeVal * 86400);
      const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
      const s = String(totalSec % 60).padStart(2, '0');
      normalizedTime = `${h}:${m}:${s}`;
    } else {
      normalizedTime = normalizeTimeString(String(rawTimeVal ?? ''));
    }

    if (!normalizedTime) {
      errors.push(`Giờ đến "${String(rawTimeVal ?? '')}" không đúng định dạng (cần HH:mm:ss hoặc HH:mm).`);
    }

    // 4. Đánh giá đi trễ theo logic tập trung
    let isLate = false;
    let lateSeconds = 0;
    if (normalizedTime) {
      const evaluation = evaluateArrivalLate(normalizedTime, thresholdTime);
      isLate = evaluation.isLate;
      lateSeconds = evaluation.lateSeconds;
    }

    // 5. Cảnh báo và kiểm tra trùng lặp
    let isDuplicateWarning = false;
    let isExactDuplicate = false;

    if (matchedEmployee && normalizedDate && normalizedTime) {
      const candidateRecord = {
        employeeId: matchedEmployee.id,
        employeeCode: matchedEmployee.code,
        date: normalizedDate,
        arrivalTime: normalizedTime,
        notes: rawNotes?.trim() ? rawNotes.trim() : undefined,
      };

      // 5.1. Kiểm tra trùng khớp hoàn toàn tất cả các trường dữ liệu nghiệp vụ
      const existsExactInSystem = existingRecords.some(r => isExactDuplicateRecord(candidateRecord, r));
      const existsExactInFile = parsedRows.some(
        prevRow => prevRow.isValid && prevRow.matchedEmployee && prevRow.normalizedDate && prevRow.normalizedTime &&
          isExactDuplicateRecord(candidateRecord, {
            employeeId: prevRow.matchedEmployee.id,
            employeeCode: prevRow.matchedEmployee.code,
            date: prevRow.normalizedDate,
            arrivalTime: prevRow.normalizedTime,
            notes: prevRow.rawNotes?.trim() ? prevRow.rawNotes.trim() : undefined,
          })
      );

      if (existsExactInSystem || existsExactInFile) {
        isExactDuplicate = true;
        isDuplicateWarning = true;
        warnings.push(
          existsExactInSystem
            ? 'Bản ghi trùng khớp 100% tất cả trường nghiệp vụ với dữ liệu đã có trong hệ thống (sẽ bỏ qua khi nhập).'
            : 'Bản ghi trùng khớp 100% với một dòng phía trước trong cùng tệp Excel (sẽ bỏ qua khi nhập).'
        );
      } else {
        // 5.2. Nếu KHÔNG trùng hoàn toàn, kiểm tra xem có cùng ngày hay không (chỉ cảnh báo, không chặn)
        const key = `${matchedEmployee.code}_${normalizedDate}`;
        const hasSameDayInSystem = existingRecords.some(
          r => r.employeeId === matchedEmployee!.id && r.date === normalizedDate
        );
        if (hasSameDayInSystem) {
          isDuplicateWarning = true;
          warnings.push(`Nhân viên ${matchedEmployee.code} đã có bản ghi trong ngày ${normalizedDate} (khác giờ/ghi chú - hợp lệ để ghi nhận).`);
        }

        if (inMemoryOccurrences.has(key)) {
          isDuplicateWarning = true;
          warnings.push(`Xuất hiện nhiều hơn 1 dòng cho nhân viên ${matchedEmployee.code} trong ngày ${normalizedDate} (khác giờ/ghi chú - hợp lệ).`);
        } else {
          inMemoryOccurrences.add(key);
        }
      }
    }

    const isValid = errors.length === 0;

    parsedRows.push({
      rowNumber: i + 1,
      rawCode,
      rawDate: String(rawDateVal ?? ''),
      rawTime: String(rawTimeVal ?? ''),
      rawNotes,
      isValid,
      isDuplicateWarning,
      isExactDuplicate,
      errors,
      warnings,
      matchedEmployee,
      normalizedDate: normalizedDate || undefined,
      normalizedTime: normalizedTime || undefined,
      isLate,
      lateSeconds,
    });
  }

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.filter(r => !r.isValid).length;
  const exactDuplicateCount = parsedRows.filter(r => r.isValid && r.isExactDuplicate).length;
  const duplicateWarningCount = parsedRows.filter(r => r.isDuplicateWarning && r.isValid).length;

  return {
    rows: parsedRows,
    totalRows: parsedRows.length,
    validCount,
    errorCount,
    exactDuplicateCount,
    duplicateWarningCount,
    sheetName,
  };
}
