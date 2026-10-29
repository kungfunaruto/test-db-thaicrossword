import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
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
  return (<div className="mx-auto max-w-md px-4 py-16"><div className="card animate-scale-in p-8">
    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-navy text-gold"><Lock className="h-6 w-6" /></span>
    <h1 className="mb-6 mt-4 text-2xl">เข้าสู่ระบบผู้ดูแล</h1>
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-medium">อีเมล<input name="email" type="email" required autoComplete="username" className="input mt-1" /></label>
      <label className="block text-sm font-medium">รหัสผ่าน<input name="password" type="password" required autoComplete="current-password" className="input mt-1" /></label>
      {err && <p role="alert" className="animate-fade-in rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      <button disabled={busy} className="btn-primary w-full">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</button>
    </form></div></div>);
}
