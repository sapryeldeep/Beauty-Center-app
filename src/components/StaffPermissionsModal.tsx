import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Shield, Save, UserCheck, Key, Building2, Check, Lock, ShieldAlert, Award, FileText, CheckCircle2 } from 'lucide-react';
import { User, Role, UserPermissions } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
}

export function StaffPermissionsModal({ isOpen, onClose, targetUser }: Props) {
  const { data, updateData, currentUser } = useStore();

  const accessibleClinics = currentUser?.role === 'developer'
    ? data.clinics
    : currentUser?.role === 'master_admin'
      ? data.clinics.filter(c => c.masterAdminId === currentUser.user)
      : data.clinics.filter(c => c.id === currentUser?.clinicId);

  const [name, setName] = useState(targetUser?.name || '');
  const [userAcc, setUserAcc] = useState(targetUser?.user || '');
  const [pass, setPass] = useState(targetUser?.pass || '');
  const [role, setRole] = useState<Role>(targetUser?.role || 'reception');
  const [clinicId, setClinicId] = useState<string>(targetUser?.clinicId || (currentUser?.role === 'master_admin' ? 'master' : (accessibleClinics[0]?.id || 'master')));

  // Default permissions based on role or existing permissions
  const getDefaultPermissionsForRole = (r: Role): UserPermissions => {
    switch (r) {
      case 'developer':
      case 'master_admin':
      case 'doctor':
        return {
          canViewDashboard: true,
          canViewPatients: true,
          canViewAppointments: true,
          canViewFinance: true,
          canManageExpenses: true,
          canViewServices: true,
          canViewInventory: true,
          canViewPayroll: true,
          canViewClinics: true,
          canViewStaff: true,
          canViewArchive: true,
          canAccessSettings: true,
          canDeleteRecords: true,
          canExportData: true,
          canEditInvoices: true,
          canViewInvoiceSettings: true,
          canPrintQueue: true,
          canPrintFinance: true,
          canPrintPatients: true,
          canPrintInventory: true,
          canPrintStaff: true,
          canEditInvoiceTotals: true,
          canEditInvoicePayments: true,
          canEditInvoiceMethods: true
        };
      case 'accountant':
        return {
          canViewDashboard: true,
          canViewPatients: true,
          canViewAppointments: false,
          canViewFinance: true,
          canManageExpenses: true,
          canViewServices: true,
          canViewInventory: true,
          canViewPayroll: true,
          canViewClinics: false,
          canViewStaff: false,
          canViewArchive: true,
          canAccessSettings: false,
          canDeleteRecords: false,
          canExportData: true,
          canEditInvoices: true,
          canViewInvoiceSettings: true,
          canPrintQueue: true,
          canPrintFinance: true,
          canPrintPatients: true,
          canPrintInventory: true,
          canPrintStaff: false,
          canEditInvoiceTotals: true,
          canEditInvoicePayments: true,
          canEditInvoiceMethods: true
        };
      case 'reception':
      case 'secretary':
        return {
          canViewDashboard: true,
          canViewPatients: true,
          canViewAppointments: true,
          canViewFinance: false,
          canManageExpenses: false,
          canViewServices: true,
          canViewInventory: false,
          canViewPayroll: false,
          canViewClinics: false,
          canViewStaff: false,
          canViewArchive: true,
          canAccessSettings: false,
          canDeleteRecords: false,
          canExportData: false,
          canEditInvoices: false,
          canViewInvoiceSettings: false,
          canPrintQueue: true,
          canPrintFinance: false,
          canPrintPatients: true,
          canPrintInventory: false,
          canPrintStaff: false,
          canEditInvoiceTotals: false,
          canEditInvoicePayments: false,
          canEditInvoiceMethods: false
        };
      case 'expert':
        return {
          canViewDashboard: true,
          canViewPatients: true,
          canViewAppointments: true,
          canViewFinance: false,
          canManageExpenses: false,
          canViewServices: true,
          canViewInventory: false,
          canViewPayroll: false,
          canViewClinics: false,
          canViewStaff: false,
          canViewArchive: false,
          canAccessSettings: false,
          canDeleteRecords: false,
          canExportData: false,
          canEditInvoices: false,
          canViewInvoiceSettings: false,
          canPrintQueue: false,
          canPrintFinance: false,
          canPrintPatients: false,
          canPrintInventory: false,
          canPrintStaff: false,
          canEditInvoiceTotals: false,
          canEditInvoicePayments: false,
          canEditInvoiceMethods: false
        };
      default:
        return {
          canViewDashboard: true,
          canViewPatients: true,
          canViewAppointments: true,
          canViewFinance: false,
          canManageExpenses: false,
          canViewServices: false,
          canViewInventory: false,
          canViewPayroll: false,
          canViewClinics: false,
          canViewStaff: false,
          canViewArchive: false,
          canAccessSettings: false,
          canDeleteRecords: false,
          canExportData: false,
          canEditInvoices: false,
          canViewInvoiceSettings: false,
          canPrintQueue: false,
          canPrintFinance: false,
          canPrintPatients: false,
          canPrintInventory: false,
          canPrintStaff: false,
          canEditInvoiceTotals: false,
          canEditInvoicePayments: false,
          canEditInvoiceMethods: false
        };
    }
  };

  const [permissions, setPermissions] = useState<UserPermissions>(
    targetUser?.permissions || getDefaultPermissionsForRole(targetUser?.role || 'reception')
  );

  // Sync state if targetUser changes
  React.useEffect(() => {
    if (targetUser) {
      setName(targetUser.name);
      setUserAcc(targetUser.user);
      setPass(targetUser.pass);
      setRole(targetUser.role);
      setClinicId(targetUser.clinicId);
      setPermissions(targetUser.permissions || getDefaultPermissionsForRole(targetUser.role));
    }
  }, [targetUser]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setPermissions(getDefaultPermissionsForRole(newRole));
  };

  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSelectAll = (val: boolean) => {
    setPermissions({
      canViewDashboard: val,
      canViewPatients: val,
      canViewAppointments: val,
      canViewFinance: val,
      canManageExpenses: val,
      canViewServices: val,
      canViewInventory: val,
      canViewPayroll: val,
      canViewClinics: val,
      canViewStaff: val,
      canViewArchive: val,
      canAccessSettings: val,
      canDeleteRecords: val,
      canExportData: val,
      canEditInvoices: val,
      canViewInvoiceSettings: val,
      canPrintQueue: val,
      canPrintFinance: val,
      canPrintPatients: val,
      canPrintInventory: val,
      canPrintStaff: val,
      canEditInvoiceTotals: val,
      canEditInvoicePayments: val,
      canEditInvoiceMethods: val
    });
  };

  const handleSave = () => {
    if (!name || !userAcc || !pass) {
      alert('يرجى ملء جميع الحقول الأساسية للموظف.');
      return;
    }

    if (targetUser) {
      // Check duplicate username if changed
      if (userAcc !== targetUser.user && data.users.some(u => u.user === userAcc)) {
        alert('اسم المستخدم موجود بالفعل! اختر اسم مستخدم آخر.');
        return;
      }

      const updatedUsers = data.users.map(u => {
        if (u.user === targetUser.user) {
          return {
            ...u,
            name,
            user: userAcc,
            pass,
            role,
            clinicId,
            permissions
          };
        }
        return u;
      });

      updateData({ users: updatedUsers });
      alert('تم تحديث بيانات وصلاحيات الموظف بنجاح!');
    } else {
      if (data.users.some(u => u.user === userAcc)) {
        alert('اسم المستخدم موجود بالفعل! اختر اسم مستخدم آخر.');
        return;
      }

      const newUser: User = {
        name,
        user: userAcc,
        pass,
        role,
        clinicId,
        isActive: true,
        permissions
      };

      updateData({ users: [...data.users, newUser] });
      alert('تم إضافة الموظف وتعيين صلاحياته بنجاح!');
    }

    onClose();
  };

  const permissionItems: { key: keyof UserPermissions; label: string; desc: string; category: string }[] = [
    { key: 'canViewDashboard', label: 'طابور الانتظار وتسجيل العملاء', desc: 'إمكانية إدخال العميلات للطابور والنداء الصوتي', category: 'العمليات اليومية' },
    { key: 'canViewPatients', label: 'سجل العملاء وملاحظات التجميل', desc: 'استعراض بيانات العملاء وتاريخ الجلسات والملاحظات', category: 'العمليات اليومية' },
    { key: 'canViewAppointments', label: 'جدول المواعيد والحجوزات', desc: 'حجز مواعيد جديدة والتعديل عليها وتأكيدها', category: 'العمليات اليومية' },
    { key: 'canViewFinance', label: 'الخزينة والمالية والتقارير اليومية', desc: 'استعراض الدخل الإجمالي والإيرادات اليومية وتفاصيل الدفع', category: 'الإدارة والمالية' },
    { key: 'canManageExpenses', label: 'تسجيل المصروفات وسندات الصرف', desc: 'إضافة مصاريف تشغيلية واستخراج سندات صرف الخزينة', category: 'الإدارة والمالية' },
    { key: 'canViewServices', label: 'الخدمات وباقات التجميل والأسعار', desc: 'استعراض وتعديل قائمة الخدمات والأسعار المعتمدة', category: 'الإدارة والمالية' },
    { key: 'canViewInventory', label: 'مستودع المستحضرات ومنتجات التجميل', desc: 'متابعة الأرصدة، الصلاحيات، وإضافة واستيراد المنتجات', category: 'الإدارة والمالية' },
    { key: 'canViewPayroll', label: 'مسير الرواتب والسلف والعمولات', desc: 'استعراض رواتب الموظفين وتسجيل الخصومات والمكافآت', category: 'الإدارة والمالية' },
    { key: 'canViewClinics', label: 'إدارة الفروع والعملات', desc: 'استعراض بيانات الفروع والاشتراكات والنسخ الاحتياطي', category: 'النظام والصلاحيات' },
    { key: 'canViewStaff', label: 'دليل الموظفين وتقييم الأداء', desc: 'استعراض حركة الموظفين ومعدل الإنجاز والإنتاجية', category: 'النظام والصلاحيات' },
    { key: 'canViewArchive', label: 'أرشيف العمليات والجلسات السابقة', desc: 'البحث في الفواتير والعمليات المنتهية والمؤرشفة', category: 'النظام والصلاحيات' },
    { key: 'canAccessSettings', label: 'الإعدادات العامة للنظام', desc: 'إمكانية فتح تبويب الإعدادات والتحكم الشامل', category: 'النظام والصلاحيات' },
    { key: 'canDeleteRecords', label: 'حذف السجلات والبيانات والفواتير', desc: 'صلاحية حساسة لحذف السجلات أو الفواتير والعمليات', category: 'صلاحيات حساسة' },
    { key: 'canExportData', label: 'تصدير وطباعة التقارير وExcel وPDF', desc: 'تحميل ملفات الإكسل وطباعة الكشوفات المجمعة', category: 'صلاحيات حساسة' },
    { key: 'canEditInvoices', label: 'تعديل الفاتورة وإعداد الضريبة', desc: 'القدرة على الدخول لتبويب الفواتير وتعديل البيانات الأساسية', category: 'صلاحيات حساسة' },
    
    // New permissions added based on developer customization request:
    { key: 'canViewInvoiceSettings', label: 'رؤية زر إعدادات الفاتورة والـ QR والنداء', desc: 'التحكم في ظهور أو إخفاء أزرار الإعدادات المتقدمة في التبويبات', category: 'تخصيص الواجهات والظهور' },
    { key: 'canPrintQueue', label: 'طباعة طابور الانتظار وتذاكر الفواتير', desc: 'إمكانية طباعة تذاكر الحجز والانتظار وفواتير POS الفورية للعميل', category: 'صلاحيات الطباعة المنفردة' },
    { key: 'canPrintFinance', label: 'طباعة التقارير المالية وكشوف الخزينة', desc: 'طباعة تقارير الأرباح والمصروفات والإيرادات التفصيلية بشكل منفرد', category: 'صلاحيات الطباعة المنفردة' },
    { key: 'canPrintPatients', label: 'طباعة سجلات وملفات العملاء والولاء', desc: 'إمكانية طباعة ملفات العميلات ونقاط الولاء بشكل منفرد', category: 'صلاحيات الطباعة المنفردة' },
    { key: 'canPrintInventory', label: 'طباعة جرد المستودع والمخازن', desc: 'إمكانية طباعة كشوفات المستحضرات المتبقية ومستويات صلاحية المنتجات', category: 'صلاحيات الطباعة المنفردة' },
    { key: 'canPrintStaff', label: 'طباعة رواتب وإنتاجية الموظفين', desc: 'طباعة مسير الرواتب ومعدلات إنجاز الموظفين والعمولات بشكل منفرد', category: 'صلاحيات الطباعة المنفردة' },
    { key: 'canEditInvoiceTotals', label: 'تعديل القيمة الإجمالية والمطلوب بالفاتورة', desc: 'السماح للموظف بتعديل الإجمالي والخصم والخدمات المحددة', category: 'تعديل الفواتير المنفصلة' },
    { key: 'canEditInvoicePayments', label: 'تعديل المدفوع والمستلم والمتبقي بالفاتورة', desc: 'السماح للموظف بتسجيل وتعديل الجزء المسدد والجزء الآجل', category: 'تعديل الفواتير المنفصلة' },
    { key: 'canEditInvoiceMethods', label: 'تعديل طريقة الدفع (كاش/فيزا/بنك)', desc: 'السماح للموظف باختيار وتعديل الخزينة المستلمة (كاش، شبكة، فيزا، إنستاباي)', category: 'تعديل الفواتير المنفصلة' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Shield size={22} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-900 text-lg">
                {targetUser ? `تعديل صلاحيات الموظف: ${targetUser.name}` : 'إضافة موظف وتحديد صلاحياته بدقة'}
              </h5>
              <p className="text-xs text-slate-500 mt-0.5">التحكم الكامل في صلاحيات الوصول لكافة أقسام وعمليات المركز</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Staff Info Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5">
            <h6 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-2">
              <UserCheck size={16} className="text-indigo-600" />
              البيانات الوظيفية وحساب الدخول
            </h6>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الموظف</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold" 
                  placeholder="مثال: ريم خالد"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم الدخول (Username)</label>
                <input 
                  type="text" 
                  value={userAcc} 
                  onChange={e => setUserAcc(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-mono text-left" 
                  placeholder="reem_user"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">كلمة المرور (Password)</label>
                <input 
                  type="text" 
                  value={pass} 
                  onChange={e => setPass(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-mono text-left" 
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">المسمى الوظيفي / الدور</label>
                <select 
                  value={role} 
                  onChange={e => handleRoleChange(e.target.value as Role)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold"
                >
                  <option value="doctor">مدير فرع / خبير تجميل رئيسي</option>
                  <option value="reception">موظف استقبال</option>
                  <option value="accountant">محاسب مالي</option>
                  <option value="secretary">سكرتارية</option>
                  <option value="expert">خبير تجميل / أخصائي</option>
                  <option value="staff">موظف عام</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الفرع التابع له</label>
                <select 
                  value={clinicId} 
                  onChange={e => setClinicId(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-600 font-bold text-indigo-700"
                >
                  {accessibleClinics.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {currentUser?.role === 'developer' || currentUser?.role === 'master_admin' ? (
                    <option value="master">المركز الرئيسي الموحد</option>
                  ) : null}
                </select>
              </div>
            </div>
          </div>

          {/* Granular Permissions Section */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h6 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <ShieldAlert size={18} className="text-indigo-600" />
                  جدول الصلاحيات التفصيلية (Custom Permissions Matrix)
                </h6>
                <p className="text-xs text-slate-500 mt-0.5">يمكنك تفعيل أو تعطيل أي خاصية بدقة لهذا الموظف</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                >
                  منح كل الصلاحيات
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors"
                >
                  سحب كافة الصلاحيات
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {permissionItems.map((item) => {
                const isChecked = !!permissions[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start justify-between gap-3 ${
                      isChecked
                        ? 'border-indigo-600 bg-indigo-50/50 text-slate-900 ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-500 opacity-75'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1.5">
                        {isChecked ? <CheckCircle2 size={15} className="text-indigo-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0" />}
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-snug">{item.desc}</div>
                      <span className="inline-block mt-2 text-[9.5px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                        {item.category}
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer pointer-events-none mt-0.5">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={isChecked}
                        readOnly
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4.5 px-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition-all active:scale-95"
          >
            <Save size={16} />
            حفظ واعتماد الصلاحيات
          </button>
        </div>

      </div>
    </div>
  );
}
