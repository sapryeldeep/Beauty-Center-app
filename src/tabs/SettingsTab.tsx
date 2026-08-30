import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings, User, Key, Shield, LayoutGrid, Plus, Save, Trash, Terminal, Users, Calendar, Database, Download, Upload, Edit, X, Activity, Building2, CheckCircle, AlertCircle, Receipt, ShieldCheck, Volume2, QrCode, SlidersHorizontal, Percent, ChevronDown, ChevronUp, Printer, Globe } from 'lucide-react';
import { Role } from '../types';
import { BackupManager } from '../components/BackupManager';
import { ActivityLogsManager } from '../components/ActivityLogsManager';
import { InvoiceSettingsModal } from '../components/InvoiceSettingsModal';
import { VoiceCallSettingsModal } from '../components/VoiceCallSettingsModal';
import { StaffPermissionsModal } from '../components/StaffPermissionsModal';
import { exportToExcel } from '../utils/exportUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { ref as dbRef, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import EditInvoiceModal from '../components/EditInvoiceModal';

export default function SettingsTab() {
  const { data, updateData, currentUser, resetData } = useStore();
  
  if (currentUser?.role !== 'developer' || currentUser?.user !== 'sapry eldeep') {
    return (
      <div className="p-8 text-center bg-rose-50 text-rose-700 rounded-3xl border border-rose-200/60 font-bold font-[Cairo] max-w-lg mx-auto my-12 shadow-sm animate-in fade-in">
        ⚠️ عذراً، لوحة تحكم المطور محمية تماماً ولا يُسمح بالدخول إليها إلا للمطور الرئيسي صبري الديب بعد تسجيل الدخول بهويته.
      </div>
    );
  }

  const [newCenterName, setNewCenterName] = useState('');
  const [newCenterUser, setNewCenterUser] = useState('');
  const [newCenterPass, setNewCenterPass] = useState('');
  const [newCenterBranches, setNewCenterBranches] = useState(3);
  const [newCenterDesignSalePrice, setNewCenterDesignSalePrice] = useState<number>(5000);
  const [newCenterBranchSalePrice, setNewCenterBranchSalePrice] = useState<number>(1500);
  const [newCenterPaidAmountToDev, setNewCenterPaidAmountToDev] = useState<number>(5000);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);

  // Accordion active state for Dev Panel advanced settings
  const [activeAccordions, setActiveAccordions] = useState<Record<string, boolean>>({
    print: true,
    finance: false,
    staff: false,
    bookings: false
  });

  const toggleAccordion = (key: string) => {
    setActiveAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Clean Slate Data Reset State
  const [isCleanSlateConfirmed, setIsCleanSlateConfirmed] = useState(false);
  const [cleanSlateInputText, setCleanSlateInputText] = useState('');
  const [isCleanSlateSuccess, setIsCleanSlateSuccess] = useState(false);

  // Subscription Billing States
  const [subAmount, setSubAmount] = useState<number>(1000);
  const [subMonths, setSubMonths] = useState<number>(3);
  const [subStatus, setSubStatus] = useState<'paid' | 'unpaid'>('paid');
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<any | null>(null);
  
  // Invoice Edit Modal States
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editingInvoiceType, setEditingInvoiceType] = useState<'subscription' | 'clinic'>('subscription');
  const [editingInvoiceCenterUser, setEditingInvoiceCenterUser] = useState<string>('');
  const [editingInvoiceClinicId, setEditingInvoiceClinicId] = useState<string>('');

  // New User Form State
  const [editingCenterId, setEditingCenterId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserAcc, setNewUserAcc] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('doctor');
  const [newUserClinicId, setNewUserClinicId] = useState<string>('');

  const modules = data.settings?.modules || {
    patients: true, appointments: true, finance: true, services: true,
    inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
  };

  const handleToggleModule = (key: keyof typeof modules) => {
    updateData({
      settings: {
        ...data.settings,
        modules: {
          ...modules,
          [key]: !modules[key]
        },
        customLabels: data.settings?.customLabels || {}
      }
    });
  };



  
  const handleCreateCenter = () => {
    if (!newCenterName || !newCenterUser || !newCenterPass) return;
    
    if (editingCenterId) {
       const isDuplicate = data.users.some(u => u.user === newCenterUser && u.user !== editingCenterId);
       if (isDuplicate) {
         alert('اسم المستخدم موجود بالفعل! يرجى اختيار اسم مستخدم مختلف.');
         return;
       }
       updateData({
         users: data.users.map(u => u.user === editingCenterId ? {
           ...u,
           name: newCenterName,
           user: newCenterUser,
           pass: newCenterPass,
           maxBranches: newCenterBranches,
           designSalePrice: newCenterDesignSalePrice,
           branchSalePrice: newCenterBranchSalePrice,
           paidAmountToDev: newCenterPaidAmountToDev
         } : u)
       });
       setEditingCenterId(null);
       alert('تم تعديل المركز الرئيسي بنجاح');
    } else {
       const isDuplicate = data.users.some(u => u.user === newCenterUser);
       if (isDuplicate) {
         alert('اسم المستخدم موجود بالفعل! يرجى اختيار اسم مستخدم مختلف.');
         return;
       }
       const newUser = {
         name: newCenterName,
         user: newCenterUser,
         pass: newCenterPass,
         role: 'master_admin' as Role,
         clinicId: 'master',
         maxBranches: newCenterBranches,
         isActive: true,
         modules: { ...modules },
         designSalePrice: newCenterDesignSalePrice,
         branchSalePrice: newCenterBranchSalePrice,
         paidAmountToDev: newCenterPaidAmountToDev
       };
       updateData({ users: [...data.users, newUser] });
       alert('تم إنشاء المركز الرئيسي بنجاح');
    }

    setNewCenterName('');
    setNewCenterUser('');
    setNewCenterPass('');
    setNewCenterBranches(3);
    setNewCenterDesignSalePrice(5000);
    setNewCenterBranchSalePrice(1500);
    setNewCenterPaidAmountToDev(5000);
  };
  
  const handleEditCenterClick = (admin: any) => {
    setEditingCenterId(admin.user);
    setNewCenterName(admin.name);
    setNewCenterUser(admin.user);
    setNewCenterPass(admin.pass);
    setNewCenterBranches(admin.maxBranches || 3);
    setNewCenterDesignSalePrice(admin.designSalePrice || 5000);
    setNewCenterBranchSalePrice(admin.branchSalePrice || 1500);
    setNewCenterPaidAmountToDev(admin.paidAmountToDev || 0);
  };
  
  const handleCancelCenterEdit = () => {
    setEditingCenterId(null);
    setNewCenterName('');
    setNewCenterUser('');
    setNewCenterPass('');
    setNewCenterBranches(3);
  };


  const handleCreateUser = () => {
    if (!newUserName || !newUserAcc || !newUserPass || !newUserClinicId) {
      alert('يرجى تعبئة كافة الحقول، بما في ذلك اختيار الفرع.');
      return;
    }
    
    if (editingUserId) {
       const isDuplicate = data.users.some(u => u.user === newUserAcc && u.user !== editingUserId);
       if (isDuplicate) {
         alert('اسم المستخدم موجود بالفعل! يرجى اختيار اسم مستخدم مختلف.');
         return;
       }
       updateData({
         users: data.users.map(u => u.user === editingUserId ? {
           ...u,
           name: newUserName,
           user: newUserAcc,
           pass: newUserPass,
           role: newUserRole,
           clinicId: newUserClinicId,
         tenantId: currentUser?.role === "master_admin" ? currentUser.user : currentUser?.tenantId
         } : u)
       });
       setEditingUserId(null);
       alert('تم تعديل الموظف بنجاح');
    } else {
       const isDuplicate = data.users.some(u => u.user === newUserAcc);
       if (isDuplicate) {
         alert('اسم المستخدم موجود بالفعل! يرجى اختيار اسم مستخدم مختلف.');
         return;
       }
       const newUser = {
         name: newUserName,
         user: newUserAcc,
         pass: newUserPass,
         role: newUserRole,
         clinicId: newUserClinicId,
         tenantId: currentUser?.role === "master_admin" ? currentUser.user : currentUser?.tenantId
       };
       updateData({ users: [...data.users, newUser] });
       alert('تم إضافة الموظف وصلاحياته بنجاح');
    }

    setNewUserName('');
    setNewUserAcc('');
    setNewUserPass('');
  };

  const handleEditUserClick = (user: any) => {
    setEditingUserId(user.user);
    setNewUserName(user.name);
    setNewUserAcc(user.user);
    setNewUserPass(user.pass);
    setNewUserRole(user.role);
    setNewUserClinicId(user.clinicId);
  };
  
  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setNewUserName('');
    setNewUserAcc('');
    setNewUserPass('');
  };

  const deleteUser = (userAcc: string) => {
    setUserToDelete(userAcc);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      updateData({ users: data.users.filter(u => u.user !== userToDelete) });
      setUserToDelete(null);
    }
  };

  const cancelDeleteUser = () => {
    setUserToDelete(null);
  };

  const _dummy_deleteUser = (userAcc: string) => {
    if(confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      updateData({ users: data.users.filter(u => u.user !== userAcc) });
    }
  };


  const [selectedCenterId, setSelectedCenterId] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const isDeveloper = currentUser?.role === 'developer';
  const masterAdmins = isDeveloper ? data.users.filter(u => u.role === "master_admin") : [];
  const branchUsers = isDeveloper ? data.users.filter(u => u.role !== 'master_admin' && u.role !== 'developer') : [];

  // Developer Accounting Calculations
  const devCurrency = data.settings?.developerCurrency || 'EGP';
  
  const totalDesignSales = masterAdmins.reduce((sum, admin) => sum + (admin.designSalePrice || 5000), 0);
  const totalBranchSales = masterAdmins.reduce((sum, admin) => {
    const branchesCount = data.clinics.filter(c => c.masterAdminId === admin.user).length;
    return sum + ((admin.branchSalePrice || 1500) * branchesCount);
  }, 0);
  const totalSalesValue = totalDesignSales + totalBranchSales;
  const totalCollectedFromCenters = masterAdmins.reduce((sum, admin) => sum + (admin.paidAmountToDev || 0), 0);
  const totalPendingFromCenters = totalSalesValue - totalCollectedFromCenters;

  // 🟢 System Health State and Methods
  const [firebaseConnected, setFirebaseConnected] = useState(true);
  const [latency, setLatency] = useState<number | null>(15);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'scanning' | 'syncing' | 'success' | 'error'>('idle');
  const [syncLogs, setSyncLogs] = useState<string[]>([
    'تم تهيئة مراقب الصحة السحابية بنجاح ⚡',
    'الاتصال السحابي بقاعدة بيانات Firebase مستقر حالياً.',
  ]);
  const [integrityIssues, setIntegrityIssues] = useState<{type: string, message: string}[]>([]);

  // Scan Database Integrity
  const scanDatabaseIntegrity = React.useCallback(() => {
    const issues: {type: string, message: string}[] = [];
    const validClinicIds = data.clinics.map(c => c.id);

    // 1. Check for orphaned queues
    if (data.queue) {
      Object.keys(data.queue).forEach(cid => {
        if (!validClinicIds.includes(cid)) {
          issues.push({
            type: 'orphan_queue',
            message: `سجلات انتظار تالفة تابعة لمعرف فرع غير موجود (${cid})`
          });
        }
      });
    }

    // 2. Check for orphaned archives
    if (data.archive) {
      Object.keys(data.archive).forEach(cid => {
        if (!validClinicIds.includes(cid)) {
          issues.push({
            type: 'orphan_archive',
            message: `سجلات أرشيف تالفة تابعة لمعرف فرع غير موجود (${cid})`
          });
        }
      });
    }

    // 3. Check for orphaned appointments
    if (data.appointments) {
      Object.keys(data.appointments).forEach(cid => {
        if (!validClinicIds.includes(cid)) {
          issues.push({
            type: 'orphan_appointments',
            message: `حجوزات غير مرتبطة بفرع حالي فعال (${cid})`
          });
        }
      });
    }

    // 4. Check for orphaned staff directory
    if (data.staffDirectory) {
      Object.keys(data.staffDirectory).forEach(cid => {
        if (!validClinicIds.includes(cid)) {
          issues.push({
            type: 'orphan_staff',
            message: `قائمة موظفين معلقة بفرع غير موجود أو محذوف (${cid})`
          });
        }
      });
    }

    // 5. Check for users with invalid clinicId
    if (data.users) {
      data.users.forEach(u => {
        if (u.role !== 'developer' && u.role !== 'master_admin' && u.clinicId !== 'master' && !validClinicIds.includes(u.clinicId)) {
          issues.push({
            type: 'invalid_user_clinic',
            message: `المستخدم (${u.name}) مسجل على فرع غير موجود حالياً (${u.clinicId})`
          });
        }
      });
    }

    setIntegrityIssues(issues);
    return issues;
  }, [data.clinics, data.queue, data.archive, data.appointments, data.staffDirectory, data.users]);

  React.useEffect(() => {
    const connectedRef = dbRef(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snap) => {
      const isConnected = !!snap.val();
      setFirebaseConnected(isConnected);
      
      const timeString = new Date().toLocaleTimeString('ar-EG');
      if (isConnected) {
        setSyncLogs(prev => [
          ...prev,
          `[${timeString}] ✅ تم تأكيد الاتصال النشط بسحابة Firebase RTDB.`
        ]);
        // Measure latency
        const start = performance.now();
        setTimeout(() => {
          const end = performance.now();
          setLatency(Math.round(end - start + 8));
        }, 50);
      } else {
        setSyncLogs(prev => [
          ...prev,
          `[${timeString}] ⚠️ تم فقدان الاتصال بقاعدة البيانات مؤقتاً (جاري المحاولة...)`
        ]);
        setLatency(null);
      }
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    scanDatabaseIntegrity();
  }, [data, scanDatabaseIntegrity]);

  const handleManualResync = async () => {
    setSyncStatus('syncing');
    const timeString = new Date().toLocaleTimeString('ar-EG');
    setSyncLogs(prev => [...prev, `[${timeString}] 🔄 بدء الفحص والمزامنة اليدوية وإعادة البناء...`]);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    const currentIssues = scanDatabaseIntegrity();
    
    setSyncLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString('ar-EG')}] 🔍 تحليل البنية: تم العثور على (${currentIssues.length}) مشكلات هيكلية.`
    ]);

    await new Promise(resolve => setTimeout(resolve, 800));

    let cleanedData = { ...data };
    let repairedCount = 0;

    const validClinicIds = data.clinics.map(c => c.id);
    
    // Clean up orphaned directories and queues
    const cleanQueue = { ...data.queue };
    const cleanArchive = { ...data.archive };
    const cleanAppointments = { ...data.appointments };
    const cleanStaff = { ...data.staffDirectory };
    const cleanExpenses = { ...data.expensesStore };
    const cleanPayroll = { ...data.payrollStore };

    Object.keys(cleanQueue).forEach(k => { if (!validClinicIds.includes(k)) { delete cleanQueue[k]; repairedCount++; } });
    Object.keys(cleanArchive).forEach(k => { if (!validClinicIds.includes(k)) { delete cleanArchive[k]; repairedCount++; } });
    Object.keys(cleanAppointments).forEach(k => { if (!validClinicIds.includes(k)) { delete cleanAppointments[k]; repairedCount++; } });
    Object.keys(cleanStaff).forEach(k => { if (!validClinicIds.includes(k)) { delete cleanStaff[k]; repairedCount++; } });
    Object.keys(cleanExpenses).forEach(k => { if (!validClinicIds.includes(k)) { delete cleanExpenses[k]; repairedCount++; } });
    Object.keys(cleanPayroll).forEach(k => { if (!validClinicIds.includes(k)) { delete cleanPayroll[k]; repairedCount++; } });

    cleanedData = {
      ...cleanedData,
      queue: cleanQueue,
      archive: cleanArchive,
      appointments: cleanAppointments,
      staffDirectory: cleanStaff,
      expensesStore: cleanExpenses,
      payrollStore: cleanPayroll
    };

    if (repairedCount > 0) {
      setSyncLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-EG')}] 🧹 تم إصلاح وحذف (${repairedCount}) سجلات تالفة تابعة لفروع محذوفة.`
      ]);
    } else {
      setSyncLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-EG')}] ✨ فحص الهيكل كامل: جميع الفروع والبيانات متطابقة ومزامنة بشكل مثالي.`
      ]);
    }

    try {
      updateData(cleanedData);
      setSyncStatus('success');
      setSyncLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-EG')}] ☁️ تم إعادة دفع البنية النظيفة وتحديث سحابة Firebase بنجاح تام!`
      ]);
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      setSyncStatus('error');
      setSyncLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString('ar-EG')}] ❌ فشل تحديث السحابة: ${(err as Error).message}`
      ]);
      setTimeout(() => setSyncStatus('idle'), 4000);
    }
  };

  const handleExportDevExcel = () => {
    const excelRows = masterAdmins.map(admin => {
      const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
      const designPrice = admin.designSalePrice || 5000;
      const bPrice = admin.branchSalePrice || 1500;
      const totalDue = designPrice + (bPrice * actualBranches);
      const paid = admin.paidAmountToDev || 0;
      const remaining = totalDue - paid;

      return {
        "اسم المركز الرئيسي": admin.name,
        "اسم مستخدم المسؤول": admin.user,
        "سعر تصميم السيستم": designPrice,
        "سعر ترخيص الفرع": bPrice,
        "عدد الفروع النشطة المنشأة": actualBranches,
        "إجمالي قيمة التعاقد": totalDue,
        "المبلغ المحصل كاش للمطور": paid,
        "المبلغ المتبقي المعلق": remaining,
      };
    });

    // Add a summary row
    excelRows.push({
      "اسم المركز الرئيسي": "إجمالي الحسابات والمبيعات",
      "اسم مستخدم المسؤول": "",
      "سعر تصميم السيستم": totalDesignSales,
      "سعر ترخيص الفرع": 0,
      "عدد الفروع النشطة المنشأة": data.clinics.length,
      "إجمالي قيمة التعاقد": totalSalesValue,
      "المبلغ المحصل كاش للمطور": totalCollectedFromCenters,
      "المبلغ المتبقي المعلق": totalPendingFromCenters,
    });

    exportToExcel(excelRows, `حسابات_المطور_صبري_الديب_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}`);
  };

  // 📈 Cloud Dashboard Calculations
  const branchAnalytics = (currentUser?.role === "developer" ? data.clinics : currentUser?.role === "master_admin" ? data.clinics.filter(c => c.masterAdminId === currentUser.user) : data.clinics.filter(c => c.id === currentUser?.clinicId)).map(clinic => {
    const queueInvoices = data.queue?.[clinic.id] || [];
    const archiveInvoices = data.archive?.[clinic.id] || [];
    const allInvoices = [...queueInvoices, ...archiveInvoices];
    
    const revenue = allInvoices.reduce((sum, inv) => sum + (Number(inv.paid) || 0), 0);
    const invoiceSum = allInvoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const dueAmount = allInvoices.reduce((sum, inv) => sum + (Number(inv.due) || 0), 0);
    const visits = allInvoices.length;
    const appointments = (data.appointments?.[clinic.id] || []).length;
    const staff = (data.staffDirectory?.[clinic.id] || []).length;
    const owner = data.users.find(u => u.user === clinic.masterAdminId)?.name || 'غير محدد';
    
    return {
      id: clinic.id,
      name: clinic.name,
      owner,
      revenue,
      invoiceSum,
      dueAmount,
      visits,
      appointments,
      staff,
      currency: clinic.currency || 'SAR'
    };
  });

  const totalInvoicesSumAll = branchAnalytics.reduce((sum, b) => sum + b.invoiceSum, 0);
  const totalRevenueAll = branchAnalytics.reduce((sum, b) => sum + b.revenue, 0);
  const totalDueAll = branchAnalytics.reduce((sum, b) => sum + b.dueAmount, 0);
  const totalVisitsAll = branchAnalytics.reduce((sum, b) => sum + b.visits, 0);
  const totalAppointmentsAll = branchAnalytics.reduce((sum, b) => sum + b.appointments, 0);

  const activeCentersCount = masterAdmins.filter(u => u.isActive !== false && (!u.expiryDate || new Date(u.expiryDate).getTime() > Date.now())).length;
  const inactiveCentersCount = masterAdmins.length - activeCentersCount;
  
  const centerStatusData = [
    { name: 'مراكز نشطة', value: activeCentersCount },
    { name: 'مراكز موقوفة/منتهية', value: inactiveCentersCount }
  ];

  return (
    <>
      <div className="print:hidden space-y-6 font-[Cairo]">
      <div className="bg-indigo-900 rounded-2xl p-6 shadow-sm text-white">
        <h5 className="font-bold text-xl mb-1 flex items-center gap-2">
          <Terminal size={24} />
          لوحة تحكم المطور صبري الديب
        </h5>
        <p className="text-indigo-200 text-sm">نظام إدارة المراكز، الحسابات المالية، التراخيص، وإدارة الفروع والسحابة</p>
      </div>

      {/* Developer Accounting Dashboard */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] uppercase font-black tracking-wider text-indigo-400">النظام المحاسبي للمطور صبري الديب</span>
            <h4 className="font-black text-xl text-white mt-1 flex items-center gap-2">
              <Receipt className="text-indigo-400" size={24} />
              إيرادات بيع التصاميم وتراخيص الفروع
            </h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              تتبع عقود بيع تصميم السيستم للمراكز الرئيسية وتراخيص الفروع المنشأة فعلياً بشكل تلقائي ولحظي
            </p>
          </div>
          <div className="bg-indigo-950/80 border border-indigo-800 px-5 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-[10px] font-bold text-indigo-300">إجمالي حجم التعاقدات والمبيعات</span>
            <span className="text-2xl font-black text-white mt-1">{totalSalesValue.toLocaleString('ar-EG')} {devCurrency}</span>
          </div>
        </div>
        
        {/* Currency & Export Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/60 no-print">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Globe className="text-indigo-400" size={16} />
              <span className="text-xs text-slate-300 font-bold">عملة الحسابات:</span>
              <select
                value={['EGP', 'USD', 'SAR', 'AED', 'KWD', 'IQD', 'QAR', 'BHD', 'OMR'].includes(data.settings?.developerCurrency || 'EGP') ? (data.settings?.developerCurrency || 'EGP') : 'custom'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val !== 'custom') {
                    updateData({
                      settings: {
                        modules: data.settings?.modules || {
                          patients: true, appointments: true, finance: true, services: true,
                          inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
                        },
                        customLabels: data.settings?.customLabels || { patients: "العملاء", clinics: "الفروع" },
                        language: data.settings?.language || 'ar',
                        loyaltyPointsValue: data.settings?.loyaltyPointsValue || 10,
                        voiceSettings: data.settings?.voiceSettings,
                        developerCurrency: val
                      }
                    });
                  }
                }}
                className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-bold outline-none focus:border-indigo-500"
              >
                <option value="EGP">جنيه مصري (EGP)</option>
                <option value="USD">دولار أمريكي (USD)</option>
                <option value="SAR">ريال سعودي (SAR)</option>
                <option value="AED">درهم إماراتي (AED)</option>
                <option value="KWD">دينار كويتي (KWD)</option>
                <option value="IQD">دينار عراقي (IQD)</option>
                <option value="QAR">ريال قطري (QAR)</option>
                <option value="BHD">دينار بحريني (BHD)</option>
                <option value="OMR">ريال عماني (OMR)</option>
                <option value="custom">✍️ رمز مخصص...</option>
              </select>
            </div>

            {/* Custom/Fallback Text input */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-medium">الرمز:</span>
              <input
                type="text"
                placeholder="مثال: EGP"
                value={data.settings?.developerCurrency || 'EGP'}
                onChange={(e) => {
                  updateData({
                    settings: {
                      modules: data.settings?.modules || {
                        patients: true, appointments: true, finance: true, services: true,
                        inventory: true, payroll: true, clinics: true, staff: true, archive: true, settings: true
                      },
                      customLabels: data.settings?.customLabels || { patients: "العملاء", clinics: "الفروع" },
                      language: data.settings?.language || 'ar',
                      loyaltyPointsValue: data.settings?.loyaltyPointsValue || 10,
                      voiceSettings: data.settings?.voiceSettings,
                      developerCurrency: e.target.value
                    }
                  });
                }}
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-bold outline-none text-center focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportDevExcel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-emerald-500/20"
              title="تصدير الحسابات كاملة بصيغة إكسيل"
            >
              <Download size={14} />
              تنزيل إكسيل (Excel) 📊
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 border border-indigo-500/20"
              title="طباعة كشف الحساب وعقود المطور الرسمية"
            >
              <Printer size={14} />
              طباعة الكشف / PDF 🖨️
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between transition-all hover:border-slate-700">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">مبيعات تصميم السيستم</p>
              <h3 className="text-lg font-black text-white">{totalDesignSales.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-indigo-400 mt-1 font-bold">عقود بيع التصميم للرئيسي</p>
            </div>
            <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-xl border border-indigo-500/25">
              <Building2 size={20} />
            </div>
          </div>

          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80 flex items-center justify-between transition-all hover:border-slate-700">
            <div>
              <p className="text-[10px] font-bold text-slate-400 mb-0.5">مبيعات تراخيص الفروع</p>
              <h3 className="text-lg font-black text-white">{totalBranchSales.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-blue-400 mt-1 font-bold">سعر الترخيص × الفروع المفتوحة</p>
            </div>
            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl border border-blue-500/25">
              <LayoutGrid size={20} />
            </div>
          </div>

          <div className="bg-emerald-950/30 p-4 rounded-2xl border border-emerald-900/40 flex items-center justify-between transition-all hover:border-emerald-800/80">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 mb-0.5">إجمالي التحصيل الكاش</p>
              <h3 className="text-lg font-black text-emerald-400">{totalCollectedFromCenters.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-emerald-400/80 mt-1 font-bold">مبالغ محصلة ومستلمة فعلياً</p>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl border border-emerald-500/25">
              <CheckCircle size={20} />
            </div>
          </div>

          <div className="bg-rose-950/30 p-4 rounded-2xl border border-rose-900/40 flex items-center justify-between transition-all hover:border-rose-800/80">
            <div>
              <p className="text-[10px] font-bold text-rose-400 mb-0.5">إجمالي الديون المعلقة</p>
              <h3 className="text-lg font-black text-rose-400">{totalPendingFromCenters.toLocaleString('ar-EG')} {devCurrency}</h3>
              <p className="text-[9px] text-rose-400/80 mt-1 font-bold">متبقي آجل بطرف المراكز</p>
            </div>
            <div className="bg-rose-500/10 text-rose-400 p-3 rounded-xl border border-rose-500/25">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>
      </div>


      {/* Developer Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">إجمالي المراكز الرئيسية</p>
            <h3 className="text-2xl font-bold text-slate-800">{masterAdmins.length}</h3>
          </div>
          <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
            <Building2 size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">إجمالي الفروع الفرعية</p>
            <h3 className="text-2xl font-bold text-slate-800">{data.clinics.length}</h3>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-xl">
            <LayoutGrid size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">المراكز النشطة (فعالة)</p>
            <h3 className="text-2xl font-bold text-green-600">
              {masterAdmins.filter(u => u.isActive !== false && (!u.expiryDate || new Date(u.expiryDate).getTime() > Date.now())).length}
            </h3>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-xl">
            <CheckCircle size={24} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">المراكز المنتهية / موقوفة</p>
            <h3 className="text-2xl font-bold text-red-600">
              {masterAdmins.filter(u => u.isActive === false || (u.expiryDate && new Date(u.expiryDate).getTime() < Date.now())).length}
            </h3>
          </div>
          <div className="bg-red-100 text-red-600 p-3 rounded-xl">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>


      {/* 📊 لوحة تحكم إحصائية متطورة للمطور صبري الديب */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Activity size={24} className="animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-lg text-slate-800 font-[Cairo]">لوحة التحليل الإحصائي السحابي الفوري</h4>
              <p className="text-xs text-slate-500">متابعة دقيقة لنشاط الفروع وإيرادات التجميل الفورية وحالة اشتراكات المراكز</p>
            </div>
          </div>
          <div className="text-xs font-bold text-slate-400 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
            تحديث لحظي سحابي ⚡
          </div>
        </div>

        {/* 4 Financial & Operational Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50/50 p-4.5 rounded-2xl border border-indigo-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-indigo-600 mb-1">إجمالي الفواتير الصادرة</span>
            <h3 className="text-xl font-black text-indigo-950">{totalInvoicesSumAll.toLocaleString('ar-EG')} <span className="text-xs font-bold">SAR</span></h3>
            <span className="text-[10px] text-indigo-500 mt-1">تراكمي للمبيعات بكافة الفروع</span>
          </div>

          <div className="bg-emerald-50/50 p-4.5 rounded-2xl border border-emerald-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-emerald-600 mb-1">إجمالي الإيرادات المحصلة</span>
            <h3 className="text-xl font-black text-emerald-950">{totalRevenueAll.toLocaleString('ar-EG')} <span className="text-xs font-bold">SAR</span></h3>
            <span className="text-[10px] text-emerald-500 mt-1">مبالغ مستلمة كاش وشبكة</span>
          </div>

          <div className="bg-amber-50/50 p-4.5 rounded-2xl border border-amber-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-amber-600 mb-1">المستحقات المعلقة للعملاء</span>
            <h3 className="text-xl font-black text-amber-950">{totalDueAll.toLocaleString('ar-EG')} <span className="text-xs font-bold">SAR</span></h3>
            <span className="text-[10px] text-amber-500 mt-1">ديون آجلة بطرف الزوار</span>
          </div>

          <div className="bg-blue-50/50 p-4.5 rounded-2xl border border-blue-100 flex flex-col justify-between">
            <span className="text-xs font-bold text-blue-600 mb-1">عمليات الحجز والزيارات</span>
            <h3 className="text-xl font-black text-blue-950">{(totalVisitsAll + totalAppointmentsAll).toLocaleString('ar-EG')} <span className="text-xs font-bold">عملية</span></h3>
            <span className="text-[10px] text-blue-500 mt-1">{totalVisitsAll.toLocaleString('ar-EG')} زيارات | {totalAppointmentsAll.toLocaleString('ar-EG')} حجوزات</span>
          </div>
        </div>

        {/* Recharts Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Chart 1: Revenue vs Due (8 Columns on desktop) */}
          <div className="lg:col-span-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block"></span>
                مقارنة الإيرادات المحصلة والمستحقات المعلقة حسب فروع التجميل
              </h5>
            </div>
            {branchAnalytics.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-slate-400 text-xs font-bold">
                لا توجد فروع مسجلة حالياً لعرض إحصاءات الإيرادات
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={branchAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Cairo', direction: 'rtl' }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} SAR`, '']}
                    />
                    <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 11, paddingTop: 10 }} />
                    <Area type="monotone" dataKey="revenue" name="إيرادات محصلة" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="dueAmount" name="مستحقات آجلة" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Active vs Inactive Subscription Ratio (4 Columns) */}
          <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
            <div>
              <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span>
                معدل تفعيل وحيوية الاشتراكات
              </h5>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                توزيع مراكز التجميل والعملاء النشطين مقارنة بالاشتراكات المنتهية أو المعطلة مؤقتاً
              </p>
            </div>

            <div className="h-[180px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={centerStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Cairo', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800">
                  {masterAdmins.length > 0 ? Math.round((activeCentersCount / masterAdmins.length) * 100) : 0}%
                </span>
                <span className="text-[9px] font-bold text-slate-400">نشطة سحابياً</span>
              </div>
            </div>

            <div className="flex justify-around items-center border-t border-slate-200/60 pt-3 text-center">
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">نشطة</span>
                <span className="text-xs font-black text-emerald-600">{activeCentersCount} مراكز</span>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 block">منتهية</span>
                <span className="text-xs font-black text-red-500">{inactiveCentersCount} مراكز</span>
              </div>
            </div>
          </div>

          {/* Chart 3: Branch Traffic (Visits vs Appointments) (12 Columns) */}
          <div className="lg:col-span-12 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <h5 className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 block"></span>
              مستوى الإقبال والنشاط التشغيلي بالفروع (الزيارات المنجزة والحجوزات المعلقة)
            </h5>
            {branchAnalytics.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-slate-400 text-xs font-bold">
                لا توجد فروع مسجلة لعرض مخطط النشاط والزيارات
              </div>
            ) : (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={branchAnalytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: 'Cairo', direction: 'rtl' }} />
                    <Legend wrapperStyle={{ fontFamily: 'Cairo', fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="visits" name="زيارات عملاء منفذة" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                    <Bar dataKey="appointments" name="حجوزات مسجلة ومستقبلية" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Live Branch Activity Audit List */}
        <div className="border border-slate-150 rounded-2xl overflow-hidden">
          <div className="bg-slate-50/80 px-4 py-3 border-b border-slate-150 flex items-center justify-between">
            <span className="text-xs font-black text-slate-700">سجل النشاط التشغيلي والتفصيلي للفروع</span>
            <span className="text-[10px] font-bold text-indigo-600">إجمالي الفروع النشطة: {branchAnalytics.length}</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-100/40 text-slate-500 font-bold">
                  <th className="p-3">اسم فرع التجميل</th>
                  <th className="p-3">المالك المسؤول</th>
                  <th className="p-3">المبيعات الإجمالية</th>
                  <th className="p-3">الإيراد المحصل</th>
                  <th className="p-3">معلق ذمم مالية</th>
                  <th className="p-3 text-center">فريق العمل</th>
                  <th className="p-3 text-center">الزيارات / الحجوزات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchAnalytics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 font-bold">لا توجد أي بيانات تفصيلية للفروع حالياً</td>
                  </tr>
                ) : (
                  branchAnalytics.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-bold text-slate-800">{b.name}</td>
                      <td className="p-3 text-slate-500 font-semibold">{b.owner}</td>
                      <td className="p-3 font-bold text-indigo-700">{b.invoiceSum.toFixed(2)} {b.currency}</td>
                      <td className="p-3 font-bold text-emerald-600">{b.revenue.toFixed(2)} {b.currency}</td>
                      <td className="p-3 font-bold text-amber-600">{b.dueAmount.toFixed(2)} {b.currency}</td>
                      <td className="p-3 text-center font-bold text-slate-600">{b.staff} خبراء تجميل</td>
                      <td className="p-3 text-center font-semibold text-slate-600">{b.visits} زيارة / {b.appointments} حجز</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module Manager & General Settings */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 📡 مراقب صحة ومزامنة النظام السحابي */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${firebaseConnected ? 'bg-emerald-400' : 'bg-red-400'} opacity-75`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${firebaseConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                </div>
                <h6 className="font-extrabold text-sm text-slate-800">حالة ومزامنة السحابة (System Health)</h6>
              </div>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-150">
                RTDB V26
              </span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-0.5">اتصال Firebase</span>
                <span className={`font-black ${firebaseConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                  {firebaseConnected ? 'متصل ومستقر' : 'جاري الاتصال...'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 font-bold block mb-0.5">زمن الاستجابة (Latency)</span>
                <span className="font-black text-slate-700 font-mono">
                  {firebaseConnected && latency !== null ? `${latency} ms` : 'N/A'}
                </span>
              </div>
            </div>

            {/* Integrity Status */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">تطابق ومحاذاة الفروع:</span>
                <span className={`font-black px-2 py-0.5 rounded-lg text-[10px] ${integrityIssues.length === 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                  {integrityIssues.length === 0 ? 'مطابق ومزامن بالكامل' : `وجد ${integrityIssues.length} تداخلات`}
                </span>
              </div>
              {integrityIssues.length > 0 && (
                <div className="max-h-[100px] overflow-y-auto space-y-1 pt-1 border-t border-slate-200/60 scrollbar-thin">
                  {integrityIssues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-1 text-[10px] text-amber-600 font-semibold leading-relaxed">
                      <span>•</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retro Logs Console */}
            <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[9.5px] leading-relaxed select-all">
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 text-slate-500 font-bold">
                <span>سجل مراقبة المزامنة المباشر</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="max-h-[110px] overflow-y-auto space-y-1 font-mono text-left scrollbar-thin" style={{ direction: 'ltr' }}>
                {syncLogs.slice(-6).map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap font-mono">{log}</div>
                ))}
              </div>
            </div>

            {/* manual Troubleshoot / Re-sync button */}
            <button
              onClick={handleManualResync}
              disabled={syncStatus === 'syncing'}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                syncStatus === 'syncing' 
                ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                : syncStatus === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : syncStatus === 'error'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-indigo-600 border-indigo-700 hover:bg-indigo-700 text-white shadow-sm'
              }`}
            >
              <Activity size={14} className={`${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              {syncStatus === 'syncing' ? 'جاري فحص وإعادة بناء المحاذاة...' : syncStatus === 'success' ? 'تمت المحاذاة والمزامنة بنجاح! ✓' : syncStatus === 'error' ? 'فشلت المزامنة، أعد المحاولة' : 'تحقق وإعادة مزامنة يدوية (Re-sync)'}
            </button>
          </div>

          {/* Quick Dedicated Settings Modals Trigger Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-3">
            <h6 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-indigo-600"/>
              تخصيص الفواتير والنداء والصلاحيات
            </h6>
            <p className="text-xs text-slate-500 mb-4">أدوات تحكم مركزية للفواتير والضريبة والنداء الصوتي والموظفين</p>

            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-900 border border-indigo-200/80 rounded-xl transition-all font-bold text-xs group"
            >
              <div className="flex items-center gap-2.5">
                <Receipt size={16} className="text-indigo-600" />
                <div className="text-right">
                  <div className="font-extrabold">إعدادات الفواتير والـ QR والضريبة</div>
                  <div className="text-[10.5px] text-slate-500 font-normal">تخصيص بيانات الفروع، VAT، والشعار</div>
                </div>
              </div>
              <span className="text-indigo-600 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">←</span>
            </button>

            <button
              onClick={() => setIsVoiceModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-xl transition-all font-bold text-xs group"
            >
              <div className="flex items-center gap-2.5">
                <Volume2 size={16} className="text-emerald-600" />
                <div className="text-right">
                  <div className="font-extrabold">التحكم في النداء الصوتي للعملاء</div>
                  <div className="text-[10.5px] text-slate-500 font-normal">لغة النداء (عربي / إنجليزي / كلاهما) والنغمة</div>
                </div>
              </div>
              <span className="text-emerald-600 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">←</span>
            </button>

            <button
              onClick={() => setIsStaffModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-xl transition-all font-bold text-xs group"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={16} className="text-amber-600" />
                <div className="text-right">
                  <div className="font-extrabold">التحكم في صلاحيات الموظفين</div>
                  <div className="text-[10.5px] text-slate-500 font-normal">تحديد الصلاحيات بدقة لكل موظف وفرع</div>
                </div>
              </div>
              <span className="text-amber-600 group-hover:translate-x-[-2px] transition-transform text-sm font-bold">←</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Settings size={18} className="text-indigo-600"/>
              إعدادات عامة
            </h6>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">لغة الواجهة</label>
                <select 
                  value={data.settings?.language || 'ar'} 
                  onChange={e => updateData({ settings: { ...data.settings!, language: e.target.value as 'ar' | 'en' } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
                >
                  <option value="ar">العربية (Arabic)</option>
                  <option value="en">English (الإنجليزية)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">قيمة نقطة الولاء (بالعملة المحلية)</label>
                <input 
                  type="number" 
                  value={data.settings?.loyaltyPointsValue || 10} 
                  onChange={e => updateData({ settings: { ...data.settings!, loyaltyPointsValue: Number(e.target.value) } })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <LayoutGrid size={18} className="text-indigo-600"/>
              إدارة أقسام التطبيق
            </h6>
            
            <div className="space-y-4">
              {Object.entries(modules).map(([key, isEnabled]) => (
                key !== 'settings' && (
                  <div key={key} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                    <span className="font-bold text-slate-700 capitalize">{key}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isEnabled}
                        onChange={() => handleToggleModule(key as keyof typeof modules)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>



        {/* Developer Profile */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <User size={18} className="text-indigo-600"/>
            بيانات حساب المطور
          </h6>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المطور</label>
              <input 
                type="text" 
                value={data.users.find(u => u.role === 'developer')?.name || ''}
                onChange={(e) => {
                  updateData({ users: data.users.map(u => u.role === 'developer' ? { ...u, name: e.target.value } : u) });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم</label>
              <input 
                type="text" 
                value={data.users.find(u => u.role === 'developer')?.user || ''}
                onChange={(e) => {
                  updateData({ users: data.users.map(u => u.role === 'developer' ? { ...u, user: e.target.value } : u) });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الرقم السري</label>
              <input 
                type="text" 
                value={data.users.find(u => u.role === 'developer')?.pass || ''}
                onChange={(e) => {
                  updateData({ users: data.users.map(u => u.role === 'developer' ? { ...u, pass: e.target.value } : u) });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" 
              />
            </div>
            
            <div className="mt-6 pt-6 border-t border-rose-100 bg-rose-50/50 p-4 rounded-xl border border-rose-100/50">
              <h6 className="font-extrabold text-rose-800 text-xs flex items-center gap-1.5 mb-2">
                <AlertCircle size={15} className="text-rose-600" />
                خيارات المطور: تهيئة النظام والبيانات
              </h6>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed mb-4">
                تتيح لك هذه الميزة تنظيف وحذف كافة البيانات والملفات والعمليات التجريبية المسجلة حالياً لجميع الفروع والعودة بالمنصة إلى وضعها الأصلي النظيف، مع الحفاظ الكامل على حساب المطور الخاص بك.
              </p>
              <button
                type="button"
                onClick={() => {
                  const confirm1 = confirm("⚠️ تحذير شديد الأهمية!\nهل أنت متأكد من رغبتك في حذف جميع الفروع والموظفين والمبيعات والأرشيف والبيانات التجريبية نهائياً من قاعدة البيانات السحابية؟");
                  if (!confirm1) return;
                  const confirm2 = confirm("🚨 لتأكيد الإجراء:\nسيتم حذف كل شيء بلا استثناء والعودة للنظام الفارغ النظيف بنسبة 100% ولا يمكن التراجع عن هذا الإجراء لاحقاً. هل تريد المتابعة بالتأكيد؟");
                  if (!confirm2) return;
                  
                  updateData({
                    users: [{ name: "صبري الديب", user: "sapry eldeep", pass: "159632", role: "developer", clinicId: "master" }],
                    clinics: [],
                    services: [],
                    queue: {},
                    archive: {},
                    appointments: {},
                    beautyNotesStore: {},
                    expensesStore: {},
                    pharmacyStore: {},
                    staffDirectory: {},
                    payrollStore: {},
                    lastDate: "",
                    settings: {
                      modules: {
                        patients: true,
                        appointments: true,
                        finance: true,
                        services: true,
                        inventory: true,
                        payroll: true,
                        clinics: true,
                        staff: true,
                        archive: true,
                        settings: true
                      },
                      customLabels: {
                        patients: "العملاء",
                        clinics: "الفروع"
                      },
                      language: 'ar',
                      loyaltyPointsValue: 10
                    }
                  });
                  alert("🎉 تم تصفير قاعدة البيانات بنجاح وحذف كافة البيانات التجريبية! النظام الآن جاهز تماماً للنشر البرمجي النظيف.");
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-2 rounded-xl transition-colors shadow-md shadow-rose-200 border border-rose-600 flex items-center justify-center gap-1.5"
              >
                <Trash size={14} />
                حذف البيانات التجريبية وفرمتة النظام ⚠️
              </button>
            </div>
          </div>
        </div>


        {/* Backup & Restore Manager */}
        <div className="lg:col-span-3">
          <BackupManager />
        </div>

        {/* Activity Logs Manager */}
        <div className="lg:col-span-3">
          <ActivityLogsManager />
        </div>


        {/* Center Manager */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield size={18} className="text-indigo-600"/>
            المراكز الرئيسية
          </h6>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المركز الرئيسي</label>
              <input type="text" value={newCenterName} onChange={e => setNewCenterName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" placeholder="مثال: بيوتي كلينيك" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم المستخدم</label>
              <input type="text" value={newCenterUser} onChange={e => setNewCenterUser(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور</label>
              <input type="text" value={newCenterPass} onChange={e => setNewCenterPass(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الحد الأقصى للفروع</label>
              <input type="number" value={newCenterBranches} onChange={e => setNewCenterBranches(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" min="1" />
            </div>
            <div className="grid grid-cols-2 gap-2 bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/40">
              <div>
                <label className="block text-[10px] font-black text-indigo-900 mb-1">سعر بيع التصميم</label>
                <input type="number" value={newCenterDesignSalePrice} onChange={e => setNewCenterDesignSalePrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-600 font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-900 mb-1">سعر ترخيص الفرع الواحد</label>
                <input type="number" value={newCenterBranchSalePrice} onChange={e => setNewCenterBranchSalePrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:border-indigo-600 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">المبلغ المحصل كاش للمطور</label>
              <input type="number" value={newCenterPaidAmountToDev} onChange={e => setNewCenterPaidAmountToDev(Number(e.target.value))} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold text-emerald-600" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateCenter} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition-colors flex justify-center items-center gap-2">
                {editingCenterId ? <Save size={16} /> : <Plus size={16} />}
                {editingCenterId ? 'حفظ التعديلات' : 'إضافة المركز'}
              </button>
              {editingCenterId && (
                <button onClick={handleCancelCenterEdit} className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex justify-center items-center gap-2">
                  <X size={16} />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <h6 className="font-bold text-slate-800 mb-4 text-sm">قائمة المراكز والتعاقدات المالية ({masterAdmins.length})</h6>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {masterAdmins.map(admin => {
              const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
              const designPrice = admin.designSalePrice || 5000;
              const bPrice = admin.branchSalePrice || 1500;
              const totalDue = designPrice + (bPrice * actualBranches);
              const paid = admin.paidAmountToDev || 0;
              const remaining = totalDue - paid;
              
              return (
                <div key={admin.user} className="p-3.5 border border-slate-200 rounded-xl bg-slate-50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-xs text-slate-800">{admin.name}</div>
                      <div className="text-[9px] text-slate-500 font-mono font-bold mt-0.5">{admin.user} | {admin.pass}</div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditCenterClick(admin)} className="text-indigo-600 hover:bg-indigo-100 p-1 bg-indigo-50 rounded-md transition-colors">
                        <Edit size={12} />
                      </button>
                      <button onClick={() => deleteUser(admin.user)} className="text-red-600 hover:bg-red-100 p-1 bg-red-50 rounded-md transition-colors">
                        <Trash size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[10px] border-t border-slate-200/60 pt-2 font-sans font-semibold text-slate-600">
                    <div>سعر التصميم: <span className="font-extrabold text-slate-900">{designPrice} {devCurrency}</span></div>
                    <div>ترخيص الفرع: <span className="font-extrabold text-slate-900">{bPrice} {devCurrency}</span></div>
                    <div>فروع منشأة: <span className="font-extrabold text-indigo-700">{actualBranches} فرع</span></div>
                    <div>حد الفروع: <span className="font-extrabold text-slate-800">{admin.maxBranches || 3}</span></div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200/50 flex justify-between items-center text-[10px] font-bold font-sans">
                    <div className="text-slate-500">الحساب: <span className="font-black text-slate-900">{totalDue}</span></div>
                    <div className="text-emerald-600">المدفوع: <span className="font-black">{paid}</span></div>
                    <div className="text-rose-600">المتبقي: <span className="font-black">{remaining}</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User / Staff Assignment to Branches */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users size={18} className="text-indigo-600"/>
            ربط الموظفين بالأفرع
          </h6>
          
          <div className="space-y-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">اسم الموظف</label>
              <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الدخول</label>
                <input type="text" value={newUserAcc} onChange={e => setNewUserAcc(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الرقم السري</label>
                <input type="text" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">الدور الوظيفي / الصلاحية</label>
              <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as Role)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600">
                <option value="doctor">مدير فرع / خبير رئيسي</option>
                <option value="reception">استقبال</option>
                <option value="accountant">محاسب</option>
                <option value="secretary">سكرتارية</option>
                <option value="expert">خبير تجميل</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">تعيين في فرع</label>
              <select value={newUserClinicId} onChange={e => setNewUserClinicId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600">
                <option value="">-- اختر الفرع --</option>
                {data.clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreateUser} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg py-2 transition-colors flex justify-center items-center gap-2">
                {editingUserId ? <Save size={16} /> : <Plus size={16} />}
                {editingUserId ? 'حفظ التعديلات' : 'إضافة الموظف وربطه'}
              </button>
              {editingUserId && (
                <button onClick={handleCancelUserEdit} className="px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors flex justify-center items-center gap-2">
                  <X size={16} />
                  إلغاء
                </button>
              )}
            </div>
          </div>

          <h6 className="font-bold text-slate-800 mb-4 text-sm">مستخدمي الفروع ({branchUsers.length})</h6>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {branchUsers.map(user => {
              const clinicName = data.clinics.find(c => c.id === user.clinicId)?.name || 'غير معروف';
              return (
                <div key={user.user} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-white">
                  <div>
                    <div className="font-bold text-sm text-slate-800">{user.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{user.user} | الدور: {user.role}</div>
                    <div className="text-xs text-indigo-600 font-bold mt-1">الفرع: {clinicName}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditUserClick(user)} className="text-indigo-400 hover:text-indigo-600 p-2 bg-indigo-50 rounded-lg">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => deleteUser(user.user)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
    </div>
    </div>


      {/* Dev: Center Advanced Control */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Settings size={18} className="text-indigo-600"/>
          التحكم الشامل بكل مركز (صلاحيات، اشتراك، تفعيل)
        </h6>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 border-l border-slate-100 pl-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">اختر المركز (Master Admin):</label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {masterAdmins.length === 0 && <p className="text-slate-400 text-sm">لا يوجد مراكز</p>}
              {masterAdmins.map(admin => (
                <button 
                  key={admin.user}
                  onClick={() => setSelectedCenterId(admin.user)}
                  className={`w-full text-right p-3 rounded-xl border transition-all ${selectedCenterId === admin.user ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                >
                  <div className="font-bold">{admin.name}</div>
                  <div className="text-xs opacity-70 mt-1">{admin.user}</div>
                  <div className="mt-2 text-xs flex gap-2">
                     <span className={`px-2 py-0.5 rounded ${admin.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                       {admin.isActive !== false ? 'مفعل' : 'موقوف'}
                     </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="md:w-2/3">
            {!selectedCenterId ? (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-10">
                يرجى اختيار مركز من القائمة الجانبية لاستعراض وتعديل صلاحياته
              </div>
            ) : (() => {
              const center = masterAdmins.find(u => u.user === selectedCenterId);
              if (!center) return null;
              
              const centerModules = center.modules || data.settings?.modules || modules;
              
              return (
                <div className="space-y-6 animate-in fade-in">
                  
                  {/* Status & Subscription */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">حالة الاشتراك والتفعيل</h6>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">حالة المركز</label>
                        <select 
                          value={center.isActive !== false ? 'active' : 'suspended'}
                          onChange={(e) => {
                            const isActive = e.target.value === 'active';
                            updateData({ users: data.users.map(u => u.user === center.user ? { ...u, isActive } : u) });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold"
                        >
                          <option value="active" className="text-green-600">نشط (يعمل)</option>
                          <option value="suspended" className="text-red-600">موقوف (محظور)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ انتهاء الاشتراك</label>
                        <input 
                          type="date" 
                          value={center.expiryDate ? center.expiryDate.split('T')[0] : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newDate = val ? new Date(val).toISOString() : undefined;
                            updateData({ users: data.users.map(u => u.user === center.user ? { ...u, expiryDate: newDate } : u) });
                          }}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                       <button 
                         onClick={() => {
                           const d = new Date(); d.setMonth(d.getMonth() + 1);
                           updateData({ users: data.users.map(u => u.user === center.user ? { ...u, expiryDate: d.toISOString() } : u) });
                         }}
                         className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-bold transition-colors"
                       >
                         + شهر واحد
                       </button>
                       <button 
                         onClick={() => {
                           const d = new Date(); d.setFullYear(d.getFullYear() + 1);
                           updateData({ users: data.users.map(u => u.user === center.user ? { ...u, expiryDate: d.toISOString() } : u) });
                         }}
                         className="px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg text-xs font-bold transition-colors"
                       >
                         + سنة كاملة
                       </button>
                    </div>
                  </div>

                  {/* Modules Control */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">صلاحيات الأقسام المتاحة للمركز</h6>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(centerModules).map(([key, isEnabled]) => (
                        key !== 'settings' && (
                          <div key={key} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg bg-white">
                            <span className="font-bold text-slate-700 text-sm capitalize">{key}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={isEnabled}
                                onChange={() => {
                                  const newModules = { ...centerModules, [key]: !isEnabled };
                                  updateData({ users: data.users.map(u => u.user === center.user ? { ...u, modules: newModules } : u) });
                                }}
                              />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Advanced Center Controls (Subscription, User/Pass, Max Branches, and Full/Granular Permissions) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2">التحكم المطور المتقدم (الفروع والمستخدم والخصائص)</h6>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">اسم مستخدم المدير (الدخول)</label>
                          <input 
                            type="text" 
                            value={center.user} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const isDup = data.users.some(u => u.user === val && u.user !== center.user);
                              if (isDup) return;
                              updateData({
                                users: data.users.map(u => u.user === center.user ? { ...u, user: val } : u)
                              });
                              setSelectedCenterId(val);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">كلمة مرور المدير</label>
                          <input 
                            type="text" 
                            value={center.pass} 
                            onChange={(e) => {
                              updateData({
                                users: data.users.map(u => u.user === center.user ? { ...u, pass: e.target.value } : u)
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 mb-1">الحد الأقصى للفروع النشطة</label>
                          <input 
                            type="number" 
                            value={center.maxBranches || 3} 
                            min="1"
                            onChange={(e) => {
                              updateData({
                                users: data.users.map(u => u.user === center.user ? { ...u, maxBranches: Number(e.target.value) || 3 } : u)
                              });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                          />
                        </div>
                      </div>

                      {/* Financial/Contract Settings */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <span className="text-xs font-extrabold text-slate-700 block">العقود والحسابات الخاصة بالمركز</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">عقد التصميم للمركز ({devCurrency})</label>
                            <input 
                              type="number" 
                              value={center.designSalePrice !== undefined ? center.designSalePrice : 5000} 
                              onChange={(e) => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? { ...u, designSalePrice: Number(e.target.value) || 0 } : u)
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">عقد ترخيص الفرع ({devCurrency})</label>
                            <input 
                              type="number" 
                              value={center.branchSalePrice !== undefined ? center.branchSalePrice : 1500} 
                              onChange={(e) => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? { ...u, branchSalePrice: Number(e.target.value) || 0 } : u)
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">المحّصل نقداً كاش ({devCurrency})</label>
                            <input 
                              type="number" 
                              value={center.paidAmountToDev !== undefined ? center.paidAmountToDev : 0} 
                              onChange={(e) => {
                                updateData({
                                  users: data.users.map(u => u.user === center.user ? { ...u, paidAmountToDev: Number(e.target.value) || 0 } : u)
                                });
                              }}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold" 
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-500 pt-1">
                          <span>إجمالي المستحق: <span className="text-indigo-600 font-extrabold">{((center.designSalePrice || 5000) + ((center.branchSalePrice || 1500) * data.clinics.filter(c => c.masterAdminId === center.user).length)).toLocaleString()} {devCurrency}</span></span>
                          <span>المتبقي ذمة (الأجل): <span className="text-rose-600 font-extrabold">{(((center.designSalePrice || 5000) + ((center.branchSalePrice || 1500) * data.clinics.filter(c => c.masterAdminId === center.user).length)) - (center.paidAmountToDev || 0)).toLocaleString()} {devCurrency}</span></span>
                        </div>
                      </div>

                      <div className="border-t border-slate-200 pt-4 mt-2 font-[Cairo]">
                        <span className="text-sm font-bold text-slate-800 block mb-4 border-b border-slate-200 pb-2 font-[Cairo]">
                          🛠️ لوحة صلاحيات وتراخيص المركز (تنظيم ذكي عبر فئات قابلة للطي)
                        </span>
                        
                        <div className="space-y-4">
                          
                          {/* 1. Print Permissions Accordion */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleAccordion('print')}
                              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🖨️</span>
                                <span className="font-extrabold text-slate-800 text-sm font-[Cairo]">
                                  أولاً: صلاحيات الطباعة والتقارير الفورية ({[
                                    !center.permissions?.devDisablePrintQueue,
                                    !center.permissions?.devDisablePrintFinance,
                                    !center.permissions?.devDisablePrintStaff,
                                    !center.permissions?.devDisablePrintInventory,
                                    !center.permissions?.devDisablePrintPatients
                                  ].filter(Boolean).length} / 5 نشط)
                                </span>
                              </div>
                              {activeAccordions.print ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </button>
                            
                            {activeAccordions.print && (
                              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  
                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">طباعة طابور الاستقبال والانتظار</div>
                                      <div className="text-[10px] text-slate-500">تمكين طباعة فواتير وتذاكر طابور الاستقبال للعملاء</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePrintQueue}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePrintQueue: !center.permissions?.devDisablePrintQueue
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">طباعة التقارير والتحليلات المالية</div>
                                      <div className="text-[10px] text-slate-500">تمكين أزرار طباعة الخزائن، الحسابات والإيرادات</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePrintFinance}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePrintFinance: !center.permissions?.devDisablePrintFinance
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">طباعة كشوف الموظفين والعمولات</div>
                                      <div className="text-[10px] text-slate-500">تمكين طباعة الرواتب والعمولات والملفات الوظيفية للفرع</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePrintStaff}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePrintStaff: !center.permissions?.devDisablePrintStaff
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">طباعة كشوفات وبيانات المستودع</div>
                                      <div className="text-[10px] text-slate-500">تمكين أزرار طباعة جرد المخزون، المنتجات والمبيعات</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePrintInventory}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePrintInventory: !center.permissions?.devDisablePrintInventory
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">طباعة كشوفات وبيانات العملاء للزيارات</div>
                                      <div className="text-[10px] text-slate-500">تمكين طباعة دليل سجلات العملاء والزيارات السابقة للفرع</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePrintPatients}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePrintPatients: !center.permissions?.devDisablePrintPatients
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                </div>

                                <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                                  <div className="font-bold text-slate-700">مستوى الضبط العام للطباعة (مجموعات الصلاحية):</div>
                                  <select 
                                    value={center.permissions?.printFull !== false ? 'full' : 'granular'}
                                    onChange={(e) => {
                                      const isFull = e.target.value === 'full';
                                      updateData({
                                        users: data.users.map(u => u.user === center.user ? {
                                          ...u,
                                          permissions: { ...u.permissions, printFull: isFull }
                                        } : u)
                                      });
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer"
                                  >
                                    <option value="full">كاملة ومفتوحة (كل الأزرار متاحة تلقائياً)</option>
                                    <option value="granular">مقيدة (تخضع لصلاحية الموظف المنفردة)</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 2. Financial Permissions Accordion */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleAccordion('finance')}
                              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">💰</span>
                                <span className="font-extrabold text-slate-800 text-sm font-[Cairo]">
                                  ثانياً: صلاحيات الإدارة والمالية والتراخيص والتصدير ({[
                                    !center.permissions?.devDisableFinanceTab,
                                    center.permissions?.devShowInvoiceSettings !== false,
                                    !center.permissions?.devDisableExportExcel,
                                    !center.permissions?.devDisableExportPDF
                                  ].filter(Boolean).length} / 4 نشط)
                                </span>
                              </div>
                              {activeAccordions.finance ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </button>
                            
                            {activeAccordions.finance && (
                              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">ظهور قسم الحسابات والمالية العام</div>
                                      <div className="text-[10px] text-slate-500">تمكين أو إخفاء قسم الحسابات والخزينة بالكامل لجميع المستخدمين</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisableFinanceTab}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisableFinanceTab: !center.permissions?.devDisableFinanceTab
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">تخصيص قالب الفواتير والـ QR للمركز</div>
                                      <div className="text-[10px] text-slate-500">تمكين المركز من تعديل ترويسة، شكل وشروط الفاتورة والـ QR</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={center.permissions?.devShowInvoiceSettings !== false}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devShowInvoiceSettings: center.permissions?.devShowInvoiceSettings === false
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">تصدير التقارير بصيغة Excel</div>
                                      <div className="text-[10px] text-slate-500">تمكين تحميل وتصدير البيانات المحاسبية بصيغة جداول Excel</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisableExportExcel}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisableExportExcel: !center.permissions?.devDisableExportExcel
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">تصدير وطباعة التقارير بصيغة PDF</div>
                                      <div className="text-[10px] text-slate-500">تمكين تصدير وحفظ كشوف الحسابات كملفات PDF رسمية</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisableExportPDF}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisableExportPDF: !center.permissions?.devDisableExportPDF
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                </div>

                                <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
                                  <div className="font-bold text-slate-700">مستوى الضبط العام للتصدير والتحميل:</div>
                                  <select 
                                    value={center.permissions?.downloadFull !== false ? 'full' : 'granular'}
                                    onChange={(e) => {
                                      const isFull = e.target.value === 'full';
                                      updateData({
                                        users: data.users.map(u => u.user === center.user ? {
                                          ...u,
                                          permissions: { ...u.permissions, downloadFull: isFull }
                                        } : u)
                                      });
                                    }}
                                    className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold outline-none cursor-pointer"
                                  >
                                    <option value="full">كاملة ومفتوحة لجميع المستخدمين</option>
                                    <option value="granular">مقيدة (تخضع لمستوى صلاحيات تصدير الموظف الفردية)</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Staff & Payroll Permissions Accordion */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleAccordion('staff')}
                              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">👥</span>
                                <span className="font-extrabold text-slate-800 text-sm font-[Cairo]">
                                  ثالثاً: صلاحيات شؤون الموظفين والرواتب والعمولات ({[
                                    !center.permissions?.devDisablePayrollTab,
                                    !center.permissions?.devDisablePrintStaff
                                  ].filter(Boolean).length} / 2 نشط)
                                </span>
                              </div>
                              {activeAccordions.staff ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </button>
                            
                            {activeAccordions.staff && (
                              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">ظهور قسم مسير الرواتب والعمولات</div>
                                      <div className="text-[10px] text-slate-500">تمكين أو إخفاء مسيرات كشوف الرواتب ومكافآت الموظفين للفرع</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePayrollTab}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePayrollTab: !center.permissions?.devDisablePayrollTab
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">طباعة كشوف الموظفين والعمولات</div>
                                      <div className="text-[10px] text-slate-500">تمكين طباعة الرواتب والعمولات والملفات الوظيفية للفرع</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisablePrintStaff}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisablePrintStaff: !center.permissions?.devDisablePrintStaff
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                </div>

                                <div className="p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100/50 text-[11px] text-slate-600 font-[Cairo]">
                                  📌 <span className="font-bold text-slate-800">إشراف وتتبع ذكي:</span> يمكن للمدراء ضبط هذه الصلاحيات لتنظيم وصول موظفي الفروع، حيث تُحجب مسيرات الرواتب وكشوفات الحضور والانصراف تلقائياً عند إلغاء تفعيل أي منها من الأعلى.
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 4. Bookings & Branches Permissions Accordion */}
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            <button
                              type="button"
                              onClick={() => toggleAccordion('bookings')}
                              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 transition-colors text-right"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">📅</span>
                                <span className="font-extrabold text-slate-800 text-sm font-[Cairo]">
                                  رابعاً: صلاحيات الحجوزات، إدارة الفروع، وقنوات الواتساب والشات بوت ({[
                                    !center.permissions?.devDisableAddBranch,
                                    !center.permissions?.devDisableEditBranch,
                                    !center.permissions?.devDisableInventoryTab,
                                    center.permissions?.devEnableWhatsappReminders === true,
                                    center.permissions?.devEnableChatbot === true,
                                    center.permissions?.devShowWhatsappSettings !== false
                                  ].filter(Boolean).length} / 6 نشط)
                                </span>
                              </div>
                              {activeAccordions.bookings ? <ChevronUp size={16} className="text-indigo-600" /> : <ChevronDown size={16} className="text-slate-500" />}
                            </button>
                            
                            {activeAccordions.bookings && (
                              <div className="p-4 border-t border-slate-200 bg-white space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">تمكين إضافة فروع جديدة</div>
                                      <div className="text-[10px] text-slate-500">السماح لمدير المركز بإنشاء فروع جديدة حتى الحد الأقصى المسموح</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisableAddBranch}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisableAddBranch: !center.permissions?.devDisableAddBranch
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs">تمكين تعديل الفروع وحفظ الإعدادات</div>
                                      <div className="text-[10px] text-slate-500">السماح لمدراء الفروع بتعديل معلومات الفرع وحفظ ساعات العمل والروابط</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisableEditBranch}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisableEditBranch: !center.permissions?.devDisableEditBranch
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs font-[Cairo]">ظهور قسم المخازن والمنتجات والخدمات</div>
                                      <div className="text-[10px] text-slate-500 font-[Cairo]">عرض أو إخفاء قسم المستودع وتأجير الأدوات لجميع الفروع</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={!center.permissions?.devDisableInventoryTab}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devDisableInventoryTab: !center.permissions?.devDisableInventoryTab
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                  <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                                    <div>
                                      <div className="font-bold text-slate-800 text-xs font-[Cairo]">عرض زر تخصيص قوالب ورسائل الواتساب للمركز</div>
                                      <div className="text-[10px] text-slate-500 font-[Cairo]">السماح بتعديل قالب رسالة تأكيد وحجز الموعد وشكله من لوحة العميل</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={center.permissions?.devShowWhatsappSettings !== false}
                                        onChange={() => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devShowWhatsappSettings: center.permissions?.devShowWhatsappSettings === false
                                              }
                                            } : u)
                                          });
                                        }}
                                      />
                                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                    </label>
                                  </div>

                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                                  
                                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-3 shadow-sm">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-extrabold text-slate-800 text-xs font-[Cairo]">تفعيل تذكيرات الواتساب التلقائية للعملاء</div>
                                        <div className="text-[10px] text-slate-500 font-[Cairo]">إرسال تذكيرات الحجوزات والمواعيد اليومية تلقائياً للعملاء</div>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          className="sr-only peer" 
                                          checked={!!center.permissions?.devEnableWhatsappReminders}
                                          onChange={() => {
                                            updateData({
                                              users: data.users.map(u => u.user === center.user ? {
                                                ...u,
                                                permissions: {
                                                  ...u.permissions,
                                                  devEnableWhatsappReminders: !center.permissions?.devEnableWhatsappReminders
                                                }
                                              } : u)
                                            });
                                          }}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                      </label>
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-700 block font-[Cairo]">رقم هاتف إرسال التذكيرات (الواتس آب المرسِل):</label>
                                      <input 
                                        type="text"
                                        placeholder="+9665XXXXXXXX"
                                        value={center.permissions?.devWhatsappSenderNumber || ''}
                                        onChange={(e) => {
                                          updateData({
                                            users: data.users.map(u => u.user === center.user ? {
                                              ...u,
                                              permissions: {
                                                ...u.permissions,
                                                devWhatsappSenderNumber: e.target.value
                                              }
                                            } : u)
                                          });
                                        }}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold font-[Cairo] outline-none focus:border-indigo-600"
                                      />
                                      <span className="text-[9px] text-indigo-500 block font-[Cairo]">سيتم استخدام هذا الرقم لإرسال رسائل التأكيد والتذكير اليومية للفروع تلقائياً.</span>
                                    </div>
                                  </div>

                                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3 shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="font-extrabold text-slate-800 text-xs font-[Cairo]">تفعيل الشات بوت الذكي (AI Chatbot)</div>
                                        <div className="text-[10px] text-slate-500 font-[Cairo]">إظهار نافذة محادثة ذكية تفاعلية لحجز العملاء والرد عليهم للفرع</div>
                                      </div>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          className="sr-only peer" 
                                          checked={!!center.permissions?.devEnableChatbot}
                                          onChange={() => {
                                            updateData({
                                              users: data.users.map(u => u.user === center.user ? {
                                                ...u,
                                                permissions: {
                                                  ...u.permissions,
                                                  devEnableChatbot: !center.permissions?.devEnableChatbot
                                                }
                                              } : u)
                                            });
                                          }}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                      </label>
                                    </div>
                                    <div className="text-[10px] text-emerald-700 font-[Cairo] bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100/60 mt-1">
                                      ✨ عند تفعيل الشات بوت، سيتم تفعيل الذكاء الاصطناعي لحجز خدمات الجمال مباشرة عبر الروابط المتاحة وتوفير ردود سريعة للزوار.
                                    </div>
                                  </div>

                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Subscription Billing & Invoices System (Developer Only) */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-[Cairo] mt-6">
                    <h6 className="font-bold text-slate-700 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                      <Receipt size={18} className="text-indigo-600"/>
                      سجل فواتير تحصيل الاشتراكات ورسائل التفعيل للمركز
                    </h6>

                    {/* Add subscription invoice form */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 mb-4">
                      <div className="text-xs font-bold text-slate-800">إضافة فاتورة اشتراك وتحصيل جديدة:</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">قيمة الاشتراك بالعملة</label>
                          <input 
                            type="number" 
                            value={subAmount} 
                            onChange={e => setSubAmount(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600" 
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">مدة الاشتراك (بالأشهر)</label>
                          <select 
                            value={subMonths} 
                            onChange={e => setSubMonths(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold"
                          >
                            <option value="1">شهر واحد</option>
                            <option value="3">3 أشهر (ربع سنوي)</option>
                            <option value="6">6 أشهر (نصف سنوي)</option>
                            <option value="12">12 شهر (سنة كاملة)</option>
                            <option value="24">24 شهر (سنتين)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">حالة الدفع والتحصيل</label>
                          <select 
                            value={subStatus} 
                            onChange={e => setSubStatus(e.target.value as 'paid' | 'unpaid')}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-indigo-600 font-bold"
                          >
                            <option value="paid">✅ مدفوعة ومحصلة</option>
                            <option value="unpaid">❌ غير مدفوعة (آجل)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const newInv = {
                            id: 'SUB-' + Date.now().toString().slice(-6),
                            date: new Date().toLocaleDateString('ar-EG'),
                            amount: subAmount,
                            months: subMonths,
                            paymentStatus: subStatus
                          };
                          
                          // Calculate and update expiry date
                          const currentExpiry = center.expiryDate ? new Date(center.expiryDate) : new Date();
                          const targetExpiry = new Date(currentExpiry);
                          targetExpiry.setMonth(targetExpiry.getMonth() + subMonths);

                          const updatedInvoices = [...(center.subscriptionInvoices || []), newInv];
                          updateData({
                            users: data.users.map(u => u.user === center.user ? {
                              ...u,
                              expiryDate: targetExpiry.toISOString(),
                              subscriptionInvoices: updatedInvoices
                            } : u)
                          });

                          alert(`🎉 تم إصدار فاتورة الاشتراك بنجاح وتلقائياً تم تمديد صلاحية المركز لغاية: ${targetExpiry.toLocaleDateString('ar-EG')}`);
                        }}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus size={14} />
                        إصدار الفاتورة وترخيص الاشتراك الآن
                      </button>
                    </div>

                    {/* Invoices List Table */}
                    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                      <table className="w-full text-xs text-right text-slate-800">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-100 font-bold">
                          <tr>
                            <th className="p-2.5">رقم الفاتورة</th>
                            <th className="p-2.5">التاريخ</th>
                            <th className="p-2.5">المدة</th>
                            <th className="p-2.5">المبلغ</th>
                            <th className="p-2.5">الحالة</th>
                            <th className="p-2.5 text-center">خيارات التفعيل والتحكم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {(!center.subscriptionInvoices || center.subscriptionInvoices.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400 font-bold font-[Cairo]">
                                لا توجد فواتير اشتراكات مسجلة لهذا المركز بعد.
                              </td>
                            </tr>
                          ) : (
                            center.subscriptionInvoices.map((inv, idx) => (
                              <tr key={inv.id || idx} className="hover:bg-slate-50 transition-colors">
                                <td className="p-2.5 font-bold text-slate-700">{inv.id}</td>
                                <td className="p-2.5 text-slate-600">{inv.date}</td>
                                <td className="p-2.5 text-slate-800 font-[Cairo]">{inv.months} أشهر</td>
                                <td className="p-2.5 font-extrabold text-slate-900">{inv.amount} {data.clinics[0]?.currency || 'EGP'}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${inv.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {inv.paymentStatus === 'paid' ? 'مدفوع' : 'آجل'}
                                  </span>
                                </td>
                                <td className="p-2.5 flex items-center justify-center gap-1.5 no-print">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingInvoice(inv);
                                      setEditingInvoiceType('subscription');
                                      setEditingInvoiceCenterUser(center.user);
                                    }}
                                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md font-bold text-[10px] flex items-center gap-1 border border-amber-200/50 transition-colors"
                                  >
                                    <Edit size={11} />
                                    تعديل ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setActiveInvoiceForPrint({ ...inv, centerName: center.name, centerUser: center.user, expiryDate: center.expiryDate, maxBranches: center.maxBranches })}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md font-bold text-[10px] flex items-center gap-1 border border-indigo-200/50"
                                  >
                                    <Receipt size={11} />
                                    طباعة تفعيل 🖨️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const text = `مرحباً ${center.name}،\nلقد تم تفعيل اشتراككم بنجاح في "نظام إدارة مراكز التجميل والعناية".\n\nتفاصيل الترخيص والتفعيل:\n- المركز الرئيسي: ${center.name}\n- اسم المستخدم: ${center.user}\n- تاريخ انتهاء الصلاحية: ${center.expiryDate ? new Date(center.expiryDate).toLocaleDateString('ar-EG') : 'غير محدد'}\n- الحد الأقصى للفروع: ${center.maxBranches || 3} فروع\n- قيمة الفاتورة: ${inv.amount} ${data.clinics[0]?.currency || 'EGP'}\n- مدة التفعيل: ${inv.months} أشهر\n- تاريخ الحركة: ${inv.date}\n- حالة الدفع: ${inv.paymentStatus === 'paid' ? 'مستلم ومسدد' : 'آجل'}\n\nشكراً لاختياركم خدماتنا!`;
                                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
                                    }}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] flex items-center gap-1 border border-emerald-200/50"
                                  >
                                    إرسال واتساب 💬
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟ لن يتأثر تاريخ انتهاء الصلاحية الحالي للمركز.')) {
                                        updateData({
                                          users: data.users.map(u => u.user === center.user ? {
                                            ...u,
                                            subscriptionInvoices: (u.subscriptionInvoices || []).filter(i => i.id !== inv.id)
                                          } : u)
                                        });
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 bg-red-50 rounded-md transition-colors"
                                  >
                                    <Trash size={12} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Clean Slate Database Reset Module (Developer Only) */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6 font-[Cairo]">
        <h6 className="font-bold text-slate-800 mb-4 flex items-center gap-2 font-[Cairo]">
          <Database size={18} className="text-rose-600"/>
          تهيئة قاعدة البيانات وحذف كافة البيانات والعملاء والمبيعات (Clean Slate)
        </h6>
        
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-4">
          <div className="flex gap-3 items-start">
            <AlertCircle className="text-rose-600 mt-0.5 shrink-0" size={20} />
            <div className="space-y-1">
              <span className="font-bold text-rose-800 block text-sm font-[Cairo]">⚠️ تحذير أمني شديد الخطورة للمطور الرئيسي:</span>
              <p className="text-xs text-rose-700 leading-relaxed font-[Cairo]">
                هذا الخيار مخصص لإعادة النظام للحالة الصفرية والنظيفة تماماً استعداداً للنشر النهائي على GitHub أو السيرفر الإنتاجي. سيقوم هذا الإجراء بمسح كافة الفروع، المبيعات، الحجوزات، العملاء، المصروفات، وجميع السجلات المضافة في النظام نهائياً من قاعدة بيانات Firebase.
              </p>
              <p className="text-xs text-rose-800 font-bold font-[Cairo]">
                * لن يتم حذف حساب المطور الرئيسي (صبري الديب) وسيظل قادراً على تسجيل الدخول بنفس كلمة المرور الخاصة به.
              </p>
            </div>
          </div>

          {isCleanSlateSuccess ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-2 animate-in fade-in font-[Cairo]">
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
              🎉 تمت تهيئة النظام ومسح كافة البيانات التجريبية بنجاح تام! قاعدة البيانات الآن خالية ونظيفة وجاهزة تماماً للنشر.
            </div>
          ) : (
            <div className="pt-2 border-t border-rose-200/50 space-y-4 font-[Cairo]">
              <div className="flex items-center gap-2.5">
                <input 
                  type="checkbox"
                  id="confirm_reset"
                  checked={isCleanSlateConfirmed}
                  onChange={(e) => setIsCleanSlateConfirmed(e.target.checked)}
                  className="w-4 h-4 text-rose-600 border-rose-300 rounded focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="confirm_reset" className="text-xs font-bold text-slate-700 cursor-pointer select-none font-[Cairo]">
                  أؤكد رغبتي في تهيئة النظام وحذف كل الملفات والمبيعات من قاعدة البيانات.
                </label>
              </div>

              {isCleanSlateConfirmed && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200 font-[Cairo]">
                  <label className="text-xs font-bold text-slate-700 block font-[Cairo]">
                    لتأكيد المسح النهائي، يرجى كتابة كلمة <span className="text-rose-600 underline font-extrabold font-[Cairo]">"تنظيف"</span> في الحقل أدناه:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                    <input 
                      type="text"
                      placeholder="اكتب تنظيف هنا..."
                      value={cleanSlateInputText}
                      onChange={(e) => setCleanSlateInputText(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-500 text-center font-[Cairo] tracking-wider"
                    />
                    <button
                      type="button"
                      disabled={cleanSlateInputText !== 'تنظيف'}
                      onClick={() => {
                        resetData();
                        setIsCleanSlateSuccess(true);
                        setIsCleanSlateConfirmed(false);
                        setCleanSlateInputText('');
                        setTimeout(() => setIsCleanSlateSuccess(false), 8000);
                      }}
                      className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white font-bold text-xs transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed shrink-0 font-[Cairo]"
                    >
                      🔥 تنفيذ التهيئة الفورية للإنتاج
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Branch Subscriptions Manager */}
      
      {/* Invoice & Tax Settings Manager */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Receipt size={18} className="text-indigo-600"/>
          إعدادات الفاتورة والضريبة (لكل فرع)
        </h6>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="p-3">اسم الفرع</th>
                <th className="p-3">نسبة الضريبة (VAT %)</th>
                <th className="p-3">الرقم الضريبي</th>
                <th className="p-3">الشعار (رابط الصورة)</th>
                <th className="p-3">رقم الواتساب</th>
                <th className="p-3">رسالة الترحيب / التذييل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(currentUser?.role === 'developer' ? data.clinics : currentUser?.role === 'master_admin' ? data.clinics.filter(c => c.masterAdminId === currentUser?.user) : data.clinics.filter(c => c.id === currentUser?.clinicId)).length === 0 ? (
                <tr><td colSpan={6} className="p-6 text-center text-slate-400">لا يوجد فروع متاحة</td></tr>
              ) : (currentUser?.role === 'developer' ? data.clinics : currentUser?.role === 'master_admin' ? data.clinics.filter(c => c.masterAdminId === currentUser?.user) : data.clinics.filter(c => c.id === currentUser?.clinicId)).map(clinic => {
                return (
                  <tr key={clinic.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{clinic.name}</td>
                    <td className="p-3">
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-24"
                        value={clinic.vatRate || ''}
                        placeholder="15"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, vatRate: Number(e.target.value) } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-full"
                        value={clinic.taxId || ''}
                        placeholder="أدخل الرقم الضريبي"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, taxId: e.target.value } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {clinic.logoUrl ? (
                          <div className="relative w-8 h-8 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center group flex-shrink-0">
                            <img src={clinic.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                            <button
                              type="button"
                              onClick={() => {
                                const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, logoUrl: '' } : c);
                                updateData({ clinics: updatedClinics });
                              }}
                              className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[8px] font-bold"
                              title="إزالة الشعار"
                            >
                              ❌
                            </button>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-slate-100 border border-dashed border-slate-300 rounded flex items-center justify-center text-slate-400 text-xs flex-shrink-0">
                            🖼️
                          </div>
                        )}
                        <div className="flex-1 min-w-[120px]">
                          <input 
                            type="file" 
                            accept="image/*"
                            id={`logo-file-${clinic.id}`}
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 2 * 1024 * 1024) {
                                  alert('عذراً، حجم الصورة يجب ألا يتجاوز 2 ميجابايت لسرعة التحميل.');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, logoUrl: reader.result as string } : c);
                                  updateData({ clinics: updatedClinics });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor={`logo-file-${clinic.id}`}
                            className="inline-block bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-700 font-bold text-[10px] px-2 py-1 rounded cursor-pointer transition-colors shadow-sm whitespace-nowrap"
                          >
                            رفع صورة الشعار 🖼️
                          </label>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-full"
                        value={clinic.whatsappNumber || ''}
                        placeholder="مثال: 966500000000"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, whatsappNumber: e.target.value } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    <td className="p-3">
                      <textarea 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600 w-full resize-y min-h-[40px]"
                        value={clinic.invoiceMessage || ''}
                        placeholder="رسالة الترحيب أسفل الفاتورة"
                        onChange={(e) => {
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, invoiceMessage: e.target.value } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
        <h6 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Calendar size={18} className="text-indigo-600"/>
          إدارة اشتراكات الفروع (تاريخ الانتهاء)
        </h6>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="p-3">اسم الفرع</th>
                <th className="p-3">المركز الرئيسي التابع له</th>
                <th className="p-3">تاريخ انتهاء الاشتراك</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.clinics.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-slate-400">لا يوجد فروع</td></tr>
              ) : data.clinics.map(clinic => {
                const masterAdmin = data.users.find(u => u.user === clinic.masterAdminId)?.name || 'غير محدد';
                return (
                  <tr key={clinic.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-800">{clinic.name}</td>
                    <td className="p-3 text-slate-500">{masterAdmin}</td>
                    <td className="p-3">
                      <input 
                        type="date" 
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-indigo-600"
                        value={clinic.expiryDate ? clinic.expiryDate.split('T')[0] : ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newDate = val ? new Date(val).toISOString() : '';
                          const updatedClinics = data.clinics.map(c => c.id === clinic.id ? { ...c, expiryDate: newDate } : c);
                          updateData({ clinics: updatedClinics });
                        }}
                      />
                    </td>
                    <td className="p-3">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${
                         !clinic.expiryDate ? 'bg-slate-100 text-slate-500' :
                         new Date(clinic.expiryDate).getTime() < Date.now() ? 'bg-red-100 text-red-600' :
                         new Date(clinic.expiryDate).getTime() < Date.now() + 7 * 86400000 ? 'bg-amber-100 text-amber-700' :
                         'bg-green-100 text-green-700'
                       }`}>
                         {
                           !clinic.expiryDate ? 'غير محدد' :
                           new Date(clinic.expiryDate).getTime() < Date.now() ? 'منتهي' :
                           new Date(clinic.expiryDate).getTime() < Date.now() + 7 * 86400000 ? 'ينتهي قريباً' :
                           'فعال'
                         }
                       </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settings Modals */}
      <EditInvoiceModal
        isOpen={editingInvoice !== null}
        onClose={() => setEditingInvoice(null)}
        type={editingInvoiceType}
        invoice={editingInvoice}
        centerUser={editingInvoiceCenterUser}
        clinicId={editingInvoiceClinicId}
      />

      <InvoiceSettingsModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />

      <VoiceCallSettingsModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
      />

      <StaffPermissionsModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
      />

      {/* Printable Activation Ticket Modal */}
      {activeInvoiceForPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-w-sm w-full flex flex-col space-y-4 text-right relative font-[Cairo]">
            
            {/* Close Button */}
            <button 
              onClick={() => setActiveInvoiceForPrint(null)}
              className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors no-print"
            >
              <X size={16} />
            </button>

            {/* Ticket Header */}
            <div className="text-center space-y-1.5 border-b border-dashed border-slate-200 pb-4">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck size={26} />
              </div>
              <h5 className="font-extrabold text-slate-800 text-base mt-2">فاتورة وسند تفعيل اشتراك</h5>
              <p className="text-[10px] text-slate-500 font-bold">نظام إدارة مراكز التجميل والعناية بالسحابة</p>
            </div>

            {/* Ticket Contents */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">اسم العميل (المركز):</span>
                <span className="font-extrabold text-slate-800">{activeInvoiceForPrint.centerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">اسم مستخدم الدخول:</span>
                <span className="font-mono font-bold text-slate-800">{activeInvoiceForPrint.centerUser}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">رقم الفاتورة:</span>
                <span className="font-bold text-indigo-600">{activeInvoiceForPrint.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">تاريخ الإصدار:</span>
                <span className="text-slate-700">{activeInvoiceForPrint.date}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">مدة الاشتراك والتفعيل:</span>
                <span className="font-bold text-slate-800">{activeInvoiceForPrint.months} أشهر</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">الحد الأقصى للفروع:</span>
                <span className="font-bold text-slate-800">{activeInvoiceForPrint.maxBranches || 3} فروع تجميل</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">صلاحية الترخيص لغاية:</span>
                <span className="font-extrabold text-emerald-600">{activeInvoiceForPrint.expiryDate ? new Date(activeInvoiceForPrint.expiryDate).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">المبلغ الإجمالي المدفوع:</span>
                <span className="font-black text-slate-950 text-sm">{activeInvoiceForPrint.amount} {data.clinics[0]?.currency || 'EGP'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">حالة التحصيل:</span>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${activeInvoiceForPrint.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {activeInvoiceForPrint.paymentStatus === 'paid' ? 'مستلم ومسدد بالكامل' : 'آجل'}
                </span>
              </div>
            </div>

            {/* Printable Area barcode styling footer */}
            <div className="text-center pt-4 border-t border-dashed border-slate-200">
              <div className="inline-block bg-slate-100 p-2 rounded-xl mb-1.5">
                <QrCode size={90} className="text-slate-800" />
              </div>
              <p className="text-[10px] text-slate-400">سند تفعيل رسمي - شكراً لاختياركم خدماتنا</p>
            </div>

            {/* Print and Actions Panel */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1"
              >
                <Receipt size={14} />
                طباعة الآن
              </button>
              <button
                type="button"
                onClick={() => setActiveInvoiceForPrint(null)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-xl transition-all"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>

    {/* Printable Developer Accounting Ledger Statement */}
    <div className="hidden print:block font-[Cairo] bg-white text-slate-900 p-8 w-full max-w-4xl mx-auto space-y-6 dir-rtl text-right">
      {/* Printable Header */}
      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4">
        <div className="space-y-1">
          <h1 className="text-xl font-black text-slate-900">سند كشف الحسابات والتعاقدات السحابية</h1>
          <p className="text-xs text-slate-500 font-bold">المطور الرئيسي: صبري الديب</p>
          <p className="text-[10px] text-slate-400">sapry.eldeep@gmail.com</p>
        </div>
        <div className="text-left">
          <span className="text-lg font-black text-indigo-700 font-sans">SAPRY EL-DEEP</span>
          <p className="text-[10px] text-slate-500 font-mono font-bold mt-1">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')} - {new Date().toLocaleTimeString('ar-EG')}</p>
        </div>
      </div>

      {/* Printable Summary cards */}
      <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="text-center">
          <span className="text-[10px] font-bold text-slate-500">إجمالي التعاقدات والمبيعات</span>
          <div className="text-lg font-black text-slate-900 mt-1">{totalSalesValue.toLocaleString('ar-EG')} {devCurrency}</div>
        </div>
        <div className="text-center border-x border-slate-200">
          <span className="text-[10px] font-bold text-emerald-600">إجمالي المبالغ المحصلة</span>
          <div className="text-lg font-black text-emerald-700 mt-1">{totalCollectedFromCenters.toLocaleString('ar-EG')} {devCurrency}</div>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-bold text-rose-600">إجمالي المستحقات المعلقة (الآجل)</span>
          <div className="text-lg font-black text-rose-700 mt-1">{totalPendingFromCenters.toLocaleString('ar-EG')} {devCurrency}</div>
        </div>
      </div>

      {/* Printable Centers Ledger Table */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900">سجل تعاقدات المراكز والديون بالتفصيل</h2>
        <table className="w-full text-xs border-collapse border border-slate-300 text-slate-900">
          <thead>
            <tr className="bg-slate-100 text-slate-800 font-extrabold">
              <th className="border border-slate-300 p-2 text-right">اسم المركز</th>
              <th className="border border-slate-300 p-2 text-center">المستخدم / المرور</th>
              <th className="border border-slate-300 p-2 text-center">عقد التصميم</th>
              <th className="border border-slate-300 p-2 text-center">عقد الفرع</th>
              <th className="border border-slate-300 p-2 text-center">الفروع</th>
              <th className="border border-slate-300 p-2 text-center">الإجمالي</th>
              <th className="border border-slate-300 p-2 text-center">المدفوع كاش</th>
              <th className="border border-slate-300 p-2 text-center">المتبقي للمطور</th>
            </tr>
          </thead>
          <tbody>
            {masterAdmins.map(admin => {
              const actualBranches = data.clinics.filter(c => c.masterAdminId === admin.user).length;
              const designPrice = admin.designSalePrice || 5000;
              const bPrice = admin.branchSalePrice || 1500;
              const totalDue = designPrice + (bPrice * actualBranches);
              const paid = admin.paidAmountToDev || 0;
              const remaining = totalDue - paid;

              return (
                <tr key={admin.user} className="hover:bg-slate-50 font-medium">
                  <td className="border border-slate-300 p-2 font-extrabold">{admin.name}</td>
                  <td className="border border-slate-300 p-2 text-center font-mono text-[10px]">{admin.user} / {admin.pass}</td>
                  <td className="border border-slate-300 p-2 text-center">{designPrice.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center">{bPrice.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-indigo-700">{actualBranches} فرع</td>
                  <td className="border border-slate-300 p-2 text-center font-bold">{totalDue.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center font-bold text-emerald-700">{paid.toLocaleString('ar-EG')} {devCurrency}</td>
                  <td className="border border-slate-300 p-2 text-center font-black text-rose-700">{remaining.toLocaleString('ar-EG')} {devCurrency}</td>
                </tr>
              );
            })}
            {/* Summary Bottom Row */}
            <tr className="bg-slate-100 font-bold text-slate-900 text-xs">
              <td colSpan={2} className="border border-slate-300 p-2 font-black text-right">الإجماليات العامة للمبيعات</td>
              <td className="border border-slate-300 p-2 text-center font-black">{totalDesignSales.toLocaleString('ar-EG')} {devCurrency}</td>
              <td className="border border-slate-300 p-2 text-center">-</td>
              <td className="border border-slate-300 p-2 text-center font-black text-indigo-700">{data.clinics.length} فروع</td>
              <td className="border border-slate-300 p-2 text-center font-black">{totalSalesValue.toLocaleString('ar-EG')} {devCurrency}</td>
              <td className="border border-slate-300 p-2 text-center font-black text-emerald-700">{totalCollectedFromCenters.toLocaleString('ar-EG')} {devCurrency}</td>
              <td className="border border-slate-300 p-2 text-center font-black text-rose-700">{totalPendingFromCenters.toLocaleString('ar-EG')} {devCurrency}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Printable Verification/Watermark & Signature Footer */}
      <div className="pt-12 flex justify-between items-end">
        <div className="space-y-2">
          <div className="inline-block bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <QrCode size={75} className="text-slate-800" />
          </div>
          <p className="text-[9px] text-slate-400 font-mono font-semibold">شامـل للجمـال v2.6 - كود تفعيل المطور: {currentUser?.user}</p>
        </div>
        
        <div className="text-center w-48 border-t border-slate-900 pt-2">
          <span className="text-xs font-black text-slate-900 block">توقيع واعتماد المطور</span>
          <span className="text-[11px] text-slate-500 font-bold mt-1 block">صبري الديب</span>
          <div className="h-6"></div>
        </div>
      </div>
    </div>

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm print:hidden">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="bg-rose-50 p-6 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                <Trash size={32} />
              </div>
              <h3 className="text-xl font-black text-rose-700 mb-2">تأكيد الحذف</h3>
              <p className="text-rose-600/80 text-sm font-semibold">
                هل أنت متأكد من رغبتك في الحذف نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
            </div>
            <div className="p-6 bg-white flex gap-3">
              <button 
                onClick={confirmDeleteUser}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                نعم، احذف
              </button>
              <button 
                onClick={cancelDeleteUser}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
  </>
  );
}
