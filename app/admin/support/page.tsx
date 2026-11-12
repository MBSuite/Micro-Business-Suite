"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Send, AlertCircle } from "lucide-react";

type Thread = {
  id: number;
  channel_id: number;
  provider: string;
  channel_name: string;
  external_thread_id_hint: string;
  subject: string | null;
  status: "open" | "pending" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  assignee_user_id: number | null;
  message_count: number;
  last_message: string;
  last_message_at: string;
  created_at: string;
};

type Message = {
  id: number;
  direction: "in" | "out";
  author_user_id: number | null;
  body: string;
  delivery_status: string | null;
  created_at: string;
};

type ThreadDetail = {
  thread: Thread;
  messages: Message[];
};

const statusBadgeClass = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "pending":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "closed":
      return "bg-slate-100 text-slate-800 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200";
  }
};

const priorityBadgeClass = (priority: string) => {
  switch (priority) {
    case "low":
      return "bg-green-100 text-green-800 border border-green-200";
    case "normal":
      return "bg-slate-100 text-slate-800 border border-slate-200";
    case "high":
      return "bg-orange-100 text-orange-800 border border-orange-200";
    case "urgent":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200";
  }
};

function InboxList({
  threads,
  loading,
  onSelectThread,
}: {
  threads: Thread[];
  loading: boolean;
  onSelectThread: (threadId: number) => void;
}) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="text-center py-12 text-slate-500">กำลังโหลด...</div>
      ) : threads.length === 0 ? (
        <div className="text-center py-12 text-slate-500">ไม่มี thread</div>
      ) : (
        threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className="bg-white border border-slate-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-semibold text-slate-600">{thread.provider}</span>
                  <span className="text-xs text-slate-400 font-mono">{thread.external_thread_id_hint}</span>
                </div>
                <p className="text-sm font-semibold text-slate-900 mb-1">{thread.channel_name}</p>
                <p className="text-sm text-slate-600 line-clamp-2">{thread.last_message}</p>
                <div className="flex gap-2 mt-2 text-xs text-slate-500">
                  <span>{thread.message_count} ข้อความ</span>
                  <span>{new Date(thread.last_message_at).toLocaleString("th-TH")}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${statusBadgeClass(thread.status)}`}>
                  {thread.status}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded ${priorityBadgeClass(thread.priority)}`}>
                  {thread.priority}
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function ThreadDetail({
  data,
  loading,
  onReply,
  replying,
  onStatusChange,
  onPriorityChange,
  onBack,
}: {
  data: ThreadDetail | null;
  loading: boolean;
  onReply: (text: string) => Promise<void>;
  replying: boolean;
  onStatusChange: (status: string) => Promise<void>;
  onPriorityChange: (priority: string) => Promise<void>;
  onBack: () => void;
}) {
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data?.messages]);

  if (loading) {
    return <div className="text-center py-12 text-slate-500">กำลังโหลด...</div>;
  }

  if (!data) {
    return null;
  }

  const { thread, messages } = data;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setReplyError("");
    try {
      await onReply(replyText);
      setReplyText("");
    } catch (error) {
      setReplyError(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft size={20} />
        กลับไปยังรายชื่อ
      </button>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{thread.channel_name}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-mono text-xs">{thread.external_thread_id_hint}</span>
              <span>•</span>
              <span>{thread.message_count} ข้อความ</span>
              <span>•</span>
              <span>{new Date(thread.created_at).toLocaleString("th-TH")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <select
              value={thread.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className={`text-xs font-bold px-3 py-1 rounded border cursor-pointer ${statusBadgeClass(thread.status)}`}
            >
              <option value="open">open</option>
              <option value="pending">pending</option>
              <option value="closed">closed</option>
            </select>
            <select
              value={thread.priority}
              onChange={(e) => onPriorityChange(e.target.value)}
              className={`text-xs font-bold px-3 py-1 rounded border cursor-pointer ${priorityBadgeClass(thread.priority)}`}
            >
              <option value="low">low</option>
              <option value="normal">normal</option>
              <option value="high">high</option>
              <option value="urgent">urgent</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 mb-6 max-h-96 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.direction === "out" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${msg.direction === "out" ? "bg-indigo-100 text-slate-900" : "bg-slate-100 text-slate-900"
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  {new Date(msg.created_at).toLocaleTimeString("th-TH")}
                  {msg.direction === "out" && msg.delivery_status && (
                    <>
                      <span>•</span>
                      <span
                        className={
                          msg.delivery_status === "sent" ? "text-green-600" : "text-red-600"
                        }
                      >
                        {msg.delivery_status === "sent" ? "ส่งแล้ว" : "ส่งไม่สำเร็จ"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {replyError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded flex items-center gap-2">
            <AlertTriangle size={16} />
            {replyError}
          </div>
        )}

        <div className="space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="พิมพ์ตอบกลับ..."
            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={3}
            disabled={replying}
          />
          <button
            onClick={handleReply}
            disabled={replying || !replyText.trim()}
            className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {replying ? "กำลังส่ง..." : "ส่ง"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SupportInboxPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replying, setReplying] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Load inbox list
  const loadThreads = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/support/threads?status=open&limit=50");
      if (res.status === 403) {
        setPermissionDenied(true);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        throw new Error("โหลดรายชื่อไม่สำเร็จ");
      }
      const data = await res.json();
      setThreads(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // Load thread detail
  const loadThreadDetail = async (threadId: number) => {
    setThreadLoading(true);
    try {
      const res = await fetch(`/api/support/threads/${threadId}`);
      if (!res.ok) {
        throw new Error("โหลดข้อมูล thread ไม่สำเร็จ");
      }
      const data = await res.json();
      setThreadDetail(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setSelectedThreadId(null);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleSelectThread = (threadId: number) => {
    setSelectedThreadId(threadId);
    loadThreadDetail(threadId);
  };

  const handleReply = async (text: string) => {
    if (!selectedThreadId) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/threads/${selectedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ส่งตอบกลับไม่สำเร็จ");
      }

      const data = await res.json();
      if (!data.data.delivered) {
        throw new Error("บันทึกแล้วแต่ส่งไม่สำเร็จ (ตรวจสอบการตั้งค่า LINE)");
      }

      // Reload thread to show new message
      await loadThreadDetail(selectedThreadId);
      await loadThreads();
    } catch (err) {
      throw err;
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedThreadId) return;
    try {
      const res = await fetch(`/api/support/threads/${selectedThreadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error("เปลี่ยน status ไม่สำเร็จ");
      }

      await loadThreadDetail(selectedThreadId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  const handlePriorityChange = async (priority: string) => {
    if (!selectedThreadId) return;
    try {
      const res = await fetch(`/api/support/threads/${selectedThreadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });

      if (!res.ok) {
        throw new Error("เปลี่ยน priority ไม่สำเร็จ");
      }

      await loadThreadDetail(selectedThreadId);
      await loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadThreads();
    };
    void init();
  }, []);

  if (permissionDenied) {
    return (
      <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-red-200 p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">ไม่มีสิทธิ์เข้าถึง</h1>
            <p className="text-slate-600">คุณไม่มีสิทธิ์ในการเข้าถึง Support Inbox</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 min-h-screen bg-[#fcfaff]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Support Inbox</h1>
          <p className="text-slate-500 mt-1">จัดการข้อความลูกค้า</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-white rounded-lg border border-slate-200 p-6 max-h-96 overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-4">รายชื่อ</h2>
            <InboxList
              threads={threads}
              loading={loading}
              onSelectThread={handleSelectThread}
            />
          </div>

          <div className="col-span-2">
            {selectedThreadId ? (
              <ThreadDetail
                data={threadDetail}
                loading={threadLoading}
                onReply={handleReply}
                replying={replying}
                onStatusChange={handleStatusChange}
                onPriorityChange={handlePriorityChange}
                onBack={() => {
                  setSelectedThreadId(null);
                  setThreadDetail(null);
                }}
              />
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
                เลือก thread เพื่อดูรายละเอียด
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
