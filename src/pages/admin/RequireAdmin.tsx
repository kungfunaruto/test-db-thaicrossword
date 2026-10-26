import { Navigate, Outlet } from 'react-router-dom';
import { useAdminGuard } from '../../hooks/useAdminGuard';
import { LoadingState } from '../../components/common/States';
import { signOut } from '../../services/adminService';
/** UX guard only. Real enforcement is RLS + public.is_admin() in the database. */
export default function RequireAdmin() {
  const s = useAdminGuard();
  if (s === 'loading') return <LoadingState />;
  if (s === 'anonymous') return <Navigate to="/admin/login" replace />;
  if (s === 'forbidden') return (<div className="mx-auto max-w-md px-4 py-16 text-center"><h1 className="text-2xl">ไม่มีสิทธิ์เข้าถึง</h1>
    <p className="mt-2 text-muted">บัญชีนี้ไม่ได้รับสิทธิ์ผู้ดูแลระบบ</p><button className="mt-4 underline" onClick={() => signOut()}>ออกจากระบบ</button></div>);
  return <Outlet />;
}
