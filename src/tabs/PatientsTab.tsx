import { useState } from 'react';
import { useStore } from '../store/useStore';
import { useClinicContext } from '../hooks/useClinicContext';
import { Users, Phone, Star, FileText, Plus, Trash2, ShieldAlert } from 'lucide-react';

export default function PatientsTab() {
  const { data, updateData } = useStore();
  const { currentClinicId, currentCurrency, getCombinedAllRecords } = useClinicContext();
  
  const records = getCombinedAllRecords();
  const beautyNotes = data.beautyNotesStore || {};
  
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  // Group by patient
  const uniquePatients: Record<string, { name: string, phone: string, total: number, paid: number, due: number, points: number }> = {};
  records.forEach(r => {
    if (!uniquePatients[r.name]) {
      uniquePatients[r.name] = { name: r.name, phone: r.phone, total: 0, paid: 0, due: 0, points: 0 };
    }
    uniquePatients[r.name].total += r.total || 0;
    uniquePatients[r.name].paid += r.paid || 0;
    uniquePatients[r.name].due += (r.total || 0) - (r.paid || 0);
  });

  Object.values(uniquePatients).forEach(p => {
    p.points = Math.floor(p.paid / 100); // 1 point for every 100
  });

  const filteredPatients = Object.values(uniquePatients).filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search)
  );

  const pVisits = selectedPatient ? records.filter(x => x.name === selectedPatient) : [];
  const selectedPatientData = selectedPatient ? uniquePatients[selectedPatient] : null;

  const handleNotesChange = (val: string) => {
    if (!selectedPatient) return;
    updateData({
      beautyNotesStore: { ...beautyNotes, [selectedPatient]: val }
    });
  };

  const handlePayExtra = () => {
    if (!selectedPatient) return;
    const amtStr = prompt(`أدخل المبلغ المحصل من العميل (${selectedPatient}):`);
    if (!amtStr || isNaN(Number(amtStr))) return;
    
    let rem = Math.max(0, parseFloat(amtStr));
    
    const newQueue = [...(data.queue[currentClinicId] || [])];
    const newArchive = [...(data.archive[currentClinicId] || [])];
    
    const payLogic = (arr: any[]) => {
      arr.forEach(p => {
        let due = (p.total || 0) - (p.paid || 0);
        if(p.name === selectedPatient && due > 0 && rem > 0) {
          let pay = Math.min(due, rem);
          p.paid += pay;
          p.due = (p.total || 0) - p.paid;
          rem -= pay;
        }
      });
    };
    
    payLogic(newQueue);
    payLogic(newArchive);
    
    updateData({
      queue: { ...data.queue, [currentClinicId]: newQueue },
      archive: { ...data.archive, [currentClinicId]: newArchive }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Directory list */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
          <div className="flex justify-between items-center mb-4">
            <h6 className="font-bold text-indigo-600 m-0">دليل العملاء ونقاط الولاء</h6>
          </div>
          <input 
            type="text" 
            placeholder="بحث بالاسم أو الهاتف..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-600 mb-4"
          />
          
          <div className="overflow-y-auto max-h-[500px] space-y-2">
            {filteredPatients.length === 0 ? (
              <div className="text-center text-slate-400 py-4 text-sm">لا يوجد عملاء</div>
            ) : filteredPatients.map((p, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedPatient(p.name)}
                className={`p-3 border rounded-xl cursor-pointer transition-colors flex justify-between items-center ${selectedPatient === p.name ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-300'}`}
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.phone || '--'}</div>
                </div>
                <div className="text-left">
                  <div className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mb-1">{p.points} نقطة</div>
                  {p.due > 0 && <div className="text-xs text-red-500 font-bold">آجل: {p.due}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Patient Profile */}
      <div className="lg:col-span-8">
        {!selectedPatientData ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 h-full flex flex-col items-center justify-center text-slate-400">
            <Users size={48} className="mb-4 opacity-50" />
            <h6>اختر عميلاً من القائمة لعرض سجله ونقاط الولاء.</h6>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-100 pb-4 mb-4 gap-4">
              <div>
                <h4 className="font-bold text-indigo-600 text-xl m-0">{selectedPatientData.name}</h4>
                <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Phone size={14} /> {selectedPatientData.phone}</span>
                  <span className="flex items-center gap-1 text-green-600 font-bold"><Star size={14} /> رصيد: {selectedPatientData.points} نقطة</span>
                </div>
              </div>
              <div className="flex gap-2">
                {selectedPatientData.due > 0 && (
                  <button onClick={handlePayExtra} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors">
                    تحصيل متبقي
                  </button>
                )}
              </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl mb-6">
              <h6 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                <ShieldAlert size={16} className="text-indigo-600" />
                تفضيلات العميل / نوع بشرة / ملاحظات
              </h6>
              <textarea 
                value={beautyNotes[selectedPatient] || ''}
                onChange={e => handleNotesChange(e.target.value)}
                placeholder="ملاحظات حساسية، نوع البشرة، أو طلبات خاصة..."
                className="w-full bg-white border border-indigo-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-600"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">المطلوب</div>
                <div className="font-bold text-slate-800">{selectedPatientData.total}</div>
              </div>
              <div className="p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="text-xs text-slate-500 mb-1">المدفوع</div>
                <div className="font-bold text-green-600">{selectedPatientData.paid}</div>
              </div>
              <div className="p-3 border border-red-100 rounded-xl bg-red-50">
                <div className="text-xs text-red-500 mb-1">المتبقي (آجل)</div>
                <div className="font-bold text-red-600">{selectedPatientData.due}</div>
              </div>
            </div>

            <h6 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <FileText size={16} />
              سجل الجلسات والفواتير
            </h6>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="p-2">التاريخ</th>
                    <th className="p-2">الخدمات</th>
                    <th className="p-2">الدفع</th>
                    <th className="p-2">المسؤول</th>
                    <th className="p-2">المطلوب</th>
                    <th className="p-2">المدفوع</th>
                    <th className="p-2">المتبقي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pVisits.map((v, i) => {
                    const d = (v.total || 0) - (v.paid || 0);
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-500">{v.isoDate || v.date}</td>
                        <td className="p-2 font-medium">{v.service}</td>
                        <td className="p-2"><span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">{v.payMethod}</span></td>
                        <td className="p-2 text-slate-500">{v.handler}</td>
                        <td className="p-2">{v.total}</td>
                        <td className="p-2 text-green-600 font-bold">{v.paid}</td>
                        <td className={`p-2 font-bold ${d > 0 ? 'text-red-500' : 'text-slate-400'}`}>{d}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
