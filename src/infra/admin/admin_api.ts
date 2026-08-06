import axiosInstance from '@/infra/api/conflig/axiosInstance';
import { API_ENDPOINTS } from '@/infra/api/conflig/apiEndpoints';
import type {
  IParseLogsQuery,
  IParseLogsResponse,
  IParseLogStatsResponse,
  IParseLogsInProgressQuery,
  IParseLogsInProgressResponse,
} from '@/infra/api/interfaces/IParseLog';
import type {
  IApiKeySettingResponse,
  IUpsertApiKeyRequest,
  IDeleteApiKeyResponse,
  IApiKeyUsageResponse,
  IRevealApiKeyRequest,
  IRevealApiKeyResponse,
} from '@/infra/api/interfaces/IApiKey';
import type {
  INotificationsQuery,
  INotificationsResponse,
  IMarkNotificationReadResponse,
  IMarkAllNotificationsReadResponse,
} from '@/infra/api/interfaces/INotification';
import type {
  ISubjectsResponse,
  IKnowledgeMapResponse,
  IWeeklyAnalyticsResponse,
  IReportResponse,
} from '@/infra/api/interfaces/IAnalytics';

class AdminApi {
  // ── Parse logs ────────────────────────────────────────────
  async getParseLogs(query?: IParseLogsQuery): Promise<IParseLogsResponse> {
    const res = await axiosInstance.get<IParseLogsResponse>(
      API_ENDPOINTS.ADMIN.PARSE_LOGS,
      { params: query }
    );
    return res.data;
  }

  async getParseLogStats(): Promise<IParseLogStatsResponse> {
    const res = await axiosInstance.get<IParseLogStatsResponse>(
      API_ENDPOINTS.ADMIN.PARSE_LOGS_STATS
    );
    return res.data;
  }

  async getParseLogsInProgress(query?: IParseLogsInProgressQuery): Promise<IParseLogsInProgressResponse> {
    const res = await axiosInstance.get<IParseLogsInProgressResponse>(
      API_ENDPOINTS.ADMIN.PARSE_LOGS_IN_PROGRESS,
      { params: query }
    );
    return res.data;
  }

  // ── LlamaParse API key ───────────────────────────────────
  async getLlamaParseKey(): Promise<IApiKeySettingResponse | null> {
    try {
      const res = await axiosInstance.get<IApiKeySettingResponse>(API_ENDPOINTS.ADMIN.LLAMA_PARSE_KEY);
      return res.data;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) return null;
      throw err;
    }
  }

  async upsertLlamaParseKey(data: IUpsertApiKeyRequest): Promise<IApiKeySettingResponse> {
    const res = await axiosInstance.put<IApiKeySettingResponse>(API_ENDPOINTS.ADMIN.LLAMA_PARSE_KEY, data);
    return res.data;
  }

  async deleteLlamaParseKey(): Promise<IDeleteApiKeyResponse> {
    const res = await axiosInstance.delete<IDeleteApiKeyResponse>(API_ENDPOINTS.ADMIN.LLAMA_PARSE_KEY);
    return res.data;
  }

  async checkLlamaParseUsage(): Promise<IApiKeyUsageResponse> {
    const res = await axiosInstance.get<IApiKeyUsageResponse>(API_ENDPOINTS.ADMIN.LLAMA_PARSE_KEY_CHECK_USAGE);
    return res.data;
  }

  async revealLlamaParseKey(data: IRevealApiKeyRequest): Promise<IRevealApiKeyResponse> {
    const res = await axiosInstance.post<IRevealApiKeyResponse>(API_ENDPOINTS.ADMIN.LLAMA_PARSE_KEY_REVEAL, data);
    return res.data;
  }

  // ── Notifications — chưa có ở backend, xem docs/backend-todo.md ──
  async getNotifications(query?: INotificationsQuery): Promise<INotificationsResponse> {
    const res = await axiosInstance.get<INotificationsResponse>(
      API_ENDPOINTS.ADMIN.NOTIFICATIONS,
      { params: query }
    );
    return res.data;
  }

  async markNotificationRead(id: string): Promise<IMarkNotificationReadResponse> {
    const res = await axiosInstance.post<IMarkNotificationReadResponse>(
      API_ENDPOINTS.ADMIN.NOTIFICATION_READ(id)
    );
    return res.data;
  }

  async markAllNotificationsRead(): Promise<IMarkAllNotificationsReadResponse> {
    const res = await axiosInstance.post<IMarkAllNotificationsReadResponse>(
      API_ENDPOINTS.ADMIN.NOTIFICATIONS_READ_ALL
    );
    return res.data;
  }

  // ── Analytics ──────────────────────────────────────────────
  async getSubjects(): Promise<ISubjectsResponse> {
    const res = await axiosInstance.get<ISubjectsResponse>(API_ENDPOINTS.ADMIN.SUBJECTS);
    return res.data;
  }

  async getKnowledgeMap(subjectId: string, days?: number): Promise<IKnowledgeMapResponse> {
    const res = await axiosInstance.get<IKnowledgeMapResponse>(
      API_ENDPOINTS.ADMIN.ANALYTICS_KNOWLEDGE_MAP,
      { params: { subject_id: subjectId, ...(days ? { days } : {}) } }
    );
    return res.data;
  }

  async getWeeklyAnalytics(): Promise<IWeeklyAnalyticsResponse> {
    const res = await axiosInstance.get<IWeeklyAnalyticsResponse>(API_ENDPOINTS.ADMIN.ANALYTICS_WEEKLY);
    return res.data;
  }

  async getReport(subjectId: string, days?: number): Promise<IReportResponse> {
    const res = await axiosInstance.get<IReportResponse>(
      API_ENDPOINTS.ADMIN.ANALYTICS_REPORT,
      { params: { subject_id: subjectId, ...(days ? { days } : {}) } }
    );
    return res.data;
  }
}

export default new AdminApi();
