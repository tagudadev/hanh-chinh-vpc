import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  FileDown, 
  Eye, 
  Filter, 
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Employee, ArrivalRecord, ExcelImportRow } from '../../types';
import { parseExcelFile } from '../../utils/excelImport';
import { downloadExcelSampleTemplate, formatDateVN, isExactDuplicateRecord } from '../../utils/helpers';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  existingRecords: ArrivalRecord[];
  thresholdTime: string;
  onImportConfirmed: (newRecords: Omit<ArrivalRecord, 'id' | 'createdAt'>[]) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  employees,
  existingRecords,
  thresholdTime,
  onImportConfirmed,
}) => {
  // Stepper state: 1: 'upload' -> 2: 'preview' -> 3: 'result'
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'result'>('upload');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Parsed rows
  const [rows, setRows] = useState<ExcelImportRow[]>([]);
  const [sheetName, setSheetName] = useState<string>('');
  
  // Filter inside preview table
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'duplicate' | 'error' | 'warning'>('all');

  // Result state
  const [importedCount, setImportedCount] = useState<number>(0);
  const [duplicateSkippedCount, setDuplicateSkippedCount] = useState<number>(0);
  const [errorCount, setErrorCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleReset = () => {
    setSelectedFile(null);
    setRows([]);
    setParseError(null);
    setCurrentStep('upload');
    setImportedCount(0);
    setDuplicateSkippedCount(0);
    setErrorCount(0);
    setPreviewFilter('all');
    setSheetName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Reset entire state when modal opens
  useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset previous parse results & errors before processing new file
    setSelectedFile(file);
    setParseError(null);
    setRows([]);
    setImportedCount(0);
    setDuplicateSkippedCount(0);
    setErrorCount(0);
    setPreviewFilter('all');
    setIsProcessing(true);

    try {
      const result = await parseExcelFile(file, employees, existingRecords, thresholdTime);
      setRows(result.rows);
      setSheetName(result.sheetName);
      setCurrentStep('preview');
    } catch (err: any) {
      setParseError(err?.message || 'Không thể đọc tệp Excel. Vui lòng kiểm tra định dạng.');
    } finally {
      setIsProcessing(false);
      // Reset input value so selecting the exact same file fires onChange again
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleConfirmImport = () => {
    // Chỉ xử lý các dòng HỢP LỆ về cấu trúc dữ liệu
    const validRows = rows.filter(r => r.isValid && r.matchedEmployee && r.normalizedDate && r.normalizedTime);
    
    const recordsToImport: Omit<ArrivalRecord, 'id' | 'createdAt'>[] = [];
    let duplicateSkipped = 0;

    // Kiểm tra chống trùng hoàn toàn từng record trước khi thêm
    for (const r of validRows) {
      const candidate: Omit<ArrivalRecord, 'id' | 'createdAt'> = {
        employeeId: r.matchedEmployee!.id,
        employeeCode: r.matchedEmployee!.code,
        date: r.normalizedDate!,
        arrivalTime: r.normalizedTime!,
        isLate: !!r.isLate,
        lateSeconds: r.lateSeconds || 0,
        notes: r.rawNotes?.trim() ? r.rawNotes.trim() : undefined,
        createdBy: 'Nhập file Excel (Admin)',
      };

      // 1. Kiểm tra xem đã tồn tại record có tất cả trường dữ liệu nghiệp vụ giống hệt trong hệ thống chưa
      const isDuplicateInSystem = existingRecords.some(existing => isExactDuplicateRecord(candidate, existing));

      // 2. Kiểm tra xem có trùng hoàn toàn với record nào vừa được chấp nhận thêm trong chính đợt nhập này không
      const isDuplicateInBatch = recordsToImport.some(added => isExactDuplicateRecord(candidate, added));

      if (isDuplicateInSystem || isDuplicateInBatch) {
        // Đã tồn tại record giống hoàn toàn -> bỏ qua record mới đó
        duplicateSkipped++;
      } else {
        // Có bất kỳ trường nghiệp vụ nào khác nhau (hoặc mới hoàn toàn) -> thêm bình thường
        recordsToImport.push(candidate);
      }
    }

    if (recordsToImport.length > 0) {
      onImportConfirmed(recordsToImport);
    }
    
    setImportedCount(recordsToImport.length);
    setDuplicateSkippedCount(duplicateSkipped);
    setErrorCount(rows.filter(r => !r.isValid).length);
    setCurrentStep('result');
  };

  const validRowsCount = rows.filter(r => r.isValid).length;
  const errorRowsCount = rows.filter(r => !r.isValid).length;
  const exactDuplicateRowsCount = rows.filter(r => r.isValid && r.isExactDuplicate).length;
  const newValidRowsCount = rows.filter(r => r.isValid && !r.isExactDuplicate).length;
  const sameDayWarningRowsCount = rows.filter(r => r.isValid && r.isDuplicateWarning && !r.isExactDuplicate).length;

  const displayedRows = rows.filter(r => {
    if (previewFilter === 'valid') return r.isValid && !r.isExactDuplicate;
    if (previewFilter === 'duplicate') return r.isValid && r.isExactDuplicate;
    if (previewFilter === 'error') return !r.isValid;
    if (previewFilter === 'warning') return r.isValid && r.isDuplicateWarning && !r.isExactDuplicate;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Nhập Dữ Liệu Chấm Công Hàng Loạt Từ Excel
              </h3>
              <p className="text-xs text-slate-500">
                Kiểm tra đối chiếu mã nhân viên, định dạng thời gian và phát hiện lỗi trước khi lưu
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicator */}
        <div className="px-6 py-2.5 bg-slate-100/60 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-6">
            <span className={`font-semibold flex items-center space-x-1.5 ${
              currentStep === 'upload' ? 'text-blue-600' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>1</span>
              <span>Chọn tệp tin</span>
            </span>

            <span className={`font-semibold flex items-center space-x-1.5 ${
              currentStep === 'preview' ? 'text-blue-600' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>2</span>
              <span>Kiểm tra & Xem trước</span>
            </span>

            <span className={`font-semibold flex items-center space-x-1.5 ${
              currentStep === 'result' ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                currentStep === 'result' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>3</span>
              <span>Kết quả nhập</span>
            </span>
          </div>

          <button
            onClick={downloadExcelSampleTemplate}
            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Tải mẫu Excel chuẩn (.xlsx)</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* STEP 1: Upload */}
          {currentStep === 'upload' && (
            <div className="space-y-6">
              
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-8 text-center transition-colors bg-slate-50/50">
                <UploadCloud className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Chọn tệp Excel hoặc CSV từ máy tính
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Hỗ trợ định dạng <code>.xlsx</code>, <code>.xls</code>, <code>.csv</code>. 
                  Cần chứa các cột: <strong>Mã nhân viên, Ngày làm việc, Giờ đến, Ghi chú</strong>.
                </p>

                <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs">
                  <span>Chọn tệp Excel</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onClick={(e) => {
                      (e.target as HTMLInputElement).value = '';
                    }}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {parseError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-3 text-xs text-rose-800">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Lỗi đọc file:</h5>
                    <p className="mt-0.5">{parseError}</p>
                  </div>
                </div>
              )}

              {/* Guide card */}
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs text-slate-700">
                <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Quy tắc đối chiếu & xác định đi trễ khi nhập Excel:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li>Đối chiếu <strong>chính xác theo Mã nhân viên</strong> (ví dụ: VPC-101). Không tự gán theo tên tương tự.</li>
                  <li>Ngưỡng giờ đến hiện tại: <strong>{thresholdTime}</strong>. Đúng {thresholdTime} hoặc sớm hơn là Đúng giờ; lớn hơn {thresholdTime} được tính là Đi trễ.</li>
                  <li>Nếu một nhân viên có nhiều bản ghi trong cùng ngày, hệ thống sẽ <strong>cảnh báo nghi trùng</strong> để bạn kiểm tra, nhưng <strong>không tự động chặn</strong>.</li>
                  <li>Các dòng sai định dạng hoặc mã nhân viên không tồn tại sẽ bị từ chối và thông báo chi tiết.</li>
                </ul>
              </div>

            </div>
          )}

          {/* STEP 2: Preview & Validation */}
          {currentStep === 'preview' && (
            <div className="space-y-4">
              
              {/* Summary Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-[11px] text-slate-500 block">Tổng số dòng đọc được</span>
                  <span className="text-xl font-bold text-slate-900">{rows.length} dòng</span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <span className="text-[11px] text-emerald-700 block font-semibold">Hợp lệ thêm mới</span>
                  <span className="text-xl font-bold text-emerald-700">{newValidRowsCount} dòng</span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="text-[11px] text-amber-700 block font-semibold">Trùng hoàn toàn (Bỏ qua)</span>
                  <span className="text-xl font-bold text-amber-700">{exactDuplicateRowsCount} dòng</span>
                </div>

                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <span className="text-[11px] text-rose-700 block font-semibold">Dòng có lỗi (Bị bỏ qua)</span>
                  <span className="text-xl font-bold text-rose-700">{errorRowsCount} dòng</span>
                </div>
              </div>

              {/* Filter Tabs for Preview */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      previewFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tất cả ({rows.length})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('valid')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                      previewFilter === 'valid' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Hợp lệ mới ({newValidRowsCount})
                  </button>
                  {exactDuplicateRowsCount > 0 && (
                    <button
                      onClick={() => setPreviewFilter('duplicate')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        previewFilter === 'duplicate' ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Trùng hoàn toàn ({exactDuplicateRowsCount})
                    </button>
                  )}
                  {errorRowsCount > 0 && (
                    <button
                      onClick={() => setPreviewFilter('error')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        previewFilter === 'error' ? 'bg-rose-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Lỗi ({errorRowsCount})
                    </button>
                  )}
                  {sameDayWarningRowsCount > 0 && (
                    <button
                      onClick={() => setPreviewFilter('warning')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        previewFilter === 'warning' ? 'bg-amber-500 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Nghi trùng ngày ({sameDayWarningRowsCount})
                    </button>
                  )}
                </div>

                <span className="text-xs text-slate-500 font-mono">
                  Trang tính: {sheetName}
                </span>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Dòng</th>
                      <th className="py-2 px-3">Mã NV</th>
                      <th className="py-2 px-3">Nhân viên đối chiếu</th>
                      <th className="py-2 px-3">Ngày</th>
                      <th className="py-2 px-3">Giờ đến</th>
                      <th className="py-2 px-3">Trạng thái giờ</th>
                      <th className="py-2 px-3">Kiểm tra hợp lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {displayedRows.map((r) => (
                      <tr 
                        key={r.rowNumber} 
                        className={`hover:bg-slate-50/80 ${
                          !r.isValid ? 'bg-rose-50/40' : r.isExactDuplicate ? 'bg-slate-100/60' : r.isDuplicateWarning ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-slate-400">{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-900">{r.rawCode || '-'}</td>
                        <td className="py-2 px-3">
                          {r.matchedEmployee ? (
                            <div>
                              <div className="font-semibold text-slate-900">{r.matchedEmployee.fullName}</div>
                              <div className="text-[11px] text-slate-500">{r.matchedEmployee.department}</div>
                            </div>
                          ) : (
                            <span className="text-rose-600 font-semibold italic">Không khớp mã NV</span>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {r.normalizedDate ? formatDateVN(r.normalizedDate) : r.rawDate}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {r.normalizedTime || r.rawTime}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {r.isValid && (
                            r.isLate ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                Trễ (+{Math.round((r.lateSeconds || 0) / 60)}p)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Đúng giờ
                              </span>
                            )
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            r.isExactDuplicate ? (
                              <div className="text-slate-600 flex items-start space-x-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                                <span className="text-[11px] font-medium text-amber-800">
                                  Trùng hoàn toàn (sẽ bỏ qua khi nhập)
                                </span>
                              </div>
                            ) : r.isDuplicateWarning ? (
                              <div className="text-amber-700 flex items-start space-x-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                <span className="text-[11px]">{r.warnings[0]}</span>
                              </div>
                            ) : (
                              <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Hợp lệ</span>
                              </span>
                            )
                          ) : (
                            <div className="text-rose-600 flex items-start space-x-1">
                              <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span className="text-[11px]">{r.errors.join('; ')}</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Warning note if duplicates exist */}
              {exactDuplicateRowsCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Lưu ý chống trùng lặp:</span> Có {exactDuplicateRowsCount} dòng trùng khớp 100% tất cả các trường dữ liệu nghiệp vụ (nhân viên, ngày, giờ đến, ghi chú). 
                    Hệ thống sẽ <strong>tự động bỏ qua các bản ghi trùng này</strong> để không tạo dữ liệu trùng lặp.
                  </div>
                </div>
              )}

              {sameDayWarningRowsCount > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Ghi nhận cùng ngày khác giờ/ghi chú:</span> Có {sameDayWarningRowsCount} dòng cùng nhân viên và cùng ngày nhưng khác giờ hoặc ghi chú. 
                    Hệ thống <strong>vẫn ghi nhận bình thường</strong> theo đúng quy định, không chặn.
                  </div>
                </div>
              )}

            </div>
          )}

          {/* STEP 3: Results */}
          {currentStep === 'result' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h4 className="text-lg font-bold text-slate-900">
                {importedCount > 0 
                  ? 'Nhập Dữ Liệu Excel Hoàn Tất!' 
                  : duplicateSkippedCount > 0 
                    ? 'Đã Bỏ Qua Các Bản Ghi Trùng Lặp' 
                    : 'Kết Quả Xử Lý Tệp Excel'}
              </h4>

              <div className="max-w-xs mx-auto p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Đã thêm mới thành công:</span>
                  <span className="font-bold text-emerald-600">{importedCount} bản ghi</span>
                </div>
                {duplicateSkippedCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-amber-700">Bỏ qua do trùng hoàn toàn:</span>
                    <span className="font-bold text-amber-700">{duplicateSkippedCount} bản ghi</span>
                  </div>
                )}
                {errorCount > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-rose-600">Bỏ qua do lỗi dữ liệu:</span>
                    <span className="font-bold text-rose-600">{errorCount} dòng</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-1.5 font-semibold text-slate-800">
                  <span>Tổng số dòng xử lý:</span>
                  <span>{rows.length} dòng</span>
                </div>
              </div>

              {importedCount === 0 && duplicateSkippedCount > 0 && (
                <p className="text-xs text-amber-700 max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  Tất cả các bản ghi trong tệp đều trùng hoàn toàn với dữ liệu đã tồn tại trên hệ thống. 
                  Hệ thống đã tự động bỏ qua toàn bộ để tránh nhân đôi dữ liệu.
                </p>
              )}

              {importedCount > 0 && (
                <p className="text-xs text-slate-500">
                  {duplicateSkippedCount > 0 
                    ? `Đã thêm ${importedCount} bản ghi mới và bỏ qua ${duplicateSkippedCount} bản ghi trùng hoàn toàn.`
                    : 'Dữ liệu mới đã được cập nhật ngay lập tức vào danh sách theo dõi và các thống kê tổng quan.'}
                </p>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Chọn tệp Excel khác để tiếp tục kiểm tra / nhập</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          {currentStep === 'preview' ? (
            <>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Chọn tệp khác
              </button>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={validRowsCount === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  <span>
                    {newValidRowsCount > 0 
                      ? `Xác nhận nhập (${newValidRowsCount} bản ghi mới)` 
                      : `Xác nhận xử lý (${validRowsCount} dòng)`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : currentStep === 'result' ? (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center space-x-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nhập thêm tệp khác</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          ) : (
            <div className="w-full flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
