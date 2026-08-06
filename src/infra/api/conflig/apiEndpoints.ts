export const API_ENDPOINTS = {
  AUTH: {
    LOGIN:    '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT:   '/auth/logout',
    REFRESH:  '/auth/refresh',
    ME:       '/auth/me',
  },

  ME: {
    PROFILE:         '/me',
    UPDATE_PROFILE:  '/me',
    UPLOAD_AVATAR:   '/me/avatar',
    CHANGE_PASSWORD: '/me/password',
  },

  ADMIN: {
    // Users
    USERS_LIST:    '/admin/users',
    USERS_DETAIL:  (id: string) => `/admin/users/${id}`,
    USER_BLOCK:    (id: string) => `/admin/users/${id}/block`,
    USER_UNBLOCK:  (id: string) => `/admin/users/${id}/unblock`,

    // Parse logs
    PARSE_LOGS:             '/admin/parse-logs',
    PARSE_LOGS_STATS:       '/admin/parse-logs/stats',
    PARSE_LOGS_IN_PROGRESS: '/admin/parse-logs/in-progress',

    // LlamaParse API key (chỉ 1 key duy nhất, không có {id})
    LLAMA_PARSE_KEY:             '/admin/api-settings/llama-parse',
    LLAMA_PARSE_KEY_CHECK_USAGE: '/admin/api-settings/llama-parse/check-usage',
    LLAMA_PARSE_KEY_REVEAL:      '/admin/api-settings/llama-parse/reveal',

    // Notifications — chưa có ở backend, xem docs/backend-todo.md
    NOTIFICATIONS:          '/admin/notifications',
    NOTIFICATION_READ:      (id: string) => `/admin/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/admin/notifications/read-all',

    // Subjects list — endpoint public (không có prefix /admin), dùng để làm dropdown
    SUBJECTS: '/subjects',

    // Analytics (admin-only)
    ANALYTICS_KNOWLEDGE_MAP: '/admin/analytics/knowledge-map',
    ANALYTICS_WEEKLY:        '/admin/analytics/weekly',
    ANALYTICS_REPORT:        '/admin/analytics/report',
  },

  TEACHER: {
    SEMESTERS:        '/teacher/semesters',
    SEMESTER_COURSES: (hocKy: number) => `/teacher/semesters/${hocKy}`,
    COURSE_STUDENTS:   (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/students`,
    COURSE_ANALYTICS:  (idToHoc: string) => `/teacher/courses/${encodeURIComponent(idToHoc)}/analytics`,
    SUBJECT_ANALYTICS: (maMon: string)   => `/teacher/subjects/${maMon}/analytics`,

    // File management
    SUBJECT_FILES:        (s: string) => `/teacher/subjects/${s}/files`,
    SUBJECT_FILES_TREE:   (s: string) => `/teacher/subjects/${s}/files/tree`,
    SUBJECT_FILE:         (s: string, f: string) => `/teacher/subjects/${s}/files/${f}`,
    SUBJECT_FILES_SENT:   (s: string) => `/teacher/subjects/${s}/files/sent`,
    SUBJECT_FILE_MARKDOWN:(s: string, f: string) => `/teacher/subjects/${s}/files/${f}/markdown`,
    SUBJECT_FILE_SUBMIT:  (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/submit`,
    SUBJECT_FILES_BATCH:  (s: string) => `/teacher/subjects/${s}/files/submit-batch`,
    SUBJECT_FILE_SEND:    (s: string) => `/teacher/subjects/${s}/files/send-to-api`,
    SUBJECT_FILE_DEL_SENT:(s: string, f: string) => `/teacher/subjects/${s}/files/${f}/sent`,
    FILE_CANCEL_SEND:     (f: string) => `/teacher/files/${f}/cancel-send`,
    FILES_RESEND:         '/teacher/files/resend',

    // Notifications
    NOTIFICATIONS:          '/teacher/notifications',
    NOTIFICATION_READ:      (id: string) => `/teacher/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/teacher/notifications/read-all',

    // Legacy aliases (kept for backward compat with existing drawers)
    SUBJECT_AI_FILES:     (s: string) => `/teacher/subjects/${s}/files/sent`,
    SUBJECT_AI_SEND:      (s: string) => `/teacher/subjects/${s}/files/send-to-api`,
    SUBJECT_AI_FILE_DEL:  (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/sent`,
    SUBJECT_AI_RESEND:    (s: string, f: string) => `/teacher/subjects/${s}/files/${f}/resend`,
  },

  CHAT: {
    SESSION:         '/chat/session',
    SESSIONS:        '/chat/sessions',
    SESSION_HISTORY: (id: string) => `/chat/sessions/${id}/history`,
    SESSION_DELETE:  (id: string) => `/chat/sessions/${id}`,
    EXAM:            (examId: string) => `/chat/exam/${examId}`,
    STREAM:          '/chat/stream',
    FEEDBACK:        '/chat/feedback',
    RATING:          '/chat/rating',
    ANALYTICS_SUMMARY: '/chat/analytics/summary',
  },

  ADVISOR: {
    SESSION:         '/advisor/session',
    SESSIONS:        '/advisor/sessions',
    SESSION_DETAIL:  (id: string) => `/advisor/sessions/${id}`,
    SESSION_DELETE:  (id: string) => `/advisor/sessions/${id}`,
    SESSION_TOKEN:   (id: string) => `/advisor/sessions/${id}/token`,
    CHAT:            '/advisor/chat',
    STREAM:          '/advisor/chat/stream',
    FEEDBACK:        '/advisor/feedback',
    RATING:          '/advisor/rating',
    ANALYTICS_SUMMARY: '/advisor/analytics/summary',
    ANALYTICS_TREND:   '/advisor/analytics/trend',

    // Dashboard CVHT — Tầng 1/2/3 (xem DASHBOARD_CVHT.md)
    PORTAL_STUDENT_INFO: '/advisor/portal/student-info',
    CLASS_RISK:          '/advisor/analytics/class-risk',
    ADOPTION_RATE:       '/advisor/analytics/adoption-rate',
    RISK_OVERVIEW:       '/advisor/analytics/risk-overview',
    USER_HISTORY:        '/advisor/analytics/user-history',
    STUDENT_ACTIVITY:    '/advisor/analytics/student-activity',
    TOP_KEYWORDS:        '/advisor/analytics/top-keywords',
    TOPIC_GROUPS:        '/advisor/analytics/topic-groups',
    LAST_RECOMMENDATION: '/advisor/analytics/last-recommendation',
  },

  EXAM: {
    CONFIRM: (subjectId: string) => `/teacher/subjects/${subjectId}/exams/confirm`,
    LIST:    '/teacher/exams',
    DETAIL:  (id: string) => `/teacher/exams/${id}`,
    DELETE:  (id: string) => `/teacher/exams/${id}`,
  },

  ASSIGNMENT: {
    ASSIGN:     (examId: string) => `/teacher/exams/${examId}/assign`,
    LIST:       '/teacher/assignments',
    DETAIL:     (id: string) => `/teacher/assignments/${id}`,
    UPDATE:     (id: string) => `/teacher/assignments/${id}`,
    DELETE:     (id: string) => `/teacher/assignments/${id}`,
    REMIND:     (id: string) => `/teacher/assignments/${id}/remind`,
    REMIND_ALL: (id: string) => `/teacher/assignments/${id}/remind-all`,
    EXPORT:     (id: string) => `/teacher/assignments/${id}/export`,
    STUDENT_DETAIL: (id: string, studentCode: string) => `/teacher/assignments/${id}/students/${encodeURIComponent(studentCode)}`,
  },

  STUDENT_ASSIGNMENT: {
    LIST:   '/student/assignments',
    DETAIL: (id: string) => `/student/assignments/${id}`,
    START:  (id: string) => `/student/assignments/${id}/start`,
    SUBMIT: (id: string) => `/student/assignments/${id}/submit`,
  },

  STUDENT: {
    SUBJECTS:          '/student/subjects',
    SEMESTERS:         '/student/semesters',
    SEMESTER_SUBJECTS: (hocKy: number) => `/student/semesters/${hocKy}/subjects`,
    EXAM_STATUS:       (userId: string, maMon: string) => `/chatbot/student-exam-status?user_id=${encodeURIComponent(userId)}&ma_mon=${encodeURIComponent(maMon)}`,
    DASHBOARD_OVERVIEW: (semesterFrom?: string, hocKy?: number) => {
      const params = new URLSearchParams();
      if (semesterFrom) params.set('semester_from', semesterFrom);
      if (hocKy)        params.set('hoc_ky', String(hocKy));
      const qs = params.toString();
      return `/student/dashboard/overview${qs ? `?${qs}` : ''}`;
    },
    DASHBOARD_SUBJECT: (maMon: string, hocKy?: number) => {
      const params = new URLSearchParams({ ma_mon: maMon });
      if (hocKy) params.set('hoc_ky', String(hocKy));
      return `/student/dashboard?${params.toString()}`;
    },

    // Notifications
    NOTIFICATIONS:          '/student/notifications',
    NOTIFICATION_READ:      (id: string) => `/student/notifications/${id}/read`,
    NOTIFICATIONS_READ_ALL: '/student/notifications/read-all',
  },

  FILES: {
    DOWNLOAD: (fileId: string) => `/files/${fileId}/download`,
  },
} as const;