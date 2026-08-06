import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import {
  Upload, FileText, Send, CheckCircle, AlertCircle,
  ArrowLeft, List, LayoutGrid, Bot,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants, type Transition } from 'framer-motion';
import toast from 'react-hot-toast';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISubjectFile, IFileType, IFileExternalStatus } from '@/infra/api/interfaces/ITeacher';
import CSS from './styles';
import { POLLING_STATUSES } from './constants';
import { isAiOk, downloadWithAuth } from './helpers';
import type { Layout, TabId, StatusF } from './types';
import { storage } from '@/helper/storage';

import UploadModal   from './components/UploadModal';
import DetailModal   from './components/DetailModal';
import MarkdownModal from './components/MarkdownModal';
import EditFileModal  from './components/EditFileModal';
import ConfirmModal  from './components/ConfirmModal';
import FileListView  from './components/FileListView';
import FileCardView  from './components/FileCardView';
import RagRail       from './components/RagRail';
import TrainTab      from './components/TrainTab';

// ── Animation variants ────────────────────────────────────────
const TAB_VARIANTS: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
};

const STAT_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 16 },
  show:   (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.38, ease: 'easeOut' } }),
};

const PAGE_TRANSITION: Transition = { duration: 0.15, ease: 'easeOut' };

// ── Main Page ─────────────────────────────────────────────────
const TeacherSubjectFiles: FC = () => {
  const { maMon }    = useParams<{ maMon: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const tenMon       = (location.state as { tenMon?: string } | null)?.tenMon;

  const [files,        setFiles]        = useState<ISubjectFile[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [layout,       setLayout]       = useState<Layout>('A');
  const [tab,          setTab]          = useState<TabId>('docs');
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusF>('all');
  const [activeFolder, setActiveFolder] = useState<'all' | IFileType>('all');
  const [modal,        setModal]        = useState<null | 'upload' | 'detail' | 'markdown' | 'edit'>(null);
  const [uploadType,   setUploadType]   = useState<IFileType | undefined>();
  const [selectedFile, setSelectedFile] = useState<ISubjectFile | null>(null);
  const [deleting,     setDeleting]     = useState<Record<string, boolean>>({});
  const [sending,      setSending]      = useState<Record<string, boolean>>({});
  const [sendingAll,   setSendingAll]   = useState(false);
  const [working,      setWorking]      = useState<Record<string, boolean>>({});
  const [confirmCfg, setConfirmCfg] = useState<{
    title: string; body: string; label: string; danger?: boolean;
    onConfirm: () => void;
  } | null>(null);
  const closeConfirm = () => setConfirmCfg(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevStatus = useRef<Record<string, IFileExternalStatus>>({});

  // ── Layout switch — reset filters to avoid stale state ────
  const handleLayoutSwitch = (next: Layout) => {
    if (next === layout) return;
    setLayout(next);
    setSearch('');
    setStatusFilter('all');
    setActiveFolder('all');
  };

  // ── Fetch helpers ─────────────────────────────────────────
  const applyFileList = useCallback((list: ISubjectFile[]) => {
    list.forEach(f => {
      const prev = prevStatus.current[f.id];
      const curr = f.external_status ?? null;
      if (prev && prev !== curr) {
        if (curr === 'parsed')  toast(`📄 ${f.original_name} sẵn sàng review`, { icon:'🔵' });
        if (curr === 'success') toast.success(`${f.original_name} đã embed thành công`);
        if (curr === 'failed')  toast.error(`${f.original_name} xử lý thất bại`);
      }
      prevStatus.current[f.id] = curr as IFileExternalStatus;
    });
    setFiles(list);
  }, []);

  const fetchFiles = useCallback((silent = false) => {
    if (!maMon) return;
    if (!silent) setLoading(true);
    TeacherApi.getSubjectFiles(maMon)
      .then(r => { applyFileList(r.data); if (!silent) setLoading(false); })
      .catch(() => { if (!silent) { toast.error('Không thể tải danh sách tài liệu.'); setLoading(false); } });
  }, [maMon, applyFileList]);

  const startPoll = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (!maMon) return;
      TeacherApi.getSubjectFiles(maMon)
        .then(r => applyFileList(r.data))
        .catch(() => {});
    }, 5_000);
  }, [maMon, applyFileList]);

  const stopPoll = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  useEffect(() => {
    const need = files.some(f => POLLING_STATUSES.includes((f.external_status ?? null) as IFileExternalStatus));
    if (need) startPoll(); else stopPoll();
  }, [files, startPoll, stopPoll]);

  useEffect(() => {
    const h = () => { if (document.hidden) stopPoll(); else startPoll(); };
    document.addEventListener('visibilitychange', h);
    return () => document.removeEventListener('visibilitychange', h);
  }, [startPoll, stopPoll]);

  // Initial load — setState only in async callbacks
  useEffect(() => {
    if (!maMon) return;
    TeacherApi.getSubjectFiles(maMon)
      .then(r => { applyFileList(r.data); setLoading(false); })
      .catch(() => { toast.error('Không thể tải danh sách tài liệu.'); setLoading(false); });
  }, [maMon, applyFileList]);

  useEffect(() => () => stopPoll(), [stopPoll]);

  // ── Handlers ──────────────────────────────────────────────
  const handleDelete = (fileId: string) => {
    if (!maMon) return;
    setConfirmCfg({
      title: 'Xóa tài liệu',
      body:  'File sẽ bị xóa vĩnh viễn và không thể khôi phục.',
      label: 'Xóa tài liệu',
      danger: true,
      onConfirm: () => {
        closeConfirm();
        setDeleting(p => ({ ...p, [fileId]: true }));
        TeacherApi.deleteSubjectFile(maMon, fileId)
          .then(() => {
            toast.success('Đã xóa file.');
            setFiles(p => p.filter(f => f.id !== fileId));
            if (selectedFile?.id === fileId) setModal(null);
          })
          .catch((e: unknown) => {
            const s = (e as { response?: { status?: number; data?: { message?: string } } })?.response;
            if (s?.status === 403)      toast.error('Bạn không có quyền xóa file này.');
            else if (s?.status === 422) toast.error('File đã gửi sang chatbot. Xóa khỏi chatbot trước.');
            else                        toast.error(s?.data?.message ?? 'Xóa thất bại.');
          })
          .finally(() => setDeleting(p => ({ ...p, [fileId]: false })));
      },
    });
  };

  const handleSendToAI = async (fileId: string) => {
    if (!maMon) return;
    setSending(p => ({ ...p, [fileId]: true }));
    try {
      const r = await TeacherApi.sendToApi(maMon, { fileIds: [fileId] });
      if (r.success) { toast.success('Đã đưa vào hàng chờ AI.'); fetchFiles(); }
      else toast.error(r.message ?? 'Gửi thất bại.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Gửi thất bại.');
    } finally { setSending(p => ({ ...p, [fileId]: false })); }
  };

  const handleSendAll = async () => {
    if (!maMon) return;
    const unsent = files.filter(f => isAiOk(f.original_name ?? '') && !f.external_status).map(f => f.id);
    if (!unsent.length) { toast('Không có file nào chưa gửi AI.'); return; }
    setSendingAll(true);
    try {
      await TeacherApi.sendToApi(maMon, { fileIds: unsent });
      toast.success(`Đã đưa ${unsent.length} file vào hàng chờ AI.`);
      fetchFiles();
    } catch { toast.error('Gửi thất bại.'); }
    finally { setSendingAll(false); }
  };

  const handleCancel = async (fileId: string) => {
    setWorking(p => ({ ...p, [fileId]: true }));
    try { await TeacherApi.cancelSend(fileId); toast.success('Đã hủy.'); fetchFiles(); }
    catch { toast.error('Hủy thất bại.'); }
    finally { setWorking(p => ({ ...p, [fileId]: false })); }
  };

  const handleRetry = async (fileId: string) => {
    setWorking(p => ({ ...p, [fileId]: true }));
    try { await TeacherApi.resendFiles([fileId]); toast.success('Đã xếp lại hàng chờ.'); fetchFiles(); }
    catch { toast.error('Thử lại thất bại.'); }
    finally { setWorking(p => ({ ...p, [fileId]: false })); }
  };

  const handleDelLink = (fileId: string) => {
    if (!maMon) return;
    setConfirmCfg({
      title: 'Xóa khỏi AI',
      body:  'File sẽ bị gỡ khỏi hệ thống chatbot AI. Dữ liệu embed sẽ bị xóa.',
      label: 'Xóa khỏi AI',
      danger: true,
      onConfirm: () => {
        closeConfirm();
        setWorking(p => ({ ...p, [fileId]: true }));
        TeacherApi.deleteFileSentLink(maMon, fileId)
          .then(() => { toast.success('Đã xóa khỏi AI.'); fetchFiles(); })
          .catch(() => toast.error('Xóa thất bại.'))
          .finally(() => setWorking(p => ({ ...p, [fileId]: false })));
      },
    });
  };

  const handleSubmitMarkdown = async (fileId: string, markdown: string) => {
    if (!maMon) return;
    try {
      await TeacherApi.submitFile(maMon, fileId, markdown);
      toast.success('Đang gửi tài liệu sang chatbot AI.');
      setModal(null);
      fetchFiles();
    } catch { toast.error('Gửi thất bại.'); }
  };

  const openDetail   = (f: ISubjectFile) => { setSelectedFile(f); setModal('detail'); };
  const openMarkdown = (f: ISubjectFile) => { setSelectedFile(f); setModal('markdown'); };
  const openEditMeta = (f: ISubjectFile) => { setSelectedFile(f); setModal('edit'); };
  const openUpload   = (type?: IFileType) => { setUploadType(type); setModal('upload'); };

  // Merge chỉ các field vừa sửa (type/tên/is_private) — không thay cả object bằng
  // response PATCH, vì endpoint update có thể không trả kèm external_status/chunk_count/...
  // như endpoint list, dẫn đến mất trạng thái RAG đã có trong state.
  const mergeFileFields = (id: string, patch: Partial<ISubjectFile>) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f));
    setSelectedFile(prev => prev && prev.id === id ? { ...prev, ...patch } : prev);
  };

  const handleEditSuccess = (updated: ISubjectFile) => {
    mergeFileFields(updated.id, {
      type: updated.type,
      type_label: updated.type_label,
      original_name: updated.original_name,
      is_private: updated.is_private,
    });
  };

  const handleTogglePrivate = async (file: ISubjectFile) => {
    if (!maMon) return;
    const nextPrivate = !file.is_private;
    try {
      await TeacherApi.updateSubjectFile(maMon, file.id, {
        type: file.type,
        is_private: nextPrivate ? '1' : '0',
        original_name: file.original_name ?? '',
      });
      mergeFileFields(file.id, { is_private: nextPrivate });
      toast.success(nextPrivate ? 'Đã ẩn tài liệu khỏi học sinh.' : 'Đã hiện tài liệu cho học sinh.');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Cập nhật thất bại.');
    }
  };

  const handleDownload = (url: string, name: string) => {
    const token = storage.getToken() ?? '';
    downloadWithAuth(url, name, token);
    toast.success('Đang tải xuống...', { duration: 1500 });
  };

  // ── Derived ───────────────────────────────────────────────
  const statTotal    = files.length;
  const statSent     = files.filter(f => f.external_status && f.external_status !== 'failed' && f.external_status !== 'pending').length;
  const statEmbedded = files.filter(f => f.external_status === 'success').length;
  const statReview   = files.filter(f => f.external_status === 'parsed').length;
  const ragPct       = statTotal ? Math.round(statSent / statTotal * 100) : 0;
  const pendingAI    = statTotal - statSent;
  const trainFiles   = files.filter(f => f.external_status != null);
  const needPoll     = files.some(f => POLLING_STATUSES.includes((f.external_status ?? null) as IFileExternalStatus));

  const filteredFiles = files.filter(f => {
    const name = (f.original_name ?? '').toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (activeFolder !== 'all' && f.type !== activeFolder) return false;
    if (statusFilter === 'sent'    && !(f.external_status === 'success' || f.external_status === 'send_queued' || f.external_status === 'sending')) return false;
    if (statusFilter === 'review'  && f.external_status !== 'parsed') return false;
    if (statusFilter === 'parsing' && !(f.external_status === 'pending' || f.external_status === 'processing')) return false;
    if (statusFilter === 'hidden'  && !f.is_private) return false;
    return true;
  });

  const STATS = [
    { icon:<FileText size={20} color="#2563eb" />, bg:'#eff5ff', accent:'#2563eb', value:statTotal,    label:'Tổng tài liệu', sub:'đã tải lên' },
    { icon:<Send size={20} color="#4f46e5" />,     bg:'#eef2ff', accent:'#4f46e5', value:statSent,     label:'Đã gửi AI',     sub:'đang xử lý' },
    { icon:<CheckCircle size={20} color="#16a34a" />, bg:'#ecfdf3', accent:'#16a34a', value:statEmbedded, label:'Đã embed',   sub:'sẵn chatbot' },
    { icon:<AlertCircle size={20} color="#d97706" />, bg:'#fff7ed', accent:'#d97706', value:statReview,   label:'Cần review', sub:'chờ duyệt' },
  ];

  // ── Render ─────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100%', background:'#eef2f8' }}>
      <style>{CSS}</style>

      {/* ─── HEADER BAND ─────────────────────────────────── */}
      <div style={{ background:'#fff', borderBottom:'1.5px solid #e7ecf3', boxShadow:'0 2px 10px rgba(15,23,42,.05)' }}>
        <div className="tdf-band-pad" style={{ display:'flex', alignItems:'center', gap:16 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:'#94a3b8', fontWeight:600, marginBottom:6 }}>
              <button onClick={() => navigate(-1)} style={{ background:'none', border:'none', cursor:'pointer', color:'#94a3b8', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', fontSize:12, fontWeight:600, padding:0 }}>
                <ArrowLeft size={13} /> Môn học
              </button>
              <span style={{ color:'#cbd5e1' }}>›</span>
              <span style={{ color:'#2563eb', fontWeight:700 }}>{tenMon ?? maMon}</span>
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:14, flexWrap:'wrap' }}>
              <h1 style={{ margin:0, fontSize:24, fontWeight:800, letterSpacing:-.5, color:'#0f172a' }}>Quản lý tài liệu</h1>
            </div>
          </div>
          <button onClick={() => openUpload()} className="tdf-primary" style={{ flexShrink:0, whiteSpace:'nowrap' }}>
            <Upload size={17} /> Upload tài liệu
          </button>
        </div>
      </div>

      {/* ─── STATS BAND ──────────────────────────────────── */}
      <div style={{ background:'linear-gradient(180deg,#e8f0fe 0%,#eef2f8 100%)', borderBottom:'1px solid #dbe4f0' }}>
        <div className="tdf-stats-pad">
          <div className="tdf-stats-grid">
            {STATS.map((s, i) => (
              <motion.div key={s.label} custom={i} variants={STAT_VARIANTS} initial="hidden" animate="show">
                <div className="tdf-stat" style={{ borderTop:`3px solid ${s.accent}` }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{s.icon}</div>
                  <div>
                    <div className="tdf-stat-num" style={{ fontSize:28, fontWeight:800, lineHeight:1, color:'#0f172a' }}>{s.value}</div>
                    <div style={{ fontSize:13, color:'#334155', fontWeight:700, marginTop:3 }}>{s.label}</div>
                    <div style={{ fontSize:11.5, color:'#94a3b8', marginTop:1 }}>{s.sub}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CONTENT ZONE ────────────────────────────────── */}
      <div className="tdf-content-pad">

        {/* Tab bar + layout toggle */}
        <div className="tdf-tabbar-row">
          <div style={{ display:'inline-flex', background:'#fff', border:'1px solid #e7ecf3', borderRadius:13, padding:4, gap:2, boxShadow:'0 1px 4px rgba(15,23,42,.05)' }}>
            <button className={`tdf-seg ${tab === 'docs' ? 'on' : 'off'}`} onClick={() => setTab('docs')}>
              <FileText size={15} /> Tài liệu
            </button>
            <button className={`tdf-seg ${tab === 'train' ? 'on' : 'off'}`} onClick={() => setTab('train')}>
              <Bot size={15} /> Train AI
              {needPoll && <span style={{ width:7, height:7, borderRadius:'50%', background:'#f59e0b' }} />}
            </button>
          </div>

          {tab === 'docs' && (
            <div className="tdf-layout-right">
              <span style={{ fontSize:12.5, color:'#94a3b8', fontWeight:600 }}>Bố cục:</span>
              <div style={{ display:'inline-flex', background:'#fff', border:'1px solid #e7ecf3', borderRadius:10, padding:3, gap:2 }}>
                <button className={`tdf-lay ${layout === 'A' ? 'on' : 'off'}`} onClick={() => handleLayoutSwitch('A')}><List size={14} /> Danh sách</button>
                <button className={`tdf-lay ${layout === 'B' ? 'on' : 'off'}`} onClick={() => handleLayoutSwitch('B')}><LayoutGrid size={14} /> Thẻ</button>
              </div>
            </div>
          )}
        </div>

        {/* Workspace */}
        <div style={{ display:'flex', gap:20, alignItems:'flex-start' }}>

          {/* Main content */}
          <div style={{ flex:1, minWidth:0 }}>
            <AnimatePresence mode="wait">

              {/* ── Docs tab ── */}
              {tab === 'docs' && (
                <motion.div key="docs" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit" transition={PAGE_TRANSITION}>
                  <AnimatePresence mode="wait">
                    {layout === 'A' ? (
                      <motion.div key="layout-a" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}>
                        <FileListView
                          files={files}
                          filteredFiles={filteredFiles}
                          loading={loading}
                          search={search}
                          statusFilter={statusFilter}
                          activeFolder={activeFolder}
                          deleting={deleting}
                          sending={sending}
                          onSearch={setSearch}
                          onStatusFilter={setStatusFilter}
                          onFolder={setActiveFolder}
                          onRowClick={openDetail}
                          onEditMeta={openEditMeta}
                          onSend={handleSendToAI}
                          onDelete={handleDelete}
                          onDownload={handleDownload}
                        />
                      </motion.div>
                    ) : (
                      <motion.div key="layout-b" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.12 }}>
                        <FileCardView
                          files={files}
                          loading={loading}
                          onRowClick={openDetail}
                          onUpload={openUpload}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* ── Train tab ── */}
              {tab === 'train' && (
                <motion.div key="train" variants={TAB_VARIANTS} initial="initial" animate="animate" exit="exit" transition={PAGE_TRANSITION}>
                  <TrainTab
                    files={files}
                    working={working}
                    onRefresh={() => fetchFiles()}
                    onPreview={openMarkdown}
                    onCancel={handleCancel}
                    onRetry={handleRetry}
                    onDelLink={handleDelLink}
                    onDocs={() => setTab('docs')}
                  />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* RAG Rail */}
          <RagRail
            files={files}
            statTotal={statTotal}
            statSent={statSent}
            statEmbedded={statEmbedded}
            trainFilesCount={trainFiles.length}
            pendingAI={pendingAI}
            ragPct={ragPct}
            sendingAll={sendingAll}
            onSendAll={handleSendAll}
            onFileClick={openDetail}
          />
        </div>
      </div>

      {/* ── Modals ── */}
      {modal === 'upload' && maMon && (
        <UploadModal maMon={maMon} defaultType={uploadType} onClose={() => setModal(null)} onSuccess={() => fetchFiles()} />
      )}
      {modal === 'detail' && selectedFile && (
        <DetailModal
          file={selectedFile}
          onClose={() => setModal(null)}
          onEdit={() => setModal('markdown')}
          onSend={() => handleSendToAI(selectedFile.id)}
          onDelete={() => handleDelete(selectedFile.id)}
          onDownload={handleDownload}
          onTogglePrivate={() => handleTogglePrivate(selectedFile)}
          sending={!!sending[selectedFile.id]}
        />
      )}
      {modal === 'markdown' && maMon && selectedFile && (
        <MarkdownModal maMon={maMon} file={selectedFile} onClose={() => setModal(null)} onSubmit={handleSubmitMarkdown} />
      )}
      {modal === 'edit' && maMon && selectedFile && (
        <EditFileModal maMon={maMon} file={selectedFile} onClose={() => setModal(null)} onSuccess={handleEditSuccess} />
      )}
      {confirmCfg && (
        <ConfirmModal
          title={confirmCfg.title}
          body={confirmCfg.body}
          confirmLabel={confirmCfg.label}
          danger={confirmCfg.danger}
          onConfirm={confirmCfg.onConfirm}
          onClose={closeConfirm}
        />
      )}
    </div>
  );
};

export default TeacherSubjectFiles;
