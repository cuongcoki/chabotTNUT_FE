import { type ComponentType, createElement, type FC, useEffect, useMemo, useRef, useState } from 'react';
import {
  X, Send, Pencil, Loader2, Maximize2, Minimize2,
  Heading1, Heading2, Heading3, Bold, Italic, Code, Quote,
  List, ListOrdered, Link2, Table2, Minus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TeacherApi from '@/infra/teacher/teacher_api';
import type { ISubjectFile } from '@/infra/api/interfaces/ITeacher';
import { Spinner } from './shared';

interface Props {
  maMon: string;
  file: ISubjectFile;
  onClose: () => void;
  onSubmit: (fileId: string, markdown: string) => void;
}

// ── Block-level components tagged with data-line so click-sync can map
// preview blocks back to the exact source line they were rendered from.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withLine = (tag: string) => ({ node, ...rest }: any) =>
  createElement(tag, { ...rest, 'data-line': node?.position?.start?.line });

const MD_LINE_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'table', 'pre', 'hr'] as const;

interface ToolDef {
  icon: ComponentType<{ size?: number }>;
  title: string;
  run: (ctx: { wrap: (b: string, a: string, ph: string) => void; linePrefix: (p: string) => void; block: (t: string) => void }) => void;
}

const TOOLS: ToolDef[] = [
  { icon: Heading1,    title: 'Tiêu đề 1',        run: ({ linePrefix }) => linePrefix('# ') },
  { icon: Heading2,    title: 'Tiêu đề 2',        run: ({ linePrefix }) => linePrefix('## ') },
  { icon: Heading3,    title: 'Tiêu đề 3',        run: ({ linePrefix }) => linePrefix('### ') },
  { icon: Bold,        title: 'In đậm',           run: ({ wrap }) => wrap('**', '**', 'chữ đậm') },
  { icon: Italic,      title: 'In nghiêng',       run: ({ wrap }) => wrap('*', '*', 'chữ nghiêng') },
  { icon: Code,        title: 'Code',             run: ({ wrap }) => wrap('`', '`', 'code') },
  { icon: Quote,       title: 'Trích dẫn',        run: ({ linePrefix }) => linePrefix('> ') },
  { icon: List,        title: 'Danh sách',        run: ({ linePrefix }) => linePrefix('- ') },
  { icon: ListOrdered, title: 'Danh sách số',     run: ({ linePrefix }) => linePrefix('1. ') },
  { icon: Link2,       title: 'Liên kết',         run: ({ wrap }) => wrap('[', '](https://)', 'văn bản liên kết') },
  { icon: Table2,      title: 'Bảng',             run: ({ block }) => block('| Cột 1 | Cột 2 |\n| --- | --- |\n| Nội dung | Nội dung |') },
  { icon: Minus,       title: 'Đường kẻ ngang',   run: ({ block }) => block('---') },
];

const MarkdownModal: FC<Props> = ({ maMon, file, onClose, onSubmit }) => {
  const [draft,      setDraft]      = useState('');
  const [loading,    setLoad]       = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const editorRef  = useRef<HTMLTextAreaElement>(null);
  const gutterRef   = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    TeacherApi.getFileMarkdown(maMon, file.id)
      .then(r => setDraft(r.data.markdown ?? ''))
      .catch(() => toast.error('Không thể tải markdown.'))
      .finally(() => setLoad(false));
  }, [maMon, file.id]);

  const mdComponents = useMemo(() => {
    const map: Record<string, ReturnType<typeof withLine>> = {};
    MD_LINE_TAGS.forEach(t => { map[t] = withLine(t); });
    return map;
  }, []);

  // ── Toolbar: insert markdown syntax at cursor ────────────────
  const wrapSelection = (before: string, after: string, placeholder: string) => {
    const ta = editorRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const selected = draft.slice(start, end) || placeholder;
    const next = draft.slice(0, start) + before + selected + after + draft.slice(end);
    setDraft(next);
    const selStart = start + before.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(selStart, selStart + selected.length);
    });
  };

  const insertLinePrefix = (prefix: string) => {
    const ta = editorRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const lineStart = draft.lastIndexOf('\n', pos - 1) + 1;
    const next = draft.slice(0, lineStart) + prefix + draft.slice(lineStart);
    setDraft(next);
    const p = pos + prefix.length;
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(p, p); });
  };

  const insertBlock = (text: string) => {
    const ta = editorRef.current;
    if (!ta) return;
    const pos = ta.selectionStart;
    const needsNlBefore = pos > 0 && draft[pos - 1] !== '\n';
    const block = (needsNlBefore ? '\n\n' : '') + text + '\n\n';
    const next = draft.slice(0, pos) + block + draft.slice(pos);
    setDraft(next);
    const p = pos + block.length;
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(p, p); });
  };

  // ── Editor <-> Preview scroll gutter ──────────────────────────
  const handleEditorScroll = () => {
    if (gutterRef.current && editorRef.current) gutterRef.current.scrollTop = editorRef.current.scrollTop;
  };

  // ── Click-sync: editor position -> scroll preview to matching block ──
  const scrollPreviewToLine = (line: number) => {
    const container = previewRef.current;
    if (!container) return;
    const nodes = Array.from(container.querySelectorAll<HTMLElement>('[data-line]'));
    if (!nodes.length) return;
    let target = nodes[0];
    for (const n of nodes) {
      const l = Number(n.dataset.line);
      if (Number.isFinite(l) && l <= line) target = n; else break;
    }
    const top = target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
    container.scrollTo({ top: Math.max(0, top - 14), behavior: 'smooth' });
    target.classList.remove('tdf-md-flash');
    void target.offsetWidth; // restart animation
    target.classList.add('tdf-md-flash');
  };

  const handleEditorClick = () => {
    const ta = editorRef.current;
    if (!ta) return;
    const line = draft.slice(0, ta.selectionStart).split('\n').length;
    scrollPreviewToLine(line);
  };

  // ── Click-sync: preview block -> move editor cursor + scroll to matching line ──
  const handlePreviewClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-line]');
    if (!el) return;
    const line = Number(el.dataset.line);
    const ta = editorRef.current;
    if (!ta || !Number.isFinite(line)) return;
    const lines = draft.split('\n');
    const idx = Math.max(0, Math.min(line - 1, lines.length - 1));
    const charPos = lines.slice(0, idx).reduce((acc, l) => acc + l.length + 1, 0);
    ta.focus();
    ta.setSelectionRange(charPos, charPos + (lines[idx]?.length ?? 0));
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 22;
    const targetTop = lh * idx - ta.clientHeight / 2 + lh;
    ta.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  };

  const lineCount = draft.split('\n').length;

  return (
    <div className="tdf-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div
        className="tdf-panel"
        style={fullscreen
          ? { position:'fixed', inset:0, width:'100vw', height:'100vh', borderRadius:0, display:'flex', flexDirection:'column' }
          : { width:'min(1280px,97vw)', height:'min(88vh,840px)', display:'flex', flexDirection:'column' }}
      >

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:13, padding:'16px 22px', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <div style={{ width:38, height:38, borderRadius:11, background:'#eef2ff', color:'#4f46e5', display:'flex', alignItems:'center', justifyContent:'center' }}><Pencil size={18} /></div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:16, fontWeight:800, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{file.original_name}</div>
            <div style={{ fontSize:12.5, color:'#94a3b8' }}>Chỉnh sửa Markdown · xem trước realtime trước khi gửi chatbot</div>
          </div>
          <button onClick={() => setFullscreen(v => !v)} title={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'} style={{ width:34, height:34, borderRadius:10, border:'1px solid #e7ecf3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}>
            {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button onClick={onClose} style={{ width:34, height:34, borderRadius:10, border:'1px solid #e7ecf3', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#64748b' }}><X size={16} /></button>
        </div>

        {/* Split pane */}
        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Spinner size={28} color="#4f46e5" />
          </div>
        ) : (
          <div className="tdf-mdsplit">
            {/* Editor */}
            <div style={{ display:'flex', flexDirection:'column', minHeight:0, minWidth:0, borderRight:'1px solid #eef2f7' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderBottom:'1px solid #f1f5f9', background:'#fbfcfe', flexShrink:0 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#4f46e5' }} />
                <span style={{ fontSize:12, fontWeight:700, color:'#475569', letterSpacing:.3 }}>MARKDOWN GỐC</span>
                <span style={{ fontSize:11, color:'#b4becc', marginLeft:'auto' }}>{lineCount} dòng · {draft.length} ký tự</span>
              </div>

              {/* Toolbar */}
              <div style={{ display:'flex', alignItems:'center', gap:3, padding:'6px 10px', borderBottom:'1px solid #f1f5f9', background:'#fff', flexShrink:0, flexWrap:'wrap' }}>
                {TOOLS.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    title={t.title}
                    className="tdf-mdtool-btn"
                    onClick={() => t.run({ wrap: wrapSelection, linePrefix: insertLinePrefix, block: insertBlock })}
                  >
                    <t.icon size={14} />
                  </button>
                ))}
              </div>

              {/* Gutter + textarea */}
              <div style={{ flex:1, minHeight:0, minWidth:0, display:'flex', overflow:'hidden' }}>
                <div ref={gutterRef} className="tdf-mdgutter" aria-hidden="true">
                  {Array.from({ length: lineCount }, (_, i) => <div key={i}>{i + 1}</div>)}
                </div>
                <textarea
                  ref={editorRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onScroll={handleEditorScroll}
                  onClick={handleEditorClick}
                  spellCheck={false}
                  wrap="off"
                  style={{ flex:1, minWidth:0, minHeight:0, border:'none', outline:'none', resize:'none', padding:'18px 20px', fontFamily:'monospace', fontSize:13, lineHeight:'22px', whiteSpace:'pre', overflow:'auto', color:'#334155', background:'#fff' }}
                />
              </div>
            </div>

            {/* Preview */}
            <div style={{ display:'flex', flexDirection:'column', minHeight:0, minWidth:0, background:'#fcfdff' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 18px', borderBottom:'1px solid #f1f5f9', background:'#fbfcfe', flexShrink:0 }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:'#2563eb' }} />
                <span style={{ fontSize:12, fontWeight:700, color:'#475569', letterSpacing:.3 }}>XEM TRƯỚC</span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:'#16a34a', background:'#ecfdf3', padding:'2px 8px', borderRadius:999, marginLeft:'auto' }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'#16a34a' }} /> Live
                </span>
              </div>
              <div ref={previewRef} onClick={handlePreviewClick} style={{ flex:1, minWidth:0, overflow:'auto', padding:'20px 24px' }}>
                <div className="tdf-md">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>{draft}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 22px', borderTop:'1px solid #f1f5f9', background:'#fbfcfe', flexShrink:0 }}>
          <span style={{ fontSize:12, color:'#94a3b8' }}>Nội dung được gửi tới chatbot AI (RAG).</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ height:42, padding:'0 18px', borderRadius:11, border:'1px solid #e7ecf3', background:'#fff', color:'#475569', fontWeight:600, fontSize:13.5, fontFamily:'inherit', cursor:'pointer' }}>Đóng</button>
            <button onClick={() => { setSaving(true); onSubmit(file.id, draft); }} disabled={loading || !draft || saving}
              style={{ height:42, padding:'0 20px', borderRadius:11, border:'none', background:'linear-gradient(135deg,#4f46e5,#4338ca)', color:'#fff', fontWeight:700, fontSize:13.5, fontFamily:'inherit', display:'flex', alignItems:'center', gap:8, cursor:'pointer', boxShadow:'0 6px 16px rgba(79,70,229,.24)', opacity:(loading||!draft||saving) ? .5 : 1 }}>
              {saving ? <><Loader2 size={14} style={{ animation:'tdf-spin 1s linear infinite' }} /> Đang gửi...</> : <><Send size={14} /> Gửi sang chatbot</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarkdownModal;
