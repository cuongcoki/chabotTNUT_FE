export type ParseLogService = 'llama' | 'word' | 'excel';
export type ParseLogStatus  = 'success' | 'error';
export type ParseLogChatbotStatus = 'parsed' | 'send_queued' | 'sending' | 'success' | 'failed';

export interface IParseLog {
  id:               string;
  subject_file_id:  string;
  ma_mon:           string;
  ten_mon:          string;
  teacher_id:       string;
  teacher_username: string;
  teacher_name:     string;
  filename:         string;
  file_size:        number;
  service:          ParseLogService;
  status:           ParseLogStatus;
  duration_ms:      number;
  job_id:           string | null;
  error:            string | null;
  preview:          string | null;
  parsed_at:        string;
  sent_to_chatbot:  boolean;
  chatbot_status:   ParseLogChatbotStatus | null;
  rag_chunks:       number | null;
  sent_at:          string | null;
}

export interface IParseLogsQuery {
  status?:          ParseLogStatus;
  service?:         ParseLogService;
  ma_mon?:          string;
  teacher_id?:      string;
  filename?:        string;
  sent_to_chatbot?: boolean;
  date_from?:       string;
  date_to?:         string;
  per_page?:        number;
  page?:            number;
}

export interface IParseLogsMeta {
  total:        number;
  per_page:     number;
  current_page: number;
  last_page:    number;
}

export interface IParseLogsResponse {
  success: boolean;
  data:    IParseLog[];
  meta:    IParseLogsMeta;
}

// ── Stats ───────────────────────────────────────────────
export interface IParseLogStatsParse {
  total:        number;
  success:      number;
  error:        number;
  success_rate: number;
}

export interface IParseLogStatsChatbot {
  sent_success: number;
  send_failed:  number;
  pending_rag:  number;
}

export interface IParseLogStatsByService {
  service:          ParseLogService;
  total:            number;
  success:          number;
  error:            number;
  avg_duration_ms:  number;
  total_size_bytes: number;
}

export interface IParseLogStatsBySubject {
  ma_mon:  string;
  ten_mon: string;
  total:   number;
  success: number;
  error:   number;
}

export interface IParseLogStatsByTeacher {
  teacher_id:       string;
  teacher_username: string;
  teacher_name:     string;
  total:            number;
  success:          number;
}

export interface IParseLogRecentError {
  filename:         string;
  ma_mon:           string;
  ten_mon:          string;
  teacher_username: string;
  teacher_name:     string;
  service:          ParseLogService;
  error:            string;
  created_at:       string;
}

export interface IParseLogStatsInProgress {
  pending:    number;
  processing: number;
  stuck:      number;
}

export interface IParseLogStats {
  parse:         IParseLogStatsParse;
  chatbot:       IParseLogStatsChatbot;
  in_progress:   IParseLogStatsInProgress;
  by_service:    IParseLogStatsByService[];
  by_subject:    IParseLogStatsBySubject[];
  by_teacher:    IParseLogStatsByTeacher[];
  recent_errors: IParseLogRecentError[];
}

export interface IParseLogStatsResponse {
  success: boolean;
  data:    IParseLogStats;
}

// ── In-progress (file đang pending/processing/failed — đọc trực tiếp từ SubjectFile) ──
export type ParseLogInProgressStatus = 'pending' | 'processing' | 'failed';

export interface IParseLogInProgress {
  id:               string;
  ma_mon:           string;
  ten_mon:          string;
  teacher_id:       string;
  teacher_username: string;
  teacher_name:     string;
  filename:         string;
  file_size:        number;
  type:             string;
  type_label:       string;
  service:          ParseLogService;
  status:           ParseLogInProgressStatus;
  step:             'parse' | 'send' | null;
  error:            string | null;
  elapsed_seconds:  number;
  stuck:            boolean;
  updated_at:       string;
  created_at:       string;
}

export interface IParseLogsInProgressQuery {
  status?: ParseLogInProgressStatus;
}

export interface IParseLogsInProgressMeta {
  total:      number;
  pending:    number;
  processing: number;
  failed:     number;
  stuck:      number;
}

export interface IParseLogsInProgressResponse {
  success: boolean;
  data:    IParseLogInProgress[];
  meta:    IParseLogsInProgressMeta;
}
