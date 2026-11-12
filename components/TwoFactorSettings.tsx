"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type Status = { enabled: boolean; verifiedAt: string | null };

export default function TwoFactorSettings() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState("");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState("");

  const loadStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/status");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load 2FA status");
      setStatus(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const startSetup = async () => {
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start 2FA setup");
      setSecret(data.secret);
      setOtpauthUri(data.otpauthUri);
      setRecoveryCodes([]);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const enable = async () => {
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enable 2FA");
      setRecoveryCodes(data.recoveryCodes || []);
      setSecret("");
      setOtpauthUri("");
      setCode("");
      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const disable = async () => {
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to disable 2FA");
      setDisableCode("");
      await loadStatus();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <div className="mt-8 text-sm text-gray-500">Loading 2FA settings...</div>;

  return (
    <section className="mt-8 bg-white rounded shadow-md border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-800">Two-Factor Authentication (2FA)</h2>
      <p className="text-sm text-gray-500 mt-1">เพิ่มความปลอดภัยด้วยแอป Authenticator</p>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {status?.enabled ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-green-700 font-medium">2FA เปิดใช้งานแล้ว</p>
          <input
            type="text"
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value)}
            placeholder="รหัส 2FA สำหรับปิดใช้งาน"
            className="w-full max-w-xs h-10 px-3 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={disable}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold"
          >
            ปิดใช้งาน 2FA
          </button>
        </div>
      ) : otpauthUri ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-700">สแกน QR ด้วยแอป Authenticator หรือกรอก secret ด้วยตนเอง:</p>
          <div className="bg-gray-50 p-4 inline-block rounded">
            <QRCodeSVG value={otpauthUri} size={180} />
          </div>
          <p className="text-xs font-mono break-all bg-gray-100 p-2 rounded">{secret}</p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="กรอกรหัส 6 หลัก"
            className="w-full max-w-xs h-10 px-3 border border-gray-200 rounded text-sm"
          />
          <button
            onClick={enable}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold"
          >
            ยืนยันเปิดใช้งาน
          </button>
          {recoveryCodes.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-bold text-gray-700">Recovery codes (เก็บไว้อย่างปลอดภัย):</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                {recoveryCodes.map((item) => (
                  <li key={item} className="bg-gray-100 p-2 rounded">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <button
            onClick={startSetup}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold"
          >
            เปิดใช้งาน 2FA
          </button>
          {recoveryCodes.length > 0 && (
            <div>
              <p className="text-sm font-bold text-gray-700">Recovery codes:</p>
              <ul className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                {recoveryCodes.map((item) => (
                  <li key={item} className="bg-gray-100 p-2 rounded">{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
