/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import DashboardTab from './tabs/DashboardTab';
import FinanceTab from './tabs/FinanceTab';
import PatientsTab from './tabs/PatientsTab';
import ServicesTab from './tabs/ServicesTab';
import ClinicsTab from './tabs/ClinicsTab';
import SettingsTab from './tabs/SettingsTab';
import AppointmentsTab from './tabs/AppointmentsTab';
import InventoryTab from './tabs/InventoryTab';
import PayrollTab from './tabs/PayrollTab';
import StaffTab from './tabs/StaffTab';
import ArchiveTab from './tabs/ArchiveTab';
import { Appointment } from './types';
import { CheckCircle, Sparkles } from 'lucide-react';

export default function App() {
  const { currentUser, isPublicBooking, activeTab, data, updateData } = useStore();
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bDate, setBDate] = useState(new Date().toISOString().split('T')[0]);
  const [bTime, setBTime] = useState('15:00');
  const [bService, setBService] = useState('');
  const [bSuccess, setBSuccess] = useState(false);

  const language = useStore(state => state.data.settings?.language) || 'ar';
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const handlePublicBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName || !bPhone || !bDate || !bTime) {
      alert('يرجى استكمال جميع البيانات المطلوبة');
      return;
    }

    // Read clinicId from query string
    const urlParams = new URLSearchParams(window.location.search);
    const urlClinicId = urlParams.get('clinicId');
    const targetClinicId = urlClinicId && data.clinics.some(c => c.id === urlClinicId)
      ? urlClinicId
      : (data.clinics[0]?.id || 'master');

    const currentAppointments = data.appointments?.[targetClinicId] || [];

    const newApp: Appointment = {
      id: Date.now(),
      name: bName,
      phone: bPhone,
      date: bDate,
      time: bTime,
      service: bService || 'حجز موعد أونلاين'
    };

    updateData({
      appointments: {
        ...(data.appointments || {}),
        [targetClinicId]: [newApp, ...currentAppointments]
      }
    });

    setBSuccess(true);
  };

  if (isPublicBooking) {
    const urlParams = new URLSearchParams(window.location.search);
    const urlClinicId = urlParams.get('clinicId');
    const matchedClinic = data.clinics.find(c => c.id === urlClinicId) || data.clinics[0];
    const clinicName = matchedClinic ? matchedClinic.name : 'مركز العناية والتجميل';

    return (
      <div className="min-h-screen flex items-center justify-center p-4 font-[Cairo] bg-[#F1F5F9]" dir={dir}>
        <div className="bg-white rounded-3xl p-8 shadow-sm max-w-lg w-full text-center border border-slate-200">
          <div className="text-indigo-600 mb-4 flex justify-center">
            <span className="text-4xl">✨</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">بوابة حجز موعد جلسة أونلاين</h3>
          <p className="text-indigo-600 font-extrabold text-sm mb-4">📍 {clinicName}</p>
          <p className="text-slate-500 text-xs mb-6">اختر الموعد المناسب، وسيتم تأكيد حجزك فوراً وإرساله لفريق العمل بالفرع</p>
          
          {bSuccess ? (
            <div className="py-8 space-y-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={36} />
              </div>
              <h4 className="text-xl font-bold text-slate-900">تم تسجيل حجزك بنجاح!</h4>
              <p className="text-sm text-slate-600">
                شكراً لك يا <span className="font-bold text-indigo-600">{bName}</span>، موعدك مسجل بتاريخ <span className="font-bold">{bDate}</span> في تمام <span className="font-bold">{bTime}</span>.
              </p>
              <button 
                onClick={() => {
                  setBSuccess(false);
                  setBName('');
                  setBPhone('');
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors mt-4"
              >
                حجز موعد آخر
              </button>
            </div>
          ) : (
            <form onSubmit={handlePublicBookingSubmit} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">اسم العميل(ة) الثلاثي</label>
                <input 
                  type="text" 
                  value={bName} 
                  onChange={e => setBName(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-600" 
                  placeholder="أدخل اسمك الكريم..." 
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">رقم الهاتف (للتواصل وتأكيد الحجز)</label>
                <input 
                  type="text" 
                  value={bPhone} 
                  onChange={e => setBPhone(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-600" 
                  placeholder="01xxxxxxxxx" 
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تاريخ الجلسة</label>
                  <input 
                    type="date" 
                    value={bDate} 
                    onChange={e => setBDate(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-600" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">التوقيت المفضل</label>
                  <input 
                    type="time" 
                    value={bTime} 
                    onChange={e => setBTime(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-600" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">الخدمة المطلوبة (اختياري)</label>
                <select 
                  value={bService} 
                  onChange={e => setBService(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-600"
                >
                  <option value="">اختر الخدمة أو الباقة...</option>
                  {data.services.map((s, idx) => (
                    <option key={idx} value={s.name}>{s.name} ({s.price} {data.clinics[0]?.currency || 'EGP'})</option>
                  ))}
                </select>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl py-3 mt-2 shadow-sm transition-colors"
              >
                إرسال وتأكيد الحجز
              </button>
              
              <div className="text-center mt-6">
                <button 
                  type="button"
                  onClick={() => window.location.href = '/'}
                  className="text-sm text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  دخول الإدارة والموظفين
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardTab />;
      case 'archive': return <ArchiveTab />;
      case 'patients': return <PatientsTab />;
      case 'appointments': return <AppointmentsTab />;
      case 'finance': return <FinanceTab />;
      case 'beauty-services': return <ServicesTab />;
      case 'beauty-inventory': return <InventoryTab />;
      case 'payroll': return <PayrollTab />;
      case 'clinics': return <ClinicsTab />;
      case 'doc-staff': return <StaffTab />;
      case 'dev-panel': {
        const isDeveloper = currentUser && currentUser.role === 'developer' && currentUser.user === 'sapry eldeep';
        if (!isDeveloper) {
          return <DashboardTab />;
        }
        return <SettingsTab />;
      }
      default: return <DashboardTab />;
    }
  };

  return (
    <Layout>
      {renderTab()}
    </Layout>
  );
}
