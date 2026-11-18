import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/lib/api/instance';
import type { ContactInput, DailyLogInput, MedicationInput, SeizureInput } from '@/lib/api/endpoints';
import type { MedicationStatus } from '@/lib/api/schemas';

export const keys = {
  dashboard: ['dashboard'] as const,
  doses: ['doses', 'today'] as const,
  medications: ['medications'] as const,
  adherence: (days: number) => ['adherence', days] as const,
  seizures: ['seizures'] as const,
  seizureStats: ['seizures', 'stats'] as const,
  contacts: ['contacts'] as const,
  insights: ['insights'] as const,
  riskHistory: (days: number) => ['risk', 'history', days] as const,
  dailyLog: (date: string) => ['dailyLog', date] as const,
  dailyLogs: ['dailyLogs'] as const,
  devices: ['devices'] as const,
  wearableSummary: ['wearables', 'summary'] as const,
  wearableAlerts: ['wearables', 'alerts'] as const,
  emergencyActive: ['emergency', 'active'] as const,
};

export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: endpoints.dashboard.summary, refetchInterval: 60_000 });
export const useDosesToday = () => useQuery({ queryKey: keys.doses, queryFn: () => endpoints.medications.today().then((r) => r.doses) });
export const useMedications = () => useQuery({ queryKey: keys.medications, queryFn: () => endpoints.medications.list().then((r) => r.medications) });
export const useAdherence = (days = 30) => useQuery({ queryKey: keys.adherence(days), queryFn: () => endpoints.medications.adherence(days) });
export const useSeizures = () => useQuery({ queryKey: keys.seizures, queryFn: () => endpoints.seizures.list(1, 50) });
export const useSeizureStats = () => useQuery({ queryKey: keys.seizureStats, queryFn: endpoints.seizures.stats });
export const useContacts = () => useQuery({ queryKey: keys.contacts, queryFn: () => endpoints.contacts.list().then((r) => r.contacts) });
export const useInsights = () => useQuery({ queryKey: keys.insights, queryFn: endpoints.ai.insights });
export const useRiskHistory = (days = 14) => useQuery({ queryKey: keys.riskHistory(days), queryFn: () => endpoints.ai.riskHistory(days) });
export const useDevices = () => useQuery({ queryKey: keys.devices, queryFn: () => endpoints.wearables.devices().then((r) => r.devices) });
export const useWearableSummary = () => useQuery({ queryKey: keys.wearableSummary, queryFn: () => endpoints.wearables.summary(24) });

/** El registro de un día puede no existir todavía (404): se trata como "sin registro". */
export const useDailyLog = (date: string) =>
  useQuery({
    queryKey: keys.dailyLog(date),
    queryFn: async () => {
      try {
        return (await endpoints.dailyLogs.get(date)).log;
      } catch (e) {
        if (e instanceof Error && 'status' in e && (e as { status: number }).status === 404) return null;
        throw e;
      }
    },
  });

/** Los cambios de medicación, registro o crisis alteran el riesgo: se invalida todo lo derivado. */
function useInvalidate() {
  const qc = useQueryClient();
  return (...queryKeys: (readonly unknown[])[]) => Promise.all(queryKeys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}

export function useLogDose() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { medicationId: string; scheduledFor: string; status: MedicationStatus }) =>
      endpoints.medications.logDose(v.medicationId, v.scheduledFor, v.status),
    onSuccess: () => invalidate(keys.doses, keys.dashboard, ['adherence']),
  });
}

export function useSaveMedication() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { id?: string; data: MedicationInput }) => (v.id ? endpoints.medications.update(v.id, v.data) : endpoints.medications.create(v.data)),
    onSuccess: () => invalidate(keys.medications, keys.doses),
  });
}

export function useDeleteMedication() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => endpoints.medications.remove(id), onSuccess: () => invalidate(keys.medications, keys.doses) });
}

export function useSaveDailyLog() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { date: string; data: DailyLogInput }) => endpoints.dailyLogs.upsert(v.date, v.data),
    onSuccess: (_r, v) => invalidate(keys.dailyLog(v.date), keys.dailyLogs, keys.dashboard, ['risk']),
  });
}

export function useCreateSeizure() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (s: SeizureInput) => endpoints.seizures.create(s),
    onSuccess: () => invalidate(keys.seizures, keys.seizureStats, keys.dashboard),
  });
}

export function useDeleteSeizure() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => endpoints.seizures.remove(id),
    onSuccess: () => invalidate(keys.seizures, keys.seizureStats, keys.dashboard),
  });
}

export function useSaveContact() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { id?: string; data: ContactInput }) => (v.id ? endpoints.contacts.update(v.id, v.data) : endpoints.contacts.create(v.data)),
    onSuccess: () => invalidate(keys.contacts),
  });
}

export function useDeleteContact() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => endpoints.contacts.remove(id), onSuccess: () => invalidate(keys.contacts) });
}

export function useRefreshInsights() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: endpoints.ai.refresh, onSuccess: () => invalidate(keys.insights) });
}
