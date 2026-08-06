import type { IFileType, IFileExternalStatus } from '@/infra/api/interfaces/ITeacher';

export const TYPE_ORDER: IFileType[] = [
  'de_cuong', 'ly_thuyet', 'ma_tran_cau_hoi', 'ngan_hang_cau_hoi', 'khac',
];

export const TYPE_LABEL: Record<IFileType, string> = {
  de_cuong:          'Đề cương môn học',
  ly_thuyet:         'Tài liệu lý thuyết',
  ma_tran_cau_hoi:   'Bảng cấu trúc đề thi',
  ngan_hang_cau_hoi: 'Ngân hàng câu hỏi',
  khac:              'Khác',
};

export const FILE_TYPES = TYPE_ORDER.map(v => ({ value: v, label: TYPE_LABEL[v] }));

export const POLLING_STATUSES: IFileExternalStatus[] = ['pending', 'processing', 'send_queued', 'sending'];

export const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  pending:     { label:'Chờ parse',   bg:'#fff7ed', color:'#d97706' },
  processing:  { label:'Đang parse',  bg:'#eef2ff', color:'#4338ca' },
  parsed:      { label:'Cần review',  bg:'#fef3f2', color:'#dc2626' },
  send_queued: { label:'Chờ gửi AI', bg:'#eef2ff', color:'#4f46e5' },
  sending:     { label:'Đang gửi...', bg:'#eff5ff', color:'#2563eb' },
  success:     { label:'Đã embed',   bg:'#ecfdf3', color:'#16a34a' },
  failed:      { label:'Thất bại',   bg:'#fef2f2', color:'#dc2626' },
};

export const STATUS_FILTER_LABELS = {
  all:     'Tất cả',
  sent:    'Đã gửi AI',
  review:  'Cần review',
  parsing: 'Đang parse',
  hidden:  'Đã ẩn',
} as const;
