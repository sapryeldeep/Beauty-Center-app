import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { X, Save, Receipt, QrCode, Percent, Building2, Eye, Printer, CheckCircle, Shield, FileText, Phone, MapPin, Smartphone, HelpCircle, Lock } from 'lucide-react';
import { Clinic, ClinicInvoiceSettings } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetClinicId?: string;
}

export function InvoiceSettingsModal({ isOpen, onClose, targetClinicId }: Props) {
  const { data, updateData, currentUser } = useStore();

  // Filter accessible clinics - Show all clinics and branches
  const accessibleClinics = data.clinics;

  const defaultClinicId = targetClinicId || accessibleClinics[0]?.id || data.clinics[0]?.id;
  const [selectedClinicId, setSelectedClinicId] = useState<string>(defaultClinicId);

  const activeClinic = data.clinics.find(c => c.id === selectedClinicId) || data.clinics[0];

  // Active Tab inside modal
  const [activeTab, setActiveTab] = useState<'info' | 'tax_qr' | 'template'>('info');

  // Form State initialized from activeClinic
  const [name, setName] = useState(activeClinic?.name || '');
  const [docName, setDocName] = useState(activeClinic?.docName || '');
  const [currency, setCurrency] = useState(activeClinic?.currency || 'SAR');
  const [taxId, setTaxId] = useState(activeClinic?.taxId || '');
  const [commercialRegister, setCommercialRegister] = useState(activeClinic?.commercialRegister || activeClinic?.invoiceSettings?.commercialRegister || '');
  const [whatsappNumber, setWhatsappNumber] = useState(activeClinic?.whatsappNumber || '');
  const [invoiceAddress, setInvoiceAddress] = useState(activeClinic?.invoiceAddress || '');
  const [logoUrl, setLogoUrl] = useState(activeClinic?.logoUrl || '');

  // Invoice & Tax specific settings
  const existingInv = activeClinic?.invoiceSettings || {};
  const [showVat, setShowVat] = useState<boolean>(existingInv.showVat ?? (activeClinic?.vatRate ? activeClinic.vatRate > 0 : true));
  const [vatRate, setVatRate] = useState<number>(existingInv.vatRate ?? (activeClinic?.vatRate || 15));
  const [pricesIncludeVat, setPricesIncludeVat] = useState<boolean>(existingInv.pricesIncludeVat ?? true);
  
  const [showQrCode, setShowQrCode] = useState<boolean>(existingInv.showQrCode ?? true);
  const [qrType, setQrType] = useState<'zatca' | 'standard' | 'url'>(existingInv.qrType || 'zatca');

  const [invoiceType, setInvoiceType] = useState<'a4' | 'pos80' | 'modern'>(existingInv.invoiceType || 'pos80');
  const [invoiceTitle, setInvoiceTitle] = useState<string>(existingInv.invoiceTitle || 'فاتورة ضريبية مبسطة');
  const [invoiceSubtitle, setInvoiceSubtitle] = useState<string>(existingInv.invoiceSubtitle || activeClinic?.docName || '');
  const [invoiceTerms, setInvoiceTerms] = useState<string>(existingInv.invoiceTerms || 'المستحضرات التجميلية لا ترد ولا تستبدل بعد فتحها حرصاً على سلامتكم.');
  const [invoiceFooter, setInvoiceFooter] = useState<string>(existingInv.invoiceFooter || activeClinic?.invoiceMessage || 'شكراً لزيارتكم ونتمنى لكم دوام الصحة والجمال.');
  
  const [showDoctorName, setShowDoctorName] = useState<boolean>(existingInv.showDoctorName ?? true);
  const [showHandler, setShowHandler] = useState<boolean>(existingInv.showHandler ?? true);
  const [showPaymentMethod, setShowPaymentMethod] = useState<boolean>(existingInv.showPaymentMethod ?? true);
  const [showCustomerPhone, setShowCustomerPhone] = useState<boolean>(existingInv.showCustomerPhone ?? true);
  const [showDueBalance, setShowDueBalance] = useState<boolean>(existingInv.showDueBalance ?? true);
  const [showSignatureStamp, setShowSignatureStamp] = useState<boolean>(existingInv.showSignatureStamp ?? true);
  const [showClinicLogo, setShowClinicLogo] = useState<boolean>(existingInv.showClinicLogo ?? true);

  // Sync state when clinic selection changes
  const handleClinicChange = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    const cl = data.clinics.find(c => c.id === clinicId);
    if (!cl) return;

    setName(cl.name);
    setDocName(cl.docName);
    setCurrency(cl.currency);
    setTaxId(cl.taxId || '');
    setCommercialRegister(cl.commercialRegister || cl.invoiceSettings?.commercialRegister || '');
    setWhatsappNumber(cl.whatsappNumber || '');
    setInvoiceAddress(cl.invoiceAddress || '');
    setLogoUrl(cl.logoUrl || '');

    const inv = cl.invoiceSettings || {};
    setShowVat(inv.showVat ?? (cl.vatRate ? cl.vatRate > 0 : true));
    setVatRate(inv.vatRate ?? (cl.vatRate || 15));
    setPricesIncludeVat(inv.pricesIncludeVat ?? true);
    setShowQrCode(inv.showQrCode ?? true);
    setQrType(inv.qrType || 'zatca');
    setInvoiceType(inv.invoiceType || 'pos80');
    setInvoiceTitle(inv.invoiceTitle || 'فاتورة ضريبية مبسطة');
    setInvoiceSubtitle(inv.invoiceSubtitle || cl.docName || '');
    setInvoiceTerms(inv.invoiceTerms || 'المستحضرات التجميلية لا ترد ولا تستبدل بعد فتحها حرصاً على سلامتكم.');
    setInvoiceFooter(inv.invoiceFooter || cl.invoiceMessage || 'شكراً لزيارتكم ونتمنى لكم دوام الصحة والجمال.');
    setShowDoctorName(inv.showDoctorName ?? true);
    setShowHandler(inv.showHandler ?? true);
    setShowPaymentMethod(inv.showPaymentMethod ?? true);
    setShowCustomerPhone(inv.showCustomerPhone ?? true);
    setShowDueBalance(inv.showDueBalance ?? true);
    setShowSignatureStamp(inv.showSignatureStamp ?? true);
    setShowClinicLogo(inv.showClinicLogo ?? true);
  };

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = data.clinics.find(c => c.id === selectedClinicId);
    if (!clinic) return null;
    return data.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };
  const center = getCenterForUser();
  const isEditingAllowed = currentUser?.role === 'developer' || center?.permissions?.devShowInvoiceSettings !== false;

  if (!isOpen) return null;

  const handleSave = () => {
    if (!isEditingAllowed) {
      alert('🔒 عفواً، ميزة تعديل وتخصيص الفواتير مقفلة لهذا المركز من قبل المطور. يرجى مراجعة اشتراك النظام الخاص بك لتفعيلها.');
      return;
    }
    if (!activeClinic) return;

    const newInvoiceSettings: ClinicInvoiceSettings = {
      showQrCode,
      qrType,
      showVat,
      vatRate: Number(vatRate),
      pricesIncludeVat,
      commercialRegister,
      invoiceTitle,
      invoiceSubtitle,
      invoiceTerms,
      invoiceFooter,
      invoiceType,
      showDoctorName,
      showHandler,
      showPaymentMethod,
      showCustomerPhone,
      showDueBalance,
      showClinicLogo,
      showSignatureStamp
    };

    const updatedClinics = data.clinics.map(c => {
      if (c.id === selectedClinicId) {
        return {
          ...c,
          name,
          docName,
          currency,
          taxId,
          commercialRegister,
          vatRate: Number(vatRate),
          whatsappNumber,
          invoiceAddress,
          logoUrl,
          invoiceMessage: invoiceFooter,
          invoiceSettings: newInvoiceSettings
        };
      }
      return c;
    });

    updateData({ clinics: updatedClinics });
    alert('تم حفظ إعدادات الفاتورة والبيانات بنجاح!');
    onClose();
  };

  // Sample calculation for preview
  const sampleAmount = 500;
  let sampleSubtotal = sampleAmount;
  let sampleVatAmount = 0;
  let sampleGrandTotal = sampleAmount;

  if (showVat && vatRate > 0) {
    if (pricesIncludeVat) {
      sampleSubtotal = sampleAmount / (1 + (vatRate / 100));
      sampleVatAmount = sampleAmount - sampleSubtotal;
      sampleGrandTotal = sampleAmount;
    } else {
      sampleSubtotal = sampleAmount;
      sampleVatAmount = sampleAmount * (vatRate / 100);
      sampleGrandTotal = sampleSubtotal + sampleVatAmount;
    }
  }

  const sampleQrData = `المورد: ${name || 'مركز التجميل'}
${taxId ? `الرقم الضريبي: ${taxId}` : ''}
${commercialRegister ? `السجل التجاري: ${commercialRegister}` : ''}
التاريخ: ${new Date().toLocaleDateString('ar-EG')}
الإجمالي: ${sampleGrandTotal.toFixed(2)} ${currency}
${showVat ? `الضريبة: ${sampleVatAmount.toFixed(2)}` : ''}`.trim();

  const previewQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(sampleQrData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-right">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-sm">
              <Receipt size={22} />
            </div>
            <div>
              <h5 className="font-extrabold text-slate-900 text-lg">إعدادات الفواتير والبيانات (لكل مركز وفرع)</h5>
              <p className="text-xs text-slate-500 mt-0.5">تخصيص كامل لبيانات الفروع، كود QR، الضريبة المضافة، والتصميم الطباعي</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
              <Building2 size={16} className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-600">الفرع المستهدف:</span>
              <select 
                value={selectedClinicId}
                onChange={(e) => handleClinicChange(e.target.value)}
                className="bg-transparent text-sm font-extrabold text-indigo-700 outline-none cursor-pointer"
              >
                {accessibleClinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body: Split Layout (Editor Left + Live Preview Right) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200">
          
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 p-6 overflow-y-auto space-y-6">
            
            {!isEditingAllowed && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs font-bold leading-relaxed font-[Cairo] animate-pulse">
                <Lock size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-extrabold text-rose-900 mb-0.5">🔒 ميزة تعديل بيانات وتفاصيل الفاتورة معطلة</div>
                  <div className="text-[10px] text-rose-700 font-medium">الرجاء مراجعة اشتراك النظام الخاص بك مع المطور لتفعيل ميزة التعديل والتخصيص الشامل لجميع فروعك ومراكزك.</div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'info'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={15} />
                بيانات المركز والفرع
              </button>

              <button
                onClick={() => setActiveTab('tax_qr')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'tax_qr'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Percent size={15} />
                الضريبة والـ QR كود
              </button>

              <button
                onClick={() => setActiveTab('template')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'template'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={15} />
                تخصيص وتصميم الفاتورة
              </button>
            </div>

            {/* Tab 1: Branch Info */}
            {activeTab === 'info' && (
              <div className="space-y-4 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الفرع / المركز</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-bold"
                      placeholder="مثال: مركز لمسة جمال التجميلي"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم الخبير / المشرف المسؤول</label>
                    <input 
                      type="text" 
                      value={docName} 
                      onChange={e => setDocName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600"
                      placeholder="مثال: أخصائية البشرة سارة أحمد"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الرقم الضريبي (Tax ID)</label>
                    <input 
                      type="text" 
                      value={taxId} 
                      onChange={e => setTaxId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-mono"
                      placeholder="مثال: 300123456700003"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم السجل التجاري (CR)</label>
                    <input 
                      type="text" 
                      value={commercialRegister} 
                      onChange={e => setCommercialRegister(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-mono"
                      placeholder="مثال: 1010897456"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم الواتساب وخدمة العملاء</label>
                    <input 
                      type="text" 
                      value={whatsappNumber} 
                      onChange={e => setWhatsappNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600"
                      placeholder="مثال: 966500000000"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العملة الأساسية للفرع</label>
                    <input 
                      type="text" 
                      value={currency} 
                      onChange={e => setCurrency(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-bold"
                      placeholder="SAR / EGP / USD"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفرع وموقعه</label>
                  <input 
                    type="text" 
                    value={invoiceAddress} 
                    onChange={e => setInvoiceAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600"
                    placeholder="مثال: الرياض - طريق الملك فهد - برج الراجحي - الدور الثاني"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">شعار المركز / الفرع المطبوع (ملف صورة)</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    {logoUrl ? (
                      <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center group">
                        <img src={logoUrl} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center text-white transition-opacity text-[10px] font-bold"
                        >
                          إزالة ❌
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 text-lg">
                        🖼️
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 2 * 1024 * 1024) {
                              alert('عذراً، حجم الصورة يجب ألا يتجاوز 2 ميجابايت لسرعة التحميل.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setLogoUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="invoice-logo-upload"
                      />
                      <label 
                        htmlFor="invoice-logo-upload"
                        className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        اختيار ملف صورة الشعار 📁
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1">يدعم صيغ JPG، PNG، WEBP (يتم تحويله وحفظه تلقائياً)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Tax & QR Code */}
            {activeTab === 'tax_qr' && (
              <div className="space-y-5 animate-in fade-in">
                
                {/* VAT Section */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <Percent size={16} className="text-indigo-600" />
                        تفعيل ضريبة القيمة المضافة (VAT)
                      </h6>
                      <p className="text-xs text-slate-500 mt-0.5">احتساب وإظهار النسبة الضريبية في الفواتير الصادرة</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showVat}
                        onChange={(e) => setShowVat(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {showVat && (
                    <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">نسبة الضريبة المضافة (%)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={vatRate} 
                            onChange={e => setVatRate(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-indigo-600 font-bold"
                          />
                          <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">طريقة احتساب الضريبة</label>
                        <select
                          value={pricesIncludeVat ? 'include' : 'add'}
                          onChange={(e) => setPricesIncludeVat(e.target.value === 'include')}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:border-indigo-600 font-bold"
                        >
                          <option value="include">الأسعار شاملة الضريبة تلقائياً</option>
                          <option value="add">إضافة الضريبة فوق سعر الخدمة</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* QR Code Section */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h6 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <QrCode size={16} className="text-indigo-600" />
                        تضمين رمز الاستجابة السريع (QR Code)
                      </h6>
                      <p className="text-xs text-slate-500 mt-0.5">توليد باركود تفاعلي متوافق مع الفواتير الإلكترونية المعتمدة</p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[-100%] rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {showQrCode && (
                    <div className="pt-3 border-t border-slate-200/60">
                      <label className="block text-xs font-bold text-slate-700 mb-1">نوع بيانات رمز الـ QR</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setQrType('zatca')}
                          className={`p-3 rounded-xl border text-right transition-all ${qrType === 'zatca' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                        >
                          <div className="text-xs font-bold">فاتورة إلكترونية ضريبية</div>
                          <div className="text-[11px] text-slate-500 mt-1">يحتوي اسم المنشأة، الرقم الضريبي، التاريخ، وإجمالي الضريبة والمبلغ</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setQrType('standard')}
                          className={`p-3 rounded-xl border text-right transition-all ${qrType === 'standard' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                        >
                          <div className="text-xs font-bold">رابط تواصل وواتساب سريع</div>
                          <div className="text-[11px] text-slate-500 mt-1">يفتح محادثة واتساب مع المركز مع رقم الفاتورة للعميل</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 3: Template & Custom Text */}
            {activeTab === 'template' && (
              <div className="space-y-4 animate-in fade-in">
                
                {/* Print Template Style */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">نوع قالب وتنسيق الطباعة</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setInvoiceType('pos80')}
                      className={`p-3.5 rounded-2xl border text-right transition-all ${invoiceType === 'pos80' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <Receipt size={16} className="text-indigo-600" />
                        إيصال كاشير حراري (80mm POS)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">مناسب لطابعات الفواتير الصغيرة السريعة عند الكاونتر</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setInvoiceType('a4')}
                      className={`p-3.5 rounded-2xl border text-right transition-all ${invoiceType === 'a4' ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold' : 'border-slate-200 bg-white text-slate-700'}`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <FileText size={16} className="text-indigo-600" />
                        فاتورة رسمية كاملة (A4 Standard)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">تصميم مكتبي رسمي واسع للطباعة على ورق A4</div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الفاتورة المطبوع</label>
                    <input 
                      type="text" 
                      value={invoiceTitle} 
                      onChange={e => setInvoiceTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">العنوان الفرعي (Subtitle)</label>
                    <input 
                      type="text" 
                      value={invoiceSubtitle} 
                      onChange={e => setInvoiceSubtitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الشروط وسياسة الاسترجاع (Terms)</label>
                  <textarea 
                    value={invoiceTerms} 
                    onChange={e => setInvoiceTerms(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-600 resize-none"
                    placeholder="شروط الضمان أو الاسترجاع..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">رسالة التذييل والشكر (Footer Message)</label>
                  <textarea 
                    value={invoiceFooter} 
                    onChange={e => setInvoiceFooter(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-600 resize-none"
                    placeholder="شكراً لزيارتكم ونتمنى لكم دوام الصحة والعافية..."
                  />
                </div>

                {/* Display Toggles */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
                  <h6 className="font-bold text-slate-800 text-xs mb-2">إظهار / إخفاء عناصر الفاتورة:</h6>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showClinicLogo} onChange={e => setShowClinicLogo(e.target.checked)} className="rounded text-indigo-600" />
                      <span>شعار المركز</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showHandler} onChange={e => setShowHandler(e.target.checked)} className="rounded text-indigo-600" />
                      <span>اسم الخبير / المنفذ</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showPaymentMethod} onChange={e => setShowPaymentMethod(e.target.checked)} className="rounded text-indigo-600" />
                      <span>طريقة الدفع</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showCustomerPhone} onChange={e => setShowCustomerPhone(e.target.checked)} className="rounded text-indigo-600" />
                      <span>هاتف العميل</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showDueBalance} onChange={e => setShowDueBalance(e.target.checked)} className="rounded text-indigo-600" />
                      <span>المبلغ المتبقي</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={showSignatureStamp} onChange={e => setShowSignatureStamp(e.target.checked)} className="rounded text-indigo-600" />
                      <span>خانة التوقيع والختم</span>
                    </label>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Live Preview Column (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-slate-100/70 flex flex-col items-center justify-start overflow-y-auto">
            <div className="w-full flex items-center justify-between mb-3 text-slate-600">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Eye size={15} className="text-indigo-600" />
                معاينة حية ومباشرة للفاتورة:
              </span>
              <span className="text-[11px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                {invoiceType === 'pos80' ? 'POS 80mm' : 'A4 Size'}
              </span>
            </div>

            {/* The Rendered Preview Paper */}
            <div 
              className={`bg-white rounded-2xl shadow-md border border-slate-200 text-slate-800 transition-all ${
                invoiceType === 'pos80' ? 'w-[320px] p-4 text-[11px]' : 'w-full max-w-[420px] p-6 text-[12.5px]'
              }`}
            >
              {/* Header */}
              <div className={`text-center border-b pb-3 mb-3 ${invoiceType === 'pos80' ? 'border-dashed border-slate-300' : 'border-slate-800'}`}>
                {showClinicLogo && logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="max-h-12 mx-auto mb-1.5 object-contain" />
                ) : null}
                <h4 className="font-extrabold text-slate-900 text-sm m-0">{name || 'اسم مركز التجميل أو الصالون'}</h4>
                {invoiceSubtitle && <div className="text-[11px] text-slate-500 font-semibold mt-0.5">{invoiceSubtitle}</div>}
                <div className="inline-block bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-[10px] font-bold text-slate-800 mt-1.5">
                  {invoiceTitle}
                </div>
              </div>

              {/* Branch & Invoice Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 text-[10.5px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">رقم الفاتورة:</span>
                  <span className="font-mono font-bold">#20260829</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">التاريخ:</span>
                  <span>{new Date().toLocaleDateString('ar-EG')}</span>
                </div>
                {taxId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الرقم الضريبي:</span>
                    <span className="font-mono font-bold">{taxId}</span>
                  </div>
                )}
                {commercialRegister && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">السجل التجاري:</span>
                    <span className="font-mono">{commercialRegister}</span>
                  </div>
                )}
                {invoiceAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">العنوان:</span>
                    <span className="truncate max-w-[150px]">{invoiceAddress}</span>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 text-[10.5px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">اسم العميل:</span>
                  <span className="font-bold text-slate-900">سارة عبدالله (مثال)</span>
                </div>
                {showCustomerPhone && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الهاتف:</span>
                    <span>0501234567</span>
                  </div>
                )}
                {showHandler && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">الخبير المنفذ:</span>
                    <span className="text-indigo-600 font-bold">أخصائية البشرة</span>
                  </div>
                )}
                {showPaymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">طريقة الدفع:</span>
                    <span>مدى / شبكة</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse mb-3 text-[10.5px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="p-1.5 text-right font-bold">الخدمة</th>
                    <th className="p-1.5 text-center font-bold">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-1.5">جلسة تنظيف بشرة هايدرافاشيل</td>
                    <td className="p-1.5 text-center font-bold">{(pricesIncludeVat ? sampleAmount : sampleSubtotal).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Totals & QR */}
              <div className="border-t border-slate-200 pt-2.5 space-y-1 text-[11px]">
                {showVat && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span>المبلغ قبل الضريبة:</span>
                      <span>{sampleSubtotal.toFixed(2)} {currency}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة ({vatRate}%):</span>
                      <span>{sampleVatAmount.toFixed(2)} {currency}</span>
                    </div>
                  </>
                )}

                <div className="flex justify-between font-extrabold text-slate-900 text-xs pt-1 border-t border-slate-300">
                  <span>الإجمالي المستحق:</span>
                  <span>{sampleGrandTotal.toFixed(2)} {currency}</span>
                </div>
              </div>

              {/* QR Code Preview */}
              {showQrCode && (
                <div className="text-center mt-3 pt-2 border-t border-dashed border-slate-200">
                  <img src={previewQrUrl} alt="QR" className="w-20 h-20 mx-auto border border-slate-200 p-1 rounded-lg bg-white" />
                  <span className="text-[9px] text-slate-400 block mt-1">فاتورة إلكترونية معتمدة</span>
                </div>
              )}

              {/* Terms */}
              {invoiceTerms && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-100 text-amber-800 rounded text-[9.5px] text-center">
                  {invoiceTerms}
                </div>
              )}

              {/* Footer */}
              <div className="text-center mt-3 text-[10px] text-slate-500 pt-2 border-t border-slate-200">
                <div>{invoiceFooter}</div>
                {whatsappNumber && <div className="font-bold text-slate-700 mt-0.5">واتساب: {whatsappNumber}</div>}
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4.5 px-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-5 py-2 text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors"
          >
            إلغاء
          </button>

          <button
            onClick={handleSave}
            disabled={!isEditingAllowed}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              isEditingAllowed 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-95' 
                : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-80'
            }`}
          >
            {isEditingAllowed ? <Save size={16} /> : <Lock size={16} />}
            {isEditingAllowed ? 'حفظ واعتماد التعديلات للفرع' : 'التعديل معطل ومقفل من المطور 🔒'}
          </button>
        </div>

      </div>
    </div>
  );
}
