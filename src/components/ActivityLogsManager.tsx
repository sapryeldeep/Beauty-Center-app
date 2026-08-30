import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ActivityLog } from '../types';
import { 
  Activity, Shield, Filter, Search, Calendar, User, Building2, 
  Trash2, Download, Printer, FileSpreadsheet, RefreshCw, CheckCircle, 
  LogIn, DollarSign, Wallet, Users, Database, Clock, Sparkles
} from 'lucide-react';
import { ExportButtons } from './ExportButtons';
import { printReport, exportToExcel } from '../utils/exportUtils';

export function ActivityLogsManager() {
  const { data, updateData, currentUser } = useStore();
  
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  const clinics = data.clinics || [];
  const rawLogs = (data.activityLogs || []).filter(log => currentUser?.role === "developer" ? true : clinics.some(c => c.id === log.clinicId) || (log.clinicId === "master" && data.users.find(u => u.name === log.userName)?.tenantId === currentUser?.user));

  // Get clinic name helper
  const getClinicName = (cId: string) => {
    if (cId === 'master' || !cId) return 'المركز الرئيسي / الإدارة';
    const c = clinics.find(x => x.id === cId);
    return c ? c.name : 'فرع غير معروف';
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return rawLogs.filter(log => {
      // Clinic filter
      if (selectedClinicId !== 'all' && log.clinicId !== selectedClinicId) {
        return false;
      }

      // User filter
      if (selectedUser !== 'all' && log.userName !== selectedUser) {
        return false;
      }

      // Action type filter
      if (actionFilter !== 'all') {
        if (actionFilter === 'login' && !log.action.includes('دخول') && !log.action.includes('خروج')) return false;
        if (actionFilter === 'finance' && !log.action.includes('مالي') && !log.action.includes('فاتورة') && !log.action.includes('إيراد') && !log.action.includes('مصروف') && !log.details.includes('[finance]') && !log.details.includes('[expense]')) return false;
        if (actionFilter === 'staff' && !log.action.includes('موظف') && !log.action.includes('راتب') && !log.details.includes('[staff]') && !log.details.includes('[payroll]')) return false;
        if (actionFilter === 'backup' && !log.action.includes('نسخ') && !log.action.includes('استعادة') && !log.details.includes('[backup]')) return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const logDate = log.timestamp ? log.timestamp.split('T')[0] : '';
        if (dateFilter === 'today' && logDate !== todayStr) return false;
        if (dateFilter === 'week') {
          const d = new Date(log.timestamp);
          const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
          if (diff > 7) return false;
        }
        if (dateFilter === 'month') {
          const d = new Date(log.timestamp);
          if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return false;
        }
      }

      // Search query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const clinicName = getClinicName(log.clinicId).toLowerCase();
        const user = (log.userName || '').toLowerCase();
        const action = (log.action || '').toLowerCase();
        const details = (log.details || '').toLowerCase();

        return clinicName.includes(query) || user.includes(query) || action.includes(query) || details.includes(query);
      }

      return true;
    });
  }, [rawLogs, selectedClinicId, selectedUser, actionFilter, dateFilter, searchTerm, clinics]);

  // Unique users from logs
  const uniqueUsers = useMemo(() => {
    const set = new Set<string>();
    rawLogs.forEach(l => {
      if (l.userName) set.add(l.userName);
    });
    return Array.from(set);
  }, [rawLogs]);

  // Summary counts
  const totalLogsCount = rawLogs.length;
  const loginCount = rawLogs.filter(l => l.action.includes('دخول')).length;
  const financialCount = rawLogs.filter(l => l.action.includes('فاتورة') || l.action.includes('إيراد') || l.action.includes('مصروف') || l.details?.includes('[finance]') || l.details?.includes('[expense]')).length;

  const handleClearLogs = () => {
    if (!confirm('هل أنت متأكد من مسح سجلات النشاط؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    updateData({ activityLogs: [] });
  };

  // Format timestamp
  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return ts;
    }
  };

  // Get Badge style for action
  const getActionBadge = (action: string, details: string) => {
    if (action.includes('دخول') || details.includes('[auth]')) {
      return <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2.5 py-1 rounded-lg font-bold"><LogIn size={12} /> {action}</span>;
    }
    if (action.includes('فاتورة') || action.includes('إيراد') || details.includes('[finance]')) {
      return <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2.5 py-1 rounded-lg font-bold"><DollarSign size={12} /> {action}</span>;
    }
    if (action.includes('مصروف') || details.includes('[expense]')) {
      return <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Wallet size={12} /> {action}</span>;
    }
    if (action.includes('نسخ') || action.includes('استعادة') || details.includes('[backup]')) {
      return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Database size={12} /> {action}</span>;
    }
    if (action.includes('موظف') || action.includes('راتب') || details.includes('[staff]') || details.includes('[payroll]')) {
      return <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Users size={12} /> {action}</span>;
    }
    return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-lg font-bold"><Activity size={12} /> {action}</span>;
  };

  const handlePrint = () => {
    const targetClinic = data.clinics.find(c => c.id === selectedClinicId) || data.clinics[0];
    
    const summaryHtml = `
      <div style="display: flex; gap: 15px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">إجمالي السجلات</div>
          <div style="font-size: 16px; font-weight: bold; color: #1e293b;">${filteredLogs.length} عملية</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">الفرع المحدد</div>
          <div style="font-size: 14px; font-weight: bold; color: #4f46e5;">${selectedClinicId === 'all' ? 'كافة الفروع' : getClinicName(selectedClinicId)}</div>
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px;">
          <div style="font-size: 11px; color: #64748b;">تاريخ الاستخراج</div>
          <div style="font-size: 14px; font-weight: bold; color: #0f172a;">${new Date().toLocaleDateString('ar-EG')}</div>
        </div>
      </div>
    `;

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>التاريخ والوقت</th>
            <th>الفرع</th>
            <th>المستخدم</th>
            <th>نوع الإجراء</th>
            <th>التفاصيل والبيان</th>
          </tr>
        </thead>
        <tbody>
          ${filteredLogs.length === 0 ? `
            <tr><td colspan="5" style="text-align: center; color: #94a3b8; padding: 20px;">لا توجد سجلات مطابقة</td></tr>
          ` : filteredLogs.map(l => `
            <tr>
              <td style="font-family: monospace; font-size: 11px;">${formatTimestamp(l.timestamp)}</td>
              <td style="font-weight: bold;">${getClinicName(l.clinicId)}</td>
              <td style="font-weight: bold;">${l.userName || 'غير محدد'}</td>
              <td><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${l.action}</span></td>
              <td>${l.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    printReport(
      'سجل نشاطات وعمليات الفروع (Activity Logs)',
      tableHtml,
      targetClinic,
      summaryHtml
    );
  };

  const handleExcelExport = () => {
    const excelRows = filteredLogs.map(l => ({
      'المعرف': l.id,
      'التاريخ والوقت': formatTimestamp(l.timestamp),
      'الفرع': getClinicName(l.clinicId),
      'اسم المستخدم': l.userName,
      'نوع الإجراء': l.action,
      'التفاصيل الكاملة': l.details
    }));

    exportToExcel(excelRows, `activity_logs_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Activity size={22} />
            </div>
            <div>
              <h5 className="font-black text-slate-800 text-lg m-0">سجل أنشطة وعمليات الفروع (Activity Logs)</h5>
              <p className="text-xs text-slate-500 mt-0.5">
                تتبع حي لتسجيل دخول الموظفين، العمليات المالية، التعديلات الإدارية، وإجراءات النسخ الاحتياطي في كل فرع
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200 shadow-2xs"
          >
            <Printer size={15} /> طباعة منسقة
          </button>
          <button 
            onClick={handleExcelExport}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition-all border border-emerald-200 shadow-2xs"
          >
            <FileSpreadsheet size={15} /> تصدير Excel
          </button>
          {currentUser?.role === 'developer' && rawLogs.length > 0 && (
            <button 
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all border border-rose-200 shadow-2xs"
              title="تفريغ سجل النشاطات"
            >
              <Trash2 size={15} /> تفريغ السجل
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-center">
          <div className="text-xs text-slate-500 mb-1 font-bold">إجمالي العمليات المسجلة</div>
          <div className="text-xl font-black text-slate-800">{totalLogsCount}</div>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-xl text-center">
          <div className="text-xs text-emerald-600 mb-1 font-bold">تسجيلات الدخول</div>
          <div className="text-xl font-black text-emerald-700">{loginCount}</div>
        </div>
        <div className="bg-indigo-50/60 border border-indigo-100 p-3.5 rounded-xl text-center">
          <div className="text-xs text-indigo-600 mb-1 font-bold">العمليات المالية والفواتير</div>
          <div className="text-xl font-black text-indigo-700">{financialCount}</div>
        </div>
        <div className="bg-purple-50/60 border border-purple-100 p-3.5 rounded-xl text-center">
          <div className="text-xs text-purple-600 mb-1 font-bold">المستخدمين النشطين</div>
          <div className="text-xl font-black text-purple-700">{uniqueUsers.length}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          
          {/* Search box */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">بحث نصي سريع</label>
            <div className="relative">
              <Search size={15} className="absolute right-3 top-3 text-slate-400" />
              <input 
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="ابحث بالاسم، الفرع، التفاصيل..."
                className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs outline-none focus:border-indigo-600 font-bold"
              />
            </div>
          </div>

          {/* Clinic filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">تصفية حسب الفرع</label>
            <select
              value={selectedClinicId}
              onChange={e => setSelectedClinicId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-600 font-bold"
            >
              <option value="all">كافة الفروع والمركز الرئيسي</option>
              <option value="master">المركز الرئيسي (Master)</option>
              {clinics.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* User filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">تصفية حسب المستخدم</label>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-600 font-bold"
            >
              <option value="all">كافة الموظفين والمستخدمين</option>
              {uniqueUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Action category filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع العملية</label>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-600 font-bold"
            >
              <option value="all">كافة أنواع العمليات</option>
              <option value="login">تسجيل الدخول / الخروج</option>
              <option value="finance">العمليات المالية والإيرادات</option>
              <option value="staff">الموظفين ومسير الرواتب</option>
              <option value="backup">النسخ الاحتياطي والأمان</option>
            </select>
          </div>

        </div>

        {/* Date Filter Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-500" />
            <span className="font-bold text-slate-600">الفترة الزمنية:</span>
            <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
              <button 
                onClick={() => setDateFilter('all')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${dateFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                الكل
              </button>
              <button 
                onClick={() => setDateFilter('today')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${dateFilter === 'today' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                اليوم
              </button>
              <button 
                onClick={() => setDateFilter('week')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${dateFilter === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                آخر 7 أيام
              </button>
              <button 
                onClick={() => setDateFilter('month')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${dateFilter === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                هذا الشهر
              </button>
            </div>
          </div>

          <div className="text-slate-500 font-medium">
            عرض <span className="font-bold text-indigo-600">{filteredLogs.length}</span> من أصل <span className="font-bold">{rawLogs.length}</span> عملية
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[460px] overflow-y-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-xs">التاريخ والوقت</th>
              <th className="p-3 text-xs">الفرع</th>
              <th className="p-3 text-xs">المستخدم</th>
              <th className="p-3 text-xs">نوع الإجراء</th>
              <th className="p-3 text-xs">تفاصيل وبيان العملية</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  <Activity size={36} className="mx-auto mb-2 opacity-30" />
                  لا توجد سجلات نشاط مطابقة للخيارات المحددة
                </td>
              </tr>
            ) : (
              filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap font-mono">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="p-3 font-bold text-xs text-slate-800 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={13} className="text-indigo-500" />
                      {getClinicName(log.clinicId)}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-xs text-slate-900 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <User size={13} className="text-slate-400" />
                      {log.userName || 'غير محدد'}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {getActionBadge(log.action, log.details)}
                  </td>
                  <td className="p-3 text-xs text-slate-700 font-medium">
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
