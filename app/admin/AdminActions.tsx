import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AdminAction } from '@/lib/types';

export default function AdminActions() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchActions = async () => {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('performed_at', { ascending: false });
      if (!error && data) {
        setActions(data as AdminAction[]);
      } else if (error) {
        console.error('Failed to fetch admin actions:', error);
      }
      setLoading(false);
    };
    fetchActions();
  }, [supabase]);

  return (
    <motion.div
      key="admin-actions-tab"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-exo2 font-black text-white uppercase tracking-wider">
        Admin Actions Log
      </h2>
      {loading ? (
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Loader2 className="animate-spin" size={20} />
          <span>Loading actions…</span>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/5 bg-white/[0.01]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-xs font-rajdhani text-muted-foreground uppercase tracking-widest">
                <th className="p-4">Action</th>
                <th className="p-4">Request ID</th>
                <th className="p-4">Performed Via</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm font-rajdhani text-white">
              {actions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No admin actions recorded.
                  </td>
                </tr>
              ) : (
                actions.map((a) => (
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 capitalize text-purple-400">{a.action}</td>
                    <td className="p-4 break-all">{a.request_id}</td>
                    <td className="p-4 capitalize text-amber-400">{a.performed_via}</td>
                    <td className="p-4">
                      {new Date(a.performed_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {a.details ? JSON.stringify(a.details) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
