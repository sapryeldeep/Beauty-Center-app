import { useStore } from '../store/useStore';
import { ActivityLog } from '../types';

export type ActivityCategory = 'auth' | 'finance' | 'staff' | 'backup' | 'client' | 'system' | 'expense' | 'payroll';

export function recordActivityLog(
  clinicId: string,
  userName: string,
  action: string,
  details: string,
  category?: ActivityCategory
) {
  try {
    const store = useStore.getState();
    const currentLogs = store.data.activityLogs || [];
    
    const newLog: ActivityLog = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      clinicId: clinicId || 'master',
      userName: userName || 'مستخدم النظام',
      action,
      details: category ? `[${category}] ${details}` : details,
      timestamp: new Date().toISOString()
    };

    // Keep the latest 1000 logs
    const updatedLogs = [newLog, ...currentLogs].slice(0, 1000);
    store.updateData({ activityLogs: updatedLogs });
  } catch (err) {
    console.error('Failed to record activity log:', err);
  }
}
