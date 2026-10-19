import React, { useState, useEffect } from 'react';
import { 
  Employee, 
  ArrivalRecord, 
  WorkspaceSettings, 
  ActiveTab 
} from './types';
import { 
  DEFAULT_SETTINGS, 
  INITIAL_EMPLOYEES, 
  INITIAL_ARRIVAL_RECORDS 
} from './data/mockData';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { OverviewTab } from './components/OverviewTab';
import { AttendanceTab } from './components/AttendanceTab';
import { EmployeeDirectoryTab } from './components/EmployeeDirectoryTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { ArrivalRecordModal } from './components/modals/ArrivalRecordModal';
import { ExcelImportModal } from './components/modals/ExcelImportModal';
import { EmployeeModal } from './components/modals/EmployeeModal';
import { EmployeeDetailDrawer } from './components/modals/EmployeeDetailDrawer';
import { evaluateArrivalLate, isExactDuplicateRecord } from './utils/helpers';

export const App: React.FC = () => {
  const STORAGE_PREFIX = 'vpc_attendance_v4_';
  
  // 1. Employees state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}employees`);
      return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    } catch {
      return INITIAL_EMPLOYEES;
    }
  });

  // 2. Arrival records state
  const [records, setRecords] = useState<ArrivalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}records`);
      return saved ? JSON.parse(saved) : INITIAL_ARRIVAL_RECORDS;
    } catch {
      return INITIAL_ARRIVAL_RECORDS;
    }
  });

  // 3. Workspace settings state
  const [settings, setSettings] = useState<WorkspaceSettings>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Modals state
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ArrivalRecord | null>(null);
  const [initialEmployeeId, setInitialEmployeeId] = useState<string | undefined>(undefined);

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [inspectingEmployee, setInspectingEmployee] = useState<Employee | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}employees`, JSON.stringify(employees));
    } catch (e) {
      console.error('Failed to save employees', e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}records`, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save records', e);
    }
  }, [records]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  // Handle single arrival record
  const handleSaveRecord = (
    recordData: Omit<ArrivalRecord, 'id' | 'createdAt'>, 
    existingId?: string
  ) => {
    // Re-verify late state using central logic
    const evalResult = evaluateArrivalLate(recordData.arrivalTime, settings.lateThresholdTime);
    
    if (existingId) {
      setRecords(prev => prev.map(rec => {
        if (rec.id === existingId) {
          return {
            ...rec,
            ...recordData,
            isLate: evalResult.isLate,
            lateSeconds: evalResult.lateSeconds,
            updatedAt: new Date().toISOString(),
          };
        }
        return rec;
      }));
    } else {
      const newRecord: ArrivalRecord = {
        ...recordData,
        id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        isLate: evalResult.isLate,
        lateSeconds: evalResult.lateSeconds,
        createdAt: new Date().toISOString(),
      };
      setRecords(prev => [newRecord, ...prev]);
    }
  };

  const handleDeleteRecord = (id: string) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  // Handle bulk Excel import
  const handleImportConfirmed = (newRecordsData: Omit<ArrivalRecord, 'id' | 'createdAt'>[]) => {
    setRecords(prev => {
      const recordsToAdd: ArrivalRecord[] = [];
      const currentRecords = [...prev];

      for (let i = 0; i < newRecordsData.length; i++) {
        const data = newRecordsData[i];
        
        // 1. Kiểm tra chống trùng hoàn toàn với các bản ghi đã có trong hệ thống
        const isDuplicateInCurrent = currentRecords.some(r => isExactDuplicateRecord(data, r));
        // 2. Kiểm tra chống trùng hoàn toàn với các bản ghi vừa được duyệt trong đợt này
        const isDuplicateInBatch = recordsToAdd.some(r => isExactDuplicateRecord(data, r));

        if (!isDuplicateInCurrent && !isDuplicateInBatch) {
          const evalResult = evaluateArrivalLate(data.arrivalTime, settings.lateThresholdTime);
          const newRecord: ArrivalRecord = {
            ...data,
            id: `excel-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
            isLate: evalResult.isLate,
            lateSeconds: evalResult.lateSeconds,
            createdAt: new Date().toISOString(),
          };
          recordsToAdd.push(newRecord);
        }
      }

      if (recordsToAdd.length === 0) return prev;
      return [...recordsToAdd, ...prev];
    });
  };

  // Handle Employee Management
  const handleSaveEmployee = (empData: Omit<Employee, 'id'>, existingId?: string) => {
    if (existingId) {
      setEmployees(prev => prev.map(emp => emp.id === existingId ? { ...emp, ...empData } : emp));
    } else {
      const newEmp: Employee = {
        ...empData,
        id: `emp-${Date.now()}`,
      };
      setEmployees(prev => [...prev, newEmp]);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
    // Keep past arrival records for history
  };

  // Handle Settings Update & Dynamic Re-evaluation
  const handleUpdateSettings = (newSettings: WorkspaceSettings) => {
    setSettings(newSettings);
    // Khi ngưỡng giờ đến thay đổi, tự động đánh giá lại trạng thái đi trễ của toàn bộ bản ghi
    setRecords(prev => prev.map(rec => {
      const evalResult = evaluateArrivalLate(rec.arrivalTime, newSettings.lateThresholdTime);
      return {
        ...rec,
        isLate: evalResult.isLate,
        lateSeconds: evalResult.lateSeconds,
      };
    }));
  };

  // Reset to initial demo data
  const handleResetData = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setRecords(INITIAL_ARRIVAL_RECORDS);
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(`${STORAGE_PREFIX}employees`);
    localStorage.removeItem(`${STORAGE_PREFIX}records`);
    localStorage.removeItem(`${STORAGE_PREFIX}settings`);
  };

  // Backup JSON
  const handleExportBackup = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      company: settings.companyName,
      settings,
      employees,
      records,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VPC_Attendance_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.employees && parsed.records) {
          setEmployees(parsed.employees);
          setRecords(parsed.records);
          if (parsed.settings) setSettings(parsed.settings);
          alert('Khôi phục dữ liệu thành công!');
        } else {
          alert('Tệp sao lưu không đúng định dạng VPC Attendance.');
        }
      } catch (err) {
        alert('Lỗi đọc tệp JSON. Vui lòng kiểm tra lại.');
      }
    };
    reader.readAsText(file);
  };

  const totalLateCount = records.filter(r => r.isLate).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        lateCountToday={totalLateCount}
        onOpenRecordModal={() => {
          setEditingRecord(null);
          setInitialEmployeeId(undefined);
          setIsRecordModalOpen(true);
        }}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onOpenEmployeeModal={() => {
          setEditingEmployee(null);
          setIsEmployeeModalOpen(true);
        }}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onResetData={handleResetData}
      />

      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        totalLateCount={totalLateCount}
        onSelectTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Tab Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'overview' && (
          <OverviewTab
            employees={employees}
            records={records}
            thresholdTime={settings.lateThresholdTime}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenRecordModal={() => {
              setEditingRecord(null);
              setInitialEmployeeId(undefined);
              setIsRecordModalOpen(true);
            }}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
            onSelectEmployee={(emp) => setInspectingEmployee(emp)}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab
            employees={employees}
            records={records}
            thresholdTime={settings.lateThresholdTime}
            onOpenRecordModal={() => {
              setEditingRecord(null);
              setInitialEmployeeId(undefined);
              setIsRecordModalOpen(true);
            }}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
            onEditRecord={(rec) => {
              setEditingRecord(rec);
              setIsRecordModalOpen(true);
            }}
            onDeleteRecord={handleDeleteRecord}
            onSelectEmployee={(emp) => setInspectingEmployee(emp)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeDirectoryTab
            employees={employees}
            records={records}
            onAddEmployee={() => {
              setEditingEmployee(null);
              setIsEmployeeModalOpen(true);
            }}
            onEditEmployee={(emp) => {
              setEditingEmployee(emp);
              setIsEmployeeModalOpen(true);
            }}
            onDeleteEmployee={handleDeleteEmployee}
            onSelectEmployeeDetail={(emp) => setInspectingEmployee(emp)}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsTab
            employees={employees}
            records={records}
            thresholdTime={settings.lateThresholdTime}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetAllData={handleResetData}
            onExportBackup={handleExportBackup}
            onImportBackup={handleImportBackup}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} Công ty Cổ phần VPC • Phân hệ Hành chính Nội bộ & Theo dõi Đi trễ</span>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Ngưỡng chuẩn: {settings.lateThresholdTime}</span>
            <span>•</span>
            <span>Không áp dụng tiền phạt</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ArrivalRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setEditingRecord(null);
          setInitialEmployeeId(undefined);
        }}
        employees={employees}
        existingRecords={records}
        thresholdTime={settings.lateThresholdTime}
        editingRecord={editingRecord}
        initialEmployeeId={initialEmployeeId}
        onSave={handleSaveRecord}
      />

      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        employees={employees}
        existingRecords={records}
        thresholdTime={settings.lateThresholdTime}
        onImportConfirmed={handleImportConfirmed}
      />

      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => {
          setIsEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        editingEmployee={editingEmployee}
        existingCodes={employees.map(e => e.code)}
        onSave={handleSaveEmployee}
      />

      <EmployeeDetailDrawer
        isOpen={!!inspectingEmployee}
        onClose={() => setInspectingEmployee(null)}
        employee={inspectingEmployee}
        records={records}
        onAddRecordForEmp={(empId) => {
          setInspectingEmployee(null);
          setEditingRecord(null);
          setInitialEmployeeId(empId);
          setIsRecordModalOpen(true);
        }}
        onEditEmployee={(emp) => {
          setInspectingEmployee(null);
          setEditingEmployee(emp);
          setIsEmployeeModalOpen(true);
        }}
      />

    </div>
  );
};
export default App;
