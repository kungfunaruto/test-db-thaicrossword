import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../services/adminService';
export default function AdminLoginPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return;
    const f = new FormData(e.currentTarget); setBusy(true); setErr(null);
    const { error } = await signIn(String(f.get('email')), String(f.get('password')));
    setBusy(false);
    if (error) setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง'); else nav('/admin');
  }
  return (<div className="mx-auto max-w-sm px-4 py-16"><h1 className="mb-6 text-2xl">เข้าสู่ระบบผู้ดูแล</h1>
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">อีเมล<input name="email" type="email" required autoComplete="username" className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
      <label className="block text-sm">รหัสผ่าน<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded border border-slate-300 p-2" /></label>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="w-full rounded bg-navy px-4 py-2 font-medium text-white disabled:opacity-60">{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
    </form></div>);
}
