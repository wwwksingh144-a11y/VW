import { requireAdmin } from '@/lib/auth/rbac';
import { ShieldCheck, Calendar, User, Activity, Monitor, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

async function getLogs(token: string) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/api/admin/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      cache: 'no-store'
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    return [];
  }
}

export default async function AuditLogsPage() {
  const admin = await requireAdmin(['Developer']);
  
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  const logs = await getLogs(token!);

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-navy-950">Security Audit Logs</h1>
          <p className="text-navy-500 mt-2">Immutable record of all administrative actions and security events.</p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-navy-400" />
            <input type="text" placeholder="Search logs..." className="w-full sm:w-auto pl-9 pr-4 py-2 border border-navy-200 rounded-lg text-sm outline-none focus:border-bronze-500 bg-white" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-navy-200 rounded-lg text-sm bg-white hover:bg-warm-50 text-navy-700 transition-colors shadow-sm w-full sm:w-auto justify-center">
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </header>

      <div className="bg-white border border-navy-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-navy-600">
            <thead className="bg-warm-50/80 border-b border-navy-200 text-xs font-mono uppercase tracking-wider text-navy-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Admin / Role</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Resource</th>
                <th className="px-6 py-4 font-semibold">IP / Device</th>
                <th className="px-6 py-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-warm-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-navy-400" />
                      <span className="font-medium text-navy-900">{format(new Date(log.timestamp), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="text-xs text-navy-400 mt-1 ml-6">{format(new Date(log.timestamp), 'HH:mm:ss')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-navy-400" />
                      <span className="font-medium text-navy-900">{log.adminName || 'System'}</span>
                    </div>
                    <div className="text-xs text-navy-400 mt-1 ml-6">{log.adminEmail || 'N/A'} • {log.role || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-navy-50 border border-navy-200/60 font-mono text-xs text-navy-700">
                      <Activity className="h-3.5 w-3.5 text-bronze-500" />
                      {log.action}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-navy-800">{log.resourceType || '-'}</div>
                    <div className="text-xs font-mono text-navy-400 mt-1">{log.resourceId || ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-navy-700">
                      <Monitor className="h-4 w-4 text-navy-400" />
                      {log.ipAddress || 'Unknown IP'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium">
                        Success
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-medium w-fit">
                          Failed
                        </span>
                        {log.failureReason && <span className="text-[10px] text-red-500">{log.failureReason}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-navy-500">
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
