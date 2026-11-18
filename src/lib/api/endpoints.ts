import type { ApiClient } from './client';
import {
  activeEmergenciesSchema,
  adherenceSchema,
  alertsResponseSchema,
  authResponseSchema,
  contactResponseSchema,
  contactsResponseSchema,
  dailyLogResponseSchema,
  dailyLogsResponseSchema,
  dashboardSchema,
  deviceResponseSchema,
  devicesResponseSchema,
  emergencyEventResponseSchema,
  emergencyOutcomeSchema,
  ingestResponseSchema,
  insightsResponseSchema,
  liveSamplesSchema,
  meResponseSchema,
  medicationResponseSchema,
  medicationSearchSchema,
  medicationsResponseSchema,
  riskHistorySchema,
  riskTodaySchema,
  scheduleResponseSchema,
  seizureListSchema,
  seizureResponseSchema,
  seizureStatsSchema,
  wearableSummarySchema,
  type MedicationStatus,
} from './schemas';
import type { SampleInput } from '@/lib/ble/SampleUploader';

export interface ContactInput {
  name: string;
  relationship?: string | null;
  phone?: string | null;
  email?: string | null;
  priority: number;
  notifySms: boolean;
  notifyEmail: boolean;
}

export interface MedicationInput {
  name: string;
  dose?: string | null;
  unit?: string | null;
  scheduleTimes: string[];
  active?: boolean;
  notes?: string | null;
}

export interface DailyLogInput {
  sleepHours?: number | null;
  stressLevel?: number | null;
  caffeineMg?: number | null;
  exerciseMinutes?: number | null;
  mood?: number | null;
  alcoholUnits?: number | null;
  notes?: string | null;
}

export interface SeizureInput {
  startedAt: string;
  durationSeconds?: number | null;
  severity?: number | null;
  seizureType?: string | null;
  triggersNoted?: string[];
  location?: string | null;
  notes?: string | null;
}

/** Funciones tipadas, una por endpoint del contrato. Cada una valida la respuesta con zod. */
export function createEndpoints(api: ApiClient) {
  return {
    auth: {
      login: (email: string, password: string) =>
        api.post('/auth/login', { auth: false, body: { email, password }, schema: authResponseSchema }),
      register: (input: { email: string; password: string; fullName: string; birthDate?: string; timezone?: string }) =>
        api.post('/auth/register', { auth: false, body: input, schema: authResponseSchema }),
      me: () => api.get('/auth/me', { schema: meResponseSchema }),
      logout: (refreshToken?: string) => api.post('/auth/logout', { body: { refreshToken } }),
    },
    dashboard: { summary: () => api.get('/dashboard/summary', { schema: dashboardSchema }) },
    contacts: {
      list: () => api.get('/contacts', { schema: contactsResponseSchema }),
      create: (c: ContactInput) => api.post('/contacts', { body: c, schema: contactResponseSchema }),
      update: (id: string, c: Partial<ContactInput>) => api.put(`/contacts/${id}`, { body: c, schema: contactResponseSchema }),
      remove: (id: string) => api.delete(`/contacts/${id}`),
    },
    medications: {
      list: () => api.get('/medications', { schema: medicationsResponseSchema }),
      create: (m: MedicationInput) => api.post('/medications', { body: m, schema: medicationResponseSchema }),
      update: (id: string, m: Partial<MedicationInput>) => api.put(`/medications/${id}`, { body: m, schema: medicationResponseSchema }),
      remove: (id: string) => api.delete(`/medications/${id}`),
      search: (q: string) => api.get('/medications/search', { query: { q, limit: 8 }, schema: medicationSearchSchema }),
      today: () => api.get('/medications/schedule/today', { schema: scheduleResponseSchema }),
      logDose: (medicationId: string, scheduledFor: string, status: MedicationStatus) =>
        api.post('/medications/logs', { body: { medicationId, scheduledFor, status } }),
      adherence: (days = 30) => api.get('/medications/adherence', { query: { days }, schema: adherenceSchema }),
    },
    dailyLogs: {
      range: (from?: string, to?: string) => api.get('/daily-logs', { query: { from, to }, schema: dailyLogsResponseSchema }),
      get: (date: string) => api.get(`/daily-logs/${date}`, { schema: dailyLogResponseSchema }),
      upsert: (date: string, input: DailyLogInput) => api.put(`/daily-logs/${date}`, { body: input, schema: dailyLogResponseSchema }),
    },
    seizures: {
      list: (page = 1, limit = 20) => api.get('/seizures', { query: { page, limit }, schema: seizureListSchema }),
      create: (s: SeizureInput) => api.post('/seizures', { body: s, schema: seizureResponseSchema }),
      remove: (id: string) => api.delete(`/seizures/${id}`),
      stats: () => api.get('/seizures/stats', { schema: seizureStatsSchema }),
    },
    emergency: {
      trigger: (input: { latitude?: number; longitude?: number; note?: string }) =>
        api.post('/emergency', { body: input, schema: emergencyOutcomeSchema }),
      resolve: (id: string) => api.post(`/emergency/${id}/resolve`, { schema: emergencyEventResponseSchema }),
      falseAlarm: (id: string) => api.post(`/emergency/${id}/false-alarm`, { schema: emergencyEventResponseSchema }),
      active: () => api.get('/emergency/active', { schema: activeEmergenciesSchema }),
    },
    ai: {
      insights: () => api.get('/ai/insights', { schema: insightsResponseSchema }),
      refresh: () => api.post('/ai/insights/refresh', { schema: insightsResponseSchema }),
      riskToday: () => api.get('/ai/risk/today', { schema: riskTodaySchema }),
      riskHistory: (days = 30) => api.get('/ai/risk/history', { query: { days }, schema: riskHistorySchema }),
    },
    wearables: {
      devices: () => api.get('/wearables/devices', { schema: devicesResponseSchema }),
      registerDevice: (input: { provider: 'web_bluetooth' | 'apple_health' | 'google_health' | 'manual'; deviceName?: string; externalId?: string }) =>
        api.post('/wearables/devices', { body: input, schema: deviceResponseSchema }),
      removeDevice: (id: string) => api.delete(`/wearables/devices/${id}`),
      sendSamples: (samples: SampleInput[], deviceId?: string) =>
        api.post('/wearables/samples', { body: { deviceId, samples }, schema: ingestResponseSchema }),
      live: (minutes = 10) => api.get('/wearables/live', { query: { minutes }, schema: liveSamplesSchema }),
      summary: (hours = 24) => api.get('/wearables/summary', { query: { hours }, schema: wearableSummarySchema }),
      alerts: () => api.get('/wearables/alerts', { schema: alertsResponseSchema }),
      escalate: (id: string) => api.post(`/wearables/alerts/${id}/escalate`),
    },
  };
}

export type Endpoints = ReturnType<typeof createEndpoints>;
