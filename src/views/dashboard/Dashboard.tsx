import { type FC, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Users, Loader2, ArrowRight, FileSearch, KeyRound, AlertTriangle,
} from 'lucide-react';
import { useManageUsersStore } from './admin/manage_users/stores/user_store';
import { useUser } from '@/hooks/useUser';
import AdminApi from '@/infra/admin/admin_api';
import type { IParseLogStatsInProgress } from '@/infra/api/interfaces/IParseLog';
import AnalyticsOverviewSection from './admin/analytics/AnalyticsOverviewSection';
import CvhtStatsSection from './admin/analytics/CvhtStatsSection';
import KnowledgeMapSection from './admin/analytics/KnowledgeMapSection';
import ReportSection from './admin/analytics/ReportSection';
import CSS from './admin/analytics/adminDashboard.styles';

const formatDate = () =>
  new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

// ── Sub-components ─────────────────────────────────────────────────────────────
export const StatCard: FC<{
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  loading?: boolean;
  tint?: string;
  ink?: string;
}> = ({ label, value, sub, icon, loading, tint = 'rgba(47,107,63,0.1)', ink = '#2F6B3F' }) => (
  <div className="ad-stat-card">
    <div style={{ width: 42, height: 42, borderRadius: 12, background: tint, color: ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500, margin: 0 }}>{label}</p>
      {loading ? (
        <Loader2 style={{ width: 18, height: 18, marginTop: 5, animation: 'ad-spin 1s linear infinite', color: '#94a3b8' }} />
      ) : (
        <p style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '1px 0 0', letterSpacing: '-0.02em' }}>{value}</p>
      )}
      {sub && <p style={{ fontSize: '0.7rem', color: ink, fontWeight: 600, margin: '2px 0 0' }}>{sub}</p>}
    </div>
  </div>
);

const QuickLink: FC<{ label: string; sub: string; icon: React.ReactNode; grad: string; glow: string; onClick: () => void }> = ({ label, sub, icon, grad, glow, onClick }) => (
  <button onClick={onClick} className="ad-quicklink">
    <div style={{ width: 40, height: 40, borderRadius: 11, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 4px 10px ${glow}` }}>
      {icon}
    </div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <p style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{label}</p>
      <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '2px 0 0' }}>{sub}</p>
    </div>
    <ArrowRight size={16} color="#94a3b8" style={{ flexShrink: 0 }} />
  </button>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard: FC = () => {
  const navigate = useNavigate();
  const { profile } = useUser();

  const {
    meta: userMeta,
    isLoading: isUserLoading,
    fetchUsers,
  } = useManageUsersStore();

  const [inProgressStats, setInProgressStats] = useState<IParseLogStatsInProgress | null>(null);

  useEffect(() => {
    fetchUsers({ page: 1, per_page: 1 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    AdminApi.getParseLogStats()
      .then(res => setInProgressStats(res.data.in_progress))
      .catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <style>{CSS}</style>

      {/* ── Hero header ── */}
      <div className="ad-hero" style={{ background: 'linear-gradient(120deg,#14532d 0%,#1e4429 45%,#2F6B3F 100%)' }}>
        <div style={{ position: 'absolute', top: -50, right: -20, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ position: 'absolute', bottom: -70, right: 90, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative' }}>
          <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Xin chào, {profile?.name ?? 'Admin'} 👋
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'rgba(255,255,255,0.82)' }}>{formatDate()}</p>
        </div>
      </div>

      {/* ── Cảnh báo file parse bị treo ── */}
      {!!inProgressStats?.stuck && (
        <button
          onClick={() => navigate('/admin/dashboard/parse-logs?tab=in_progress')}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
            padding: '14px 18px', borderRadius: 14, border: '1px solid #fecaca',
            background: 'linear-gradient(120deg,#fef2f2,#fee2e2)', fontFamily: 'inherit',
          }}
        >
          <AlertTriangle size={20} color="#dc2626" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 800, color: '#991b1b', fontSize: '0.86rem' }}>
              {inProgressStats.stuck} file đang bị treo khi xử lý (quá 20 phút)
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: '#b91c1c' }}>
              Worker xử lý file có thể đã dừng — bấm để xem chi tiết và kiểm tra Supervisor.
            </p>
          </div>
          <ArrowRight size={16} color="#dc2626" style={{ flexShrink: 0 }} />
        </button>
      )}

      {/* ── Stat cards ── */}
      <div className="ad-stats-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        <StatCard
          label="Tổng người dùng"
          value={userMeta.total.toLocaleString()}
          sub="tài khoản hệ thống"
          icon={<Users size={19} />}
          loading={isUserLoading}
          tint="#eef2ff" ink="#4f46e5"
        />
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
        <QuickLink
          label="Quản lý tài khoản"
          sub="Xem, thêm, sửa tài khoản người dùng"
          icon={<Users size={18} color="white" />}
          grad="linear-gradient(135deg,#1e3a8a,#2563eb)"
          glow="rgba(37,99,235,0.3)"
          onClick={() => navigate('/admin/dashboard/manage-users')}
        />
        <QuickLink
          label="Nhật ký xử lý"
          sub="Theo dõi các lần parse tài liệu"
          icon={<FileSearch size={18} color="white" />}
          grad="linear-gradient(135deg,#6d28d9,#7c3aed)"
          glow="rgba(124,58,237,0.3)"
          onClick={() => navigate('/admin/dashboard/parse-logs')}
        />
        <QuickLink
          label="API key LlamaParse"
          sub="Quản lý key dùng để parse tài liệu"
          icon={<KeyRound size={18} color="white" />}
          grad="linear-gradient(135deg,#9a3412,#ea580c)"
          glow="rgba(234,88,12,0.3)"
          onClick={() => navigate('/admin/dashboard/api-settings')}
        />
      </div>

      {/* ── Chatbot analytics ── */}
      <div>
        <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>Thống kê chatbot</h2>
        <AnalyticsOverviewSection />
      </div>

      <CvhtStatsSection />

      <KnowledgeMapSection />
      <ReportSection />
    </div>
  );
};

export default Dashboard;
