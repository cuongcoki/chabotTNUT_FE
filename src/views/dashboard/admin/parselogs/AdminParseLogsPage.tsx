import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FileSearch, RefreshCw, AlertTriangle, CheckCircle2, Loader2, Send, Clock3, X, ListTodo } from 'lucide-react';
import toast from 'react-hot-toast';
import HeaderComponent from '@/components/common/header_table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import AdminApi from '@/infra/admin/admin_api';
import UserApi from '@/infra/user/user_api';
import type { IAdminUser } from '@/infra/api/interfaces/IUser';
import type {
  IParseLog,
  IParseLogsQuery,
  IParseLogsMeta,
  IParseLogStats,
  IParseLogRecentError,
  IParseLogInProgress,
  IParseLogsInProgressMeta,
  ParseLogService,
  ParseLogStatus,
  ParseLogChatbotStatus,
  ParseLogInProgressStatus,
} from '@/infra/api/interfaces/IParseLog';

// ── Teacher lookup filter (tìm theo username/tên → chọn để lấy teacher_id) ──
const TeacherFilter: FC<{
  selected: { id: string; label: string } | null;
  onSelect: (v: { id: string; label: string } | null) => void;
}> = ({ selected, onSelect }) => {
  const [query, setQuery]     = useState('');
  const [options, setOptions] = useState<IAdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setOptions([]); return; }
    setLoading(true);
    const timer = setTimeout(() => {
      UserApi.getUsers({ search: query.trim(), role: 'teacher', per_page: 8 })
        .then(res => setOptions(res.data))
        .catch(() => setOptions([]))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  if (selected) {
    return (
      <div className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-transparent text-sm">
        <span className="truncate max-w-40">{selected.label}</span>
        <button onClick={() => { onSelect(null); setQuery(''); }} className="text-muted-foreground hover:text-foreground shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-48">
      <Input
        placeholder="Tìm giáo viên..."
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-md border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-xs text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin inline-block mr-1.5 align-middle" />Đang tìm...</div>
          ) : options.length === 0 ? (
            <div className="p-3 text-center text-xs text-muted-foreground">Không tìm thấy giáo viên.</div>
          ) : options.map(t => (
            <button
              key={t._id}
              onClick={() => { onSelect({ id: t._id, label: `${t.name} (@${t.username})` }); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
            >
              <div className="font-medium text-foreground truncate">{t.name}</div>
              <div className="text-xs text-muted-foreground truncate">@{t.username}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const SERVICE_LABEL: Record<ParseLogService, string> = {
  llama: 'LlamaIndex',
  word:  'phpWord',
  excel: 'phpSpreadsheet',
};

const CHATBOT_CFG: Record<ParseLogChatbotStatus, { label: string; className: string }> = {
  parsed:      { label: 'Chờ review',  className: 'bg-slate-100 text-slate-600' },
  send_queued: { label: 'Chờ gửi',     className: 'bg-indigo-100 text-indigo-700' },
  sending:     { label: 'Đang gửi',    className: 'bg-blue-100 text-blue-700' },
  success:     { label: 'Đã embed',    className: 'bg-emerald-100 text-emerald-700' },
  failed:      { label: 'Gửi lỗi',     className: 'bg-red-100 text-red-700' },
};

const IN_PROGRESS_STATUS_CFG: Record<ParseLogInProgressStatus, { label: string; className: string }> = {
  pending:    { label: 'Chờ xử lý',  className: 'bg-slate-100 text-slate-600' },
  processing: { label: 'Đang xử lý', className: 'bg-blue-100 text-blue-700' },
  failed:     { label: 'Lỗi',        className: 'bg-red-100 text-red-700' },
};

const fmtElapsed = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)} phút`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ ${Math.floor((s % 3600) / 60)} phút`;
  return `${Math.floor(s / 86400)} ngày ${Math.floor((s % 86400) / 3600)} giờ`;
};

const fmtDt = (iso?: string | null) => {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};

const fmtDuration = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

const fmtSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
};

const rateColor = (rate: number) => rate >= 95 ? 'text-emerald-600' : rate >= 80 ? 'text-amber-600' : 'text-red-600';
const rateBar   = (rate: number) => rate >= 95 ? 'bg-emerald-500' : rate >= 80 ? 'bg-amber-500' : 'bg-red-500';

const StatCard: FC<{ label: string; value: string | number; icon: React.ReactNode; loading?: boolean }> = ({ label, value, icon, loading }) => (
  <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
    <div className="p-2.5 rounded-lg bg-[#2F6B3F]/10 shrink-0">{icon}</div>
    <div className="min-w-0">
      {loading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
        <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
      )}
      <p className="text-xs font-medium text-muted-foreground mt-0.5">{label}</p>
    </div>
  </div>
);

const ALL = '__all__';

const AdminParseLogsPage: FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTabState] = useState<'done' | 'in_progress'>(
    searchParams.get('tab') === 'in_progress' ? 'in_progress' : 'done'
  );
  const setTab = (t: 'done' | 'in_progress') => {
    setTabState(t);
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (t === 'in_progress') p.set('tab', 'in_progress'); else p.delete('tab');
      return p;
    }, { replace: true });
  };

  const [logs, setLogs]   = useState<IParseLog[]>([]);
  const [meta, setMeta]   = useState<IParseLogsMeta | null>(null);
  const [stats, setStats] = useState<IParseLogStats | null>(null);
  const [loading, setLoading]     = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // ── File đang xử lý dở (pending/processing/failed) — nguồn "sống" từ SubjectFile ──
  const [inProgressLogs, setInProgressLogs]     = useState<IParseLogInProgress[]>([]);
  const [inProgressMeta, setInProgressMeta]     = useState<IParseLogsInProgressMeta | null>(null);
  const [inProgressLoading, setInProgressLoading] = useState(true);
  const [inProgressStatus, setInProgressStatus] = useState<ParseLogInProgressStatus | ''>('');
  const inProgressPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchInProgress = useCallback(() => {
    AdminApi.getParseLogsInProgress(inProgressStatus ? { status: inProgressStatus } : undefined)
      .then(res => { setInProgressLogs(res.data ?? []); setInProgressMeta(res.meta ?? null); })
      .catch(() => toast.error('Không thể tải danh sách file đang xử lý.'))
      .finally(() => setInProgressLoading(false));
  }, [inProgressStatus]);

  useEffect(() => {
    if (tab !== 'in_progress') return;
    setInProgressLoading(true);
    fetchInProgress();
    inProgressPollRef.current = setInterval(fetchInProgress, 12_000);
    return () => { if (inProgressPollRef.current) clearInterval(inProgressPollRef.current); };
  }, [tab, fetchInProgress]);

  const [status, setStatus]     = useState<ParseLogStatus | ''>('');
  const [service, setService]   = useState<ParseLogService | ''>('');
  const [sentToChatbot, setSentToChatbot] = useState<'' | 'true' | 'false'>('');
  const [maMon, setMaMon]       = useState('');
  const [teacher, setTeacher]   = useState<{ id: string; label: string } | null>(null);
  const [filename, setFilename] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [page, setPage]         = useState(1);
  const [selectedError, setSelectedError] = useState<IParseLogRecentError | null>(null);
  const perPage = 50;

  useEffect(() => {
    AdminApi.getParseLogStats()
      .then(res => setStats(res.data))
      .catch(() => toast.error('Không thể tải thống kê parse logs.'))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    const query: IParseLogsQuery = {
      page, per_page: perPage,
      ...(status   ? { status }   : {}),
      ...(service  ? { service }  : {}),
      ...(maMon    ? { ma_mon: maMon }     : {}),
      ...(teacher  ? { teacher_id: teacher.id } : {}),
      ...(filename ? { filename }          : {}),
      ...(sentToChatbot ? { sent_to_chatbot: sentToChatbot === 'true' } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo   ? { date_to: dateTo }     : {}),
    };
    setLoading(true);
    const timer = setTimeout(() => {
      AdminApi.getParseLogs(query)
        .then(res => { setLogs(res.data ?? []); setMeta(res.meta ?? null); })
        .catch(() => toast.error('Không thể tải danh sách log.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [status, service, sentToChatbot, maMon, teacher, filename, dateFrom, dateTo, page]);

  const hasFilters = !!(status || service || sentToChatbot || maMon || teacher || filename || dateFrom || dateTo);

  const resetFilters = () => {
    setStatus(''); setService(''); setSentToChatbot('');
    setMaMon(''); setTeacher(null); setFilename('');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  return (
    <div>
      <HeaderComponent title="Nhật ký xử lý tài liệu" description="Theo dõi toàn bộ lịch sử parse file và trạng thái gửi chatbot/RAG" />

      {/* ── Parse stats ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard label="Tổng số lần parse" value={statsLoading ? '—' : stats?.parse.total ?? 0} loading={statsLoading} icon={<FileSearch className="w-5 h-5 text-[#2F6B3F]" />} />
        <StatCard label="Parse thành công" value={statsLoading ? '—' : stats?.parse.success ?? 0} loading={statsLoading} icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} />
        <StatCard label="Parse lỗi" value={statsLoading ? '—' : stats?.parse.error ?? 0} loading={statsLoading} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} />
        <div className="rounded-xl border border-border bg-card p-5">
          <p className={`text-2xl font-bold tabular-nums ${statsLoading ? 'text-foreground' : rateColor(stats?.parse.success_rate ?? 0)}`}>
            {statsLoading ? '—' : `${stats?.parse.success_rate ?? 0}%`}
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-0.5 mb-2">Tỉ lệ parse thành công</p>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${rateBar(stats?.parse.success_rate ?? 0)}`} style={{ width: `${Math.min(stats?.parse.success_rate ?? 0, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* ── Chatbot / RAG stats ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="Đã gửi chatbot thành công" value={statsLoading ? '—' : stats?.chatbot.sent_success ?? 0} loading={statsLoading} icon={<Send className="w-5 h-5 text-emerald-600" />} />
        <StatCard label="Gửi chatbot thất bại" value={statsLoading ? '—' : stats?.chatbot.send_failed ?? 0} loading={statsLoading} icon={<AlertTriangle className="w-5 h-5 text-red-600" />} />
        <StatCard label="Đang chờ / đang gửi RAG" value={statsLoading ? '—' : stats?.chatbot.pending_rag ?? 0} loading={statsLoading} icon={<Clock3 className="w-5 h-5 text-amber-600" />} />
      </div>

      {/* ── Đang xử lý dở (pending/processing/stuck) ───── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="Đang chờ xử lý" value={statsLoading ? '—' : stats?.in_progress.pending ?? 0} loading={statsLoading} icon={<Clock3 className="w-5 h-5 text-slate-500" />} />
        <StatCard label="Đang xử lý" value={statsLoading ? '—' : stats?.in_progress.processing ?? 0} loading={statsLoading} icon={<Loader2 className="w-5 h-5 text-blue-600" />} />
        <div className={`rounded-xl border p-5 flex items-center gap-4 ${!statsLoading && (stats?.in_progress.stuck ?? 0) > 0 ? 'border-red-300 bg-red-50' : 'border-border bg-card'}`}>
          <div className={`p-2.5 rounded-lg shrink-0 ${!statsLoading && (stats?.in_progress.stuck ?? 0) > 0 ? 'bg-red-100' : 'bg-[#2F6B3F]/10'}`}>
            <AlertTriangle className={`w-5 h-5 ${!statsLoading && (stats?.in_progress.stuck ?? 0) > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </div>
          <div className="min-w-0">
            {statsLoading ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /> : (
              <p className={`text-2xl font-bold tabular-nums ${(stats?.in_progress.stuck ?? 0) > 0 ? 'text-red-700' : 'text-foreground'}`}>{stats?.in_progress.stuck ?? 0}</p>
            )}
            <p className="text-xs font-medium text-muted-foreground mt-0.5">File bị treo (&gt;20 phút không cập nhật)</p>
          </div>
        </div>
      </div>

      {/* ── Tab switcher ──────────────────────────────── */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted mb-4">
        <button
          onClick={() => setTab('done')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'done' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          Đã hoàn tất
        </button>
        <button
          onClick={() => setTab('in_progress')}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${tab === 'in_progress' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ListTodo className="w-3.5 h-3.5" /> Đang xử lý
          {!statsLoading && (stats?.in_progress.stuck ?? 0) > 0 && (
            <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold">
              {stats?.in_progress.stuck}
            </span>
          )}
        </button>
      </div>

      {tab === 'in_progress' && (
        <>
          {inProgressMeta && inProgressMeta.stuck > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="text-sm text-red-700">
                <span className="font-semibold">{inProgressMeta.stuck} file đang bị treo</span> (xử lý quá 20 phút không cập nhật) — worker phía server có thể đã dừng, cần kiểm tra Supervisor.
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select value={inProgressStatus || ALL} onValueChange={v => setInProgressStatus(v === ALL ? '' : v as ParseLogInProgressStatus)}>
              <SelectTrigger className="w-52"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Tất cả (chờ / đang xử lý / lỗi)</SelectItem>
                <SelectItem value="pending">Đang chờ xử lý</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="failed">Lỗi</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => { setInProgressLoading(true); fetchInProgress(); }}>
              <RefreshCw className="w-3.5 h-3.5" /> Làm mới
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">Tự động làm mới mỗi 12 giây</span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Môn</TableHead>
                  <TableHead>Giáo viên</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Thời gian ở trạng thái</TableHead>
                  <TableHead>Chi tiết lỗi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inProgressLoading && inProgressLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 align-middle" /> Đang tải...
                  </TableCell></TableRow>
                ) : inProgressLogs.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Không có file nào đang xử lý dở.</TableCell></TableRow>
                ) : inProgressLogs.map((log, i) => {
                  const cfg = IN_PROGRESS_STATUS_CFG[log.status];
                  return (
                    <TableRow key={log.id} className={log.stuck ? 'bg-red-50/60' : undefined}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="max-w-40">
                        <div className="font-semibold text-foreground truncate">{log.ten_mon}</div>
                        <div className="text-xs text-muted-foreground">{log.ma_mon}</div>
                      </TableCell>
                      <TableCell className="max-w-36">
                        <div className="text-foreground truncate">{log.teacher_name}</div>
                        <div className="text-xs text-muted-foreground truncate">@{log.teacher_username}</div>
                      </TableCell>
                      <TableCell className="max-w-56 truncate" title={log.filename}>
                        {log.filename}
                        <div className="text-xs text-muted-foreground">{log.type_label} · {fmtSize(log.file_size)}</div>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{SERVICE_LABEL[log.service] ?? log.service}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge className={`${cfg.className} border-0`}>{cfg.label}</Badge>
                          {log.stuck && <Badge className="bg-red-600 text-white border-0">TREO</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className={log.stuck ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                        {fmtElapsed(log.elapsed_seconds)}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-red-600" title={log.error ?? ''}>
                        {log.error ?? '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* ── Lỗi gần đây ───────────────────────────────── */}
      {tab === 'done' && stats && stats.recent_errors.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 mb-4">
          <h2 className="text-xs font-semibold text-foreground mb-2">Lỗi gần đây</h2>
          <div className="flex flex-col">
            {stats.recent_errors.map((e, i) => (
              <button
                key={i}
                onClick={() => setSelectedError(e)}
                className="w-full flex items-center gap-2 text-left py-1.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors rounded-sm px-1 -mx-1"
              >
                <span className="text-xs font-semibold text-red-600 shrink-0">{e.ma_mon}</span>
                <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">{e.filename} — {e.error}</span>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{fmtDt(e.created_at)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Chi tiết lỗi ──────────────────────────────── */}
      <Dialog open={!!selectedError} onOpenChange={(v) => !v && setSelectedError(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedError && (
            <>
              <DialogHeader>
                <DialogTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Chi tiết lỗi parse
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Môn học</div>
                    <div className="text-foreground">{selectedError.ten_mon} <span className="text-muted-foreground">({selectedError.ma_mon})</span></div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Giáo viên</div>
                    <div className="text-foreground">{selectedError.teacher_name} <span className="text-muted-foreground">(@{selectedError.teacher_username})</span></div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Dịch vụ</div>
                    <Badge variant="secondary">{SERVICE_LABEL[selectedError.service] ?? selectedError.service}</Badge>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-0.5">Thời gian</div>
                    <div className="text-foreground">{fmtDt(selectedError.created_at)}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Tên file</div>
                  <div className="text-sm text-foreground" style={{ wordBreak: 'break-word' }}>{selectedError.filename}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Nội dung lỗi</div>
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3" style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {selectedError.error}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Filters ───────────────────────────────────── */}
      {tab === 'done' && (
      <>
      <div className="rounded-xl border border-border bg-card p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <Select value={status || ALL} onValueChange={v => { setStatus(v === ALL ? '' : v as ParseLogStatus); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Trạng thái parse" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả trạng thái</SelectItem>
              <SelectItem value="success">Thành công</SelectItem>
              <SelectItem value="error">Lỗi</SelectItem>
            </SelectContent>
          </Select>
          <Select value={service || ALL} onValueChange={v => { setService(v === ALL ? '' : v as ParseLogService); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Dịch vụ" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả dịch vụ</SelectItem>
              <SelectItem value="llama">LlamaIndex</SelectItem>
              <SelectItem value="word">phpWord</SelectItem>
              <SelectItem value="excel">phpSpreadsheet</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sentToChatbot || ALL} onValueChange={v => { setSentToChatbot(v === ALL ? '' : v as 'true' | 'false'); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Gửi chatbot" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tất cả</SelectItem>
              <SelectItem value="true">Đã gửi thành công</SelectItem>
              <SelectItem value="false">Chưa gửi xong</SelectItem>
            </SelectContent>
          </Select>
          <Input className="w-36" placeholder="Mã môn..." value={maMon} onChange={e => { setMaMon(e.target.value); setPage(1); }} />
          <TeacherFilter selected={teacher} onSelect={v => { setTeacher(v); setPage(1); }} />
          <Input className="flex-1 min-w-44" placeholder="Tên file..." value={filename} onChange={e => { setFilename(e.target.value); setPage(1); }} />
          <Input className="w-40" type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
          <Input className="w-40" type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          <Button variant="outline" onClick={resetFilters} disabled={!hasFilters}>
            <RefreshCw className="w-3.5 h-3.5" /> Xóa lọc
          </Button>
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Môn</TableHead>
              <TableHead>Giáo viên</TableHead>
              <TableHead>File</TableHead>
              <TableHead>Dịch vụ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Chatbot</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Ngày parse</TableHead>
              <TableHead>Chi tiết</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin inline-block mr-2 align-middle" /> Đang tải...
              </TableCell></TableRow>
            ) : logs.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Không có log nào phù hợp.</TableCell></TableRow>
            ) : logs.map((log, i) => {
              const chatbotCfg = log.chatbot_status ? CHATBOT_CFG[log.chatbot_status] : null;
              return (
                <TableRow key={log.id}>
                  <TableCell className="text-muted-foreground">{(page - 1) * perPage + i + 1}</TableCell>
                  <TableCell className="max-w-40">
                    <div className="font-semibold text-foreground truncate">{log.ten_mon}</div>
                    <div className="text-xs text-muted-foreground">{log.ma_mon}</div>
                  </TableCell>
                  <TableCell className="max-w-36">
                    <div className="text-foreground truncate">{log.teacher_name}</div>
                    <div className="text-xs text-muted-foreground truncate">@{log.teacher_username}</div>
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={log.filename}>
                    {log.filename}
                    <div className="text-xs text-muted-foreground">{fmtSize(log.file_size)}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{SERVICE_LABEL[log.service] ?? log.service}</Badge></TableCell>
                  <TableCell>
                    {log.status === 'success' ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline"><CheckCircle2 className="w-3 h-3" /> Thành công</Badge>
                    ) : (
                      <Badge className="bg-red-50 text-red-700 border-red-200" variant="outline"><AlertTriangle className="w-3 h-3" /> Lỗi</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {chatbotCfg ? (
                      <div>
                        <Badge className={`${chatbotCfg.className} border-0`}>{chatbotCfg.label}</Badge>
                        {log.rag_chunks != null && <div className="text-xs text-muted-foreground mt-1">{log.rag_chunks} chunks</div>}
                      </div>
                    ) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{fmtDuration(log.duration_ms)}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{fmtDt(log.parsed_at)}</TableCell>
                  <TableCell className={`max-w-56 truncate ${log.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`}
                    title={log.status === 'error' ? (log.error ?? '') : (log.preview ?? '')}>
                    {log.status === 'error' ? (log.error ?? '—') : (log.preview ?? '—')}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Trang {meta.current_page}/{meta.last_page} · Tổng {meta.total} bản ghi</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</Button>
              <Button variant="outline" size="sm" disabled={page >= meta.last_page} onClick={() => setPage(p => p + 1)}>Sau</Button>
            </div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
};

export default AdminParseLogsPage;
