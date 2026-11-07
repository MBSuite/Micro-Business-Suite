/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

type LogRow = {
  id: number;
  idempotency_key: string;
  event: string;
  company_id: number;
  status: string;
  result: any;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export default function AdminBridgeSyncPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [events, setEvents] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("limit", String(limit));
      params.set("offset", String(offset));
      if (statusFilter) params.set("status", statusFilter);
      if (eventFilter) params.set("event", eventFilter);
      const res = await fetch(`/api/admin/bridge-sync?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "โหลดข้อมูลไม่สำเร็จ");
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setStatuses(data.filters?.statuses || []);
      setEvents(data.filters?.events || []);
    } catch (e: any) {
      setError(e?.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset, statusFilter, eventFilter]);

  const statusColor = (s: string) => {
    if (s === "success") return "text-green-600";
    if (s === "failed") return "text-red-600";
    if (s === "pending") return "text-yellow-600";
    return "text-gray-600";
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bridge Sync Log</h1>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-gray-50"
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          รีเฟรช
        </button>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-3 flex-wrap">
        <select
          value={statusFilter}
          onChange={(e) => { setOffset(0); setStatusFilter(e.target.value); }}
          className="border rounded px-2 py-1"
        >
          <option value="">ทุกสถานะ</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={eventFilter}
          onChange={(e) => { setOffset(0); setEventFilter(e.target.value); }}
          className="border rounded px-2 py-1"
        >
          <option value="">ทุก event</option>
          {events.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500 self-center">
          รวม {total} รายการ
        </span>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Idempotency Key</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-left">Detail</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">กำลังโหลด...</td></tr>
            )}
            {!loading && logs.length === 0 && (
              <tr><td colSpan={7} className="px-3 py-4 text-center text-gray-500">ไม่มีข้อมูล</td></tr>
            )}
            {!loading && logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="px-3 py-2">{log.id}</td>
                <td className="px-3 py-2">{log.event}</td>
                <td className="px-3 py-2">{log.company_id}</td>
                <td className={`px-3 py-2 font-medium ${statusColor(log.status)}`}>{log.status}</td>
                <td className="px-3 py-2 font-mono text-xs">{log.idempotency_key}</td>
                <td className="px-3 py-2 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    className="text-blue-600 hover:underline text-xs"
                  >
                    {expanded === log.id ? "ซ่อน" : "ดู"}
                  </button>
                  {expanded === log.id && (
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded max-w-md overflow-auto">
                      {JSON.stringify({ result: log.result, error: log.error }, null, 2)}
                    </pre>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          ก่อนหน้า
        </button>
        <span className="text-sm">หน้า {currentPage} / {totalPages}</span>
        <button
          onClick={() => setOffset(offset + limit)}
          disabled={offset + limit >= total}
          className="px-3 py-1 border rounded disabled:opacity-50"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
}
