import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import React from 'react';
import { Download, Printer, FileText } from 'lucide-react';
import { exportToExcel, exportHTMLToPDF, printElement } from '../utils/exportUtils';

interface ExportButtonsProps {
  data: any[];
  pdfHeaders: string[];
  pdfData: any[][];
  filename: string;
  title: string;
  printElementId: string;
}

export function ExportButtons({ data, pdfHeaders, pdfData, filename, title, printElementId }: ExportButtonsProps) {

  const { data: storeData, currentUser } = useStore();
  const { currentClinicId } = useClinicContext();
  const currentClinic = storeData.clinics.find(c => c.id === currentClinicId);

  const getCenterForUser = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'master_admin') return currentUser;
    const clinic = storeData.clinics.find(c => c.id === currentUser.clinicId);
    if (!clinic) return null;
    return storeData.users.find(u => u.role === 'master_admin' && u.user === clinic.masterAdminId);
  };

  const center = getCenterForUser();
  const isExcelDisabled = currentUser?.role !== 'developer' && center?.permissions?.devDisableExportExcel === true;
  const isPdfDisabled = currentUser?.role !== 'developer' && center?.permissions?.devDisableExportPDF === true;

  return (
    <div className="flex items-center gap-2 no-print">
      <button 
        onClick={() => printElement(printElementId, title)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-bold transition-colors"
        title="طباعة / حفظ كملف PDF"
      >
        <Printer size={16} /> طباعة
      </button>
      {!isExcelDisabled && (
        <button 
          onClick={() => exportToExcel(data, filename)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition-colors"
          title="تصدير كملف إكسيل"
        >
          <Download size={16} /> إكسيل
        </button>
      )}
      {!isPdfDisabled && (
        <button 
          onClick={() => exportHTMLToPDF(printElementId, filename, currentClinic, title)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors"
          title="تصدير PDF"
        >
          <FileText size={16} /> PDF
        </button>
      )}
    </div>
  );
}
