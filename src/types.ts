export type Role = 'developer' | 'master_admin' | 'branch_admin' | 'doctor' | 'reception' | 'secretary' | 'accountant' | 'expert' | 'staff';

export interface UserPermissions {
  canViewDashboard?: boolean;
  canViewPatients?: boolean;
  canViewAppointments?: boolean;
  canViewFinance?: boolean;
  canManageExpenses?: boolean;
  canViewServices?: boolean;
  canViewInventory?: boolean;
  canViewPayroll?: boolean;
  canViewClinics?: boolean;
  canViewStaff?: boolean;
  canViewArchive?: boolean;
  canAccessSettings?: boolean;
  canDeleteRecords?: boolean;
  canExportData?: boolean;
  canEditInvoices?: boolean;
  canViewInvoiceSettings?: boolean; // إظهار زر إعدادات الفاتورة والـ QR
  canPrintQueue?: boolean; // طباعة طابور الانتظار وفواتير العملاء
  canPrintFinance?: boolean; // طباعة التقارير المالية والخزينة
  canPrintPatients?: boolean; // طباعة دليل وسجلات العملاء
  canPrintInventory?: boolean; // طباعة كشوفات المستودع والمخزون
  canPrintStaff?: boolean; // طباعة كشوفات الموظفين والرواتب
  canEditInvoiceTotals?: boolean; // تعديل إجمالي الفاتورة والمبلغ المطلوب
  canEditInvoicePayments?: boolean; // تعديل المبلغ المدفوع والمستلم والمتبقي
  canEditInvoiceMethods?: boolean; // تعديل طريقة الدفع (كاش/فيزا/بنكي)
  printFull?: boolean; // طباعة كاملة أو منفرة للمركز
  financeFull?: boolean; // حسابات كاملة أو منفردة للمركز
  downloadFull?: boolean; // تحميل وتصدير كامل أو منفرد للمركز
  branchManagementFull?: boolean; // إدارة الفروع كاملة أو منفردة للمركز
  
  // Granular developer flags to disable features completely for the center
  devDisablePrintQueue?: boolean;
  devDisablePrintFinance?: boolean;
  devDisablePrintStaff?: boolean;
  devDisablePrintPatients?: boolean;
  devDisablePrintInventory?: boolean;
  
  devDisableFinanceTab?: boolean;
  devDisableInventoryTab?: boolean;
  devDisablePayrollTab?: boolean;
  
  devDisableExportExcel?: boolean;
  devDisableExportPDF?: boolean;
  
  devDisableAddBranch?: boolean;
  devDisableEditBranch?: boolean;
  
  // WhatsApp and Chatbot integrations
  devEnableWhatsappReminders?: boolean;
  devWhatsappSenderNumber?: string;
  devEnableChatbot?: boolean;
  
  // Developer show/hide settings switches for center admins
  devShowInvoiceSettings?: boolean;
  devShowWhatsappSettings?: boolean;
}

export interface User {
  name: string;
  user: string;
  pass: string;
  role: Role;
  clinicId: string;
  tenantId?: string;
  maxBranches?: number;
  expiryDate?: string;
  isActive?: boolean;
  modules?: PlatformSettings['modules'];
  hiddenModules?: string[];
  permissions?: UserPermissions;
  subscriptionInvoices?: SubscriptionInvoice[];
  designSalePrice?: number;
  branchSalePrice?: number;
  paidAmountToDev?: number;
}

export interface VoiceCallSettings {
  language: 'ar' | 'en' | 'both';
  arabicPhrase?: string;
  englishPhrase?: string;
  enableChime?: boolean;
  rate?: number;
  pitch?: number;
}

export interface ClinicInvoiceSettings {
  showQrCode?: boolean;
  qrType?: 'zatca' | 'standard' | 'url';
  showVat?: boolean;
  vatRate?: number;
  pricesIncludeVat?: boolean;
  commercialRegister?: string;
  invoiceTitle?: string;
  invoiceSubtitle?: string;
  invoiceTerms?: string;
  invoiceFooter?: string;
  invoiceType?: 'a4' | 'pos80' | 'modern';
  showDoctorName?: boolean;
  showHandler?: boolean;
  showPaymentMethod?: boolean;
  showCustomerPhone?: boolean;
  showDueBalance?: boolean;
  showClinicLogo?: boolean;
  showSignatureStamp?: boolean;
}

export interface PlatformSettings {
  modules: {
    patients: boolean;
    appointments: boolean;
    finance: boolean;
    services: boolean;
    inventory: boolean;
    payroll: boolean;
    clinics: boolean;
    staff: boolean;
    archive: boolean;
    settings: boolean;
  };
  customLabels: Record<string, string>;
  language?: 'ar' | 'en';
  loyaltyPointsValue?: number;
  voiceSettings?: VoiceCallSettings;
  developerCurrency?: string;
}

export interface SubscriptionInvoice {
  id: string;
  date: string;
  amount: number;
  months: number;
  paymentStatus: 'paid' | 'unpaid';
}

export interface Clinic {
  id: string;
  name: string;
  docName: string;
  currency: string;
  daysCount: number;
  expiryDate: string;
  taxId?: string;
  vatRate?: number;
  commercialRegister?: string;
  whatsappNumber?: string;
  invoiceAddress?: string;
  invoiceMessage?: string;
  logoUrl?: string;
  masterAdminId?: string;
  invoiceSettings?: ClinicInvoiceSettings;
  voiceSettings?: VoiceCallSettings;
  whatsappTemplate?: string;
  subscriptionInvoices?: SubscriptionInvoice[];
}

export interface Service {
  name: string;
  price: number;
}

export interface RecordItem {
  id: number;
  name: string;
  age: string;
  phone: string;
  service: string;
  total: number;
  paid: number;
  payMethod: string;
  handler: string;
  due: number;
  status: 'waiting' | 'in' | 'done';
  isoDate: string;
  date: string;
}

export interface Appointment {
  id: number;
  name: string;
  phone: string;
  date: string;
  time: string;
  service?: string;
}

export interface Expense {
  id: number;
  category: string;
  desc: string;
  amount: number;
  handler: string;
  date: string;
}

export interface PharmacyItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  expiry: string;
}

export interface Staff {
  id: number;
  name: string;
  salary: number;
  role: string;
  phone: string;
}

export interface PayrollTransaction {
  id: number;
  staffName: string;
  transType: 'advance' | 'bonus' | 'deduction';
  amount: number;
  note: string;
  date: string;
}

export interface PlatformData {
  users: User[];
  clinics: Clinic[];
  services: Service[];
  queue: Record<string, RecordItem[]>;
  archive: Record<string, RecordItem[]>;
  appointments: Record<string, Appointment[]>;
  beautyNotesStore: Record<string, string>;
  expensesStore: Record<string, Expense[]>;
  pharmacyStore: Record<string, PharmacyItem[]>;
  staffDirectory: Record<string, Staff[]>;
  payrollStore: Record<string, PayrollTransaction[]>;
  lastDate: string;
  settings?: PlatformSettings;
  activityLogs?: ActivityLog[];
}


export interface ActivityLog {
  id: string;
  clinicId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
