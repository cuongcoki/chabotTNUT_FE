import { type FC, useEffect, useRef, useState } from 'react';
import {
  X, Download, Trash2, Send, Pencil, EyeOff, Eye,
  CheckCircle, AlertCircle, Loader2, FileText,
} from 'lucide-react';
import DocViewer, { DocViewerRenderers } from '@cyntler/react-doc-viewer';
import { renderAsync } from 'docx-preview';
import { storage } from '@/helper/storage';
import type { ISubjectFile } from '@/infra/api/interfaces/ITeacher';
import { TYPE_LABEL } from '../constants';
import { fmtSize, fmtDate, fmtNum, extOf, previewType, isAiOk } from '../helpers';
import { ExtBadge, StatusBadge, Spinner } from './shared';

interface Props {
  file: ISubjectFile;
  onClose: () => void;
  onEdit: () => void;
  onSend: () => void;
  onDelete: () => void;
  onDownload: (url: string, name: string) => void;
  onTogglePrivate: () => Promise<void>;
  sending: boolean;
}

// ── Auth-aware blob URL hook ───────────────────────────────────
// Fetches the remote URL with Bearer token and returns a local blob URL.
// blobLoading is initialized true (when url is present) so no synchronous setState
// in the effect body (avoids react-compiler lint rule violation).
const useBlobUrl = (url: string | null | undefined) => {
  const [blobUrl,     setBlobUrl]     = useState<string | null>(null);
  const [blobLoading, setBlobLoading] = useState(!!url);
  const [blobError,   setBlobError]   = useState('');

  useEffect(() => {
    if (!url) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    const token = storage.getToken() ?? '';
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.blob();
      })
      .then(blob => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(e => { if (!cancelled) setBlobError((e as Error).message ?? 'Lỗi tải file'); })
      .finally(() => { if (!cancelled) setBlobLoading(false); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return { blobUrl, blobLoading, blobError };
};

// ── File preview ──────────────────────────────────────────────
const FilePreview: FC<{ file: ISubjectFile }> = ({ file }) => {
  const name  = file.original_name ?? '';
  const url   = file.download_url;
  const ptype = previewType(name);
  const docxRef = useRef<HTMLDivElement>(null);
  const [docxLoading, setDocxLoading] = useState(ptype === 'docx');
  const [docxError,   setDocxError]   = useState('');

  // PDF / image / video / xlsx — fetch with Bearer token, expose as blob URL
  const needsBlob = ptype === 'pdf' || ptype === 'image' || ptype === 'video' || ptype === 'xlsx';
  const { blobUrl, blobLoading, blobError } = useBlobUrl(needsBlob ? url : null);

  // DOCX needs an ArrayBuffer, so fetch separately with Bearer token
  useEffect(() => {
    if (ptype !== 'docx' || !url || !docxRef.current) return;
    let cancelled = false;
    const token = storage.getToken() ?? '';
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.arrayBuffer();
      })
      .then(buf => { if (!cancelled && docxRef.current) return renderAsync(buf, docxRef.current); })
      .catch(e => { if (!cancelled) setDocxError((e as Error).message ?? 'Không thể hiển thị tài liệu'); })
      .finally(() => { if (!cancelled) setDocxLoading(false); });
    return () => { cancelled = true; };
  }, [url, ptype]);

  if (!url) return <NoPreview reason="File chưa có URL tải xuống." />;

  // Blob-based types: show spinner until fetch+objectURL is ready
  if (needsBlob) {
    if (blobLoading) {
      return (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
          <Spinner size={30} />
        </div>
      );
    }
    if (blobError || !blobUrl) {
      return <NoPreview reason={blobError ? `Không thể tải file: ${blobError}` : 'Không thể tải file.'} />;
    }
  }

  if (ptype === 'image') {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:20, background:'#0f172a', overflow:'auto' }}>
        <img src={blobUrl!} alt={name} style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain', borderRadius:6 }} />
      </div>
    );
  }

  if (ptype === 'video') {
    return (
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', background:'#0f172a' }}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={blobUrl!} controls style={{ maxWidth:'100%', maxHeight:'100%' }} />
      </div>
    );
  }

  if (ptype === 'pdf') {
    return <iframe src={blobUrl!} title={name} style={{ flex:1, border:'none', minHeight:0, display:'block' }} />;
  }

  if (ptype === 'docx') {
    return (
      <div style={{ flex:1, overflowY:'auto', background:'#f8fafc', padding:'16px 20px', position:'relative' }}>
        {docxLoading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(248,250,252,.9)', zIndex:2 }}>
            <Spinner size={28} />
          </div>
        )}
        {docxError ? (
          <NoPreview reason={docxError} />
        ) : (
          <div ref={docxRef} style={{ width:'100%' }} />
        )}
      </div>
    );
  }

  if (ptype === 'xlsx') {
    return (
      <div style={{ flex:1, minHeight:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <DocViewer
          documents={[{ uri: blobUrl!, fileName: name, fileType: extOf(name) }]}
          pluginRenderers={DocViewerRenderers}
          config={{ header: { disableHeader: true, disableFileName: true } }}
          style={{ flex:1, width:'100%' }}
        />
      </div>
    );
  }

  return <NoPreview reason="Định dạng này không hỗ trợ xem trước." />;
};

const NoPreview: FC<{ reason: string }> = ({ reason }) => (
  <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, color:'#94a3b8', padding:32 }}>
    <FileText size={36} />
    <div style={{ fontSize:13.5, fontWeight:600, color:'#475569', textAlign:'center' }}>{reason}</div>
  </div>
);

// ── RAG pipeline steps ────────────────────────────────────────
const RAG_STEPS = [
  { key:'uploaded',    label:'Đã tải lên',    hint:'File lưu trên hệ thống' },
  { key:'parsed',      label:'Đã parse',       hint:'Trích xuất nội dung' },
  { key:'sent',        label:'Đã gửi AI',      hint:'Đưa vào hệ thống AI' },
  { key:'embedded',    label:'Đã embed vector', hint:'Sẵn sàng chatbot' },
] as const;

const RagPipeline: FC<{ file: ISubjectFile }> = ({ file }) => {
  const st = file.external_status;
  const doneMap = {
    uploaded: true,
    parsed:   !!st && st !== 'pending',
    sent:     st === 'success' || st === 'send_queued' || st === 'sending',
    embedded: st === 'success',
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {RAG_STEPS.map(step => {
        const done = doneMap[step.key];
        const active = step.key === 'parsed' && st === 'pending';
        return (
          <div key={step.key} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:'1px solid #eef2f7', borderRadius:10, background:'#fff' }}>
            <span style={{ width:26, height:26, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background: done ? '#ecfdf3' : active ? '#fff7ed' : '#f1f5f9', color: done ? '#16a34a' : active ? '#d97706' : '#94a3b8' }}>
              {done ? <CheckCircle size={13} /> : active ? <Loader2 size={13} style={{ animation:'tdf-spin 1s linear infinite' }} /> : <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor' }} />}
            </span>
            <div>
              <div style={{ fontSize:12.5, fontWeight:600, color:'#0f172a' }}>{step.label}</div>
              <div style={{ fontSize:11, color:'#94a3b8' }}>{step.hint}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────
const DetailModal: FC<Props> = ({ file, onClose, onEdit, onSend, onDelete, onDownload, onTogglePrivate, sending }) => {
  const name   = file.original_name ?? '—';
  const hasRag = !!file.external_status;
  const canSendAI = isAiOk(name) && !file.external_status;
  const [toggling, setToggling] = useState(false);

  const handleTogglePrivate = async () => {
    setToggling(true);
    try { await onTogglePrivate(); } finally { setToggling(false); }
  };

  const infoRows = [
    { k:'Loại tài liệu', v: TYPE_LABEL[file.type] },
    { k:'Người upload',  v: file.uploaded_by ?? '—' },
    { k:'Ngày tạo',      v: fmtDate(file.created_at) || '—' },
    { k:'Kích thước',    v: fmtSize(file.file_size) },
    { k:'Hiển thị HS',   v: file.is_private ? 'Ẩn' : 'Công khai' },
  ];

  return (
    <div className="tdf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="tdf-panel" style={{ width:'min(1120px,96vw)', height:'min(86vh,780px)', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:13, padding:'17px 22px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <ExtBadge name={name} size={44} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
            <div style={{ fontSize:12.5, color:'#94a3b8', marginTop:2, display:'flex', alignItems:'center', gap:8 }}>
              <span>{TYPE_LABEL[file.type]}</span>
              {hasRag && <><span style={{ color:'#e2e8f0' }}>·</span><StatusBadge status={file.external_status ?? null} /></>}
            </div>
          </div>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, border:'1px solid #e7ecf3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="tdf-detail-grid">

          {/* Left panel */}
          <div className="tdf-detail-left" style={{ borderRight:'1px solid #f1f5f9', overflow:'auto', padding:'20px 18px', background:'#fbfcfe', display:'flex', flexDirection:'column', gap:18 }}>

            {/* File info */}
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:.6, color:'#94a3b8', marginBottom:10, textTransform:'uppercase' }}>Thông tin tài liệu</div>
              <div style={{ display:'flex', flexDirection:'column' }}>
                {infoRows.map(row => (
                  <div key={row.k} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:8, padding:'7px 0', borderBottom:'1px solid #f1f5f9', fontSize:13 }}>
                    <span style={{ color:'#94a3b8', flexShrink:0 }}>{row.k}</span>
                    <span style={{ color:'#0f172a', fontWeight:600, textAlign:'right', wordBreak:'break-all' }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RAG section — only if sent to AI */}
            {hasRag && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, letterSpacing:.6, color:'#94a3b8', marginBottom:10, textTransform:'uppercase' }}>Trạng thái RAG</div>
                <RagPipeline file={file} />
                {(file.page_count != null || file.chunk_count != null || file.token_count != null) && (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:10 }}>
                    {[
                      { v: fmtNum(file.page_count),  label:'Trang',  color:'#2563eb' },
                      { v: fmtNum(file.chunk_count), label:'Chunks', color:'#4f46e5' },
                      { v: fmtNum(file.token_count), label:'Tokens', color:'#16a34a' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#fff', border:'1px solid #eef2f7', borderRadius:10, padding:'9px 6px', textAlign:'center' }}>
                        <div style={{ fontSize:16, fontWeight:800, color:s.color, lineHeight:1 }}>{s.v}</div>
                        <div style={{ fontSize:11, color:'#94a3b8', fontWeight:600, marginTop:2 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:'auto' }}>
              {canSendAI && (
                <button onClick={onSend} disabled={sending} className="tdf-primary" style={{ width:'100%', justifyContent:'center', height:42 }}>
                  {sending ? <><Spinner size={14} color="#fff" /> Đang gửi...</> : <><Send size={14} /> Gửi sang AI</>}
                </button>
              )}
              {file.external_status === 'parsed' && (
                <button onClick={onEdit} style={INDIGO_BTN}><Eye size={14} /> Xem & gửi chatbot</button>
              )}
              {hasRag && (
                <button onClick={onEdit} style={INDIGO_BTN}><Pencil size={14} /> Chỉnh sửa markdown</button>
              )}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {file.download_url && (
                  <button onClick={() => onDownload(file.download_url, name)} style={GRAY_BTN}><Download size={13} /> Tải xuống</button>
                )}
                <button onClick={handleTogglePrivate} disabled={toggling} style={GRAY_BTN}>
                  {toggling ? <Spinner size={13} /> : <EyeOff size={13} />} {file.is_private ? 'Hiện HS' : 'Ẩn HS'}
                </button>
              </div>
              <button onClick={onDelete} style={RED_BTN}><Trash2 size={13} /> Xóa tài liệu</button>
            </div>
          </div>

          {/* Right: preview */}
          <div style={{ display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 18px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
              <AlertCircle size={14} color="#94a3b8" />
              <span style={{ fontSize:12.5, fontWeight:700, color:'#475569' }}>Xem trước</span>
              <span style={{ fontSize:11.5, color:'#b4becc', marginLeft:'auto' }}>{(extOf(name)).toUpperCase()}</span>
            </div>
            <div style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <FilePreview file={file} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const INDIGO_BTN: React.CSSProperties = { height:40, border:'1px solid #c7d2fe', borderRadius:10, background:'#eef2ff', color:'#4f46e5', fontWeight:700, fontSize:13, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:7, cursor:'pointer', width:'100%' };
const GRAY_BTN: React.CSSProperties   = { height:38, border:'1px solid #e7ecf3', borderRadius:10, background:'#fff', color:'#475569', fontWeight:600, fontSize:12.5, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer' };
const RED_BTN: React.CSSProperties    = { height:38, border:'1px solid #fecaca', borderRadius:10, background:'#fff', color:'#dc2626', fontWeight:600, fontSize:12.5, fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:6, cursor:'pointer' };

export default DetailModal;
