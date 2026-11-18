import { z } from 'zod';

export const riskLevelSchema = z.enum(['low', 'moderate', 'high', 'critical']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  fullName: z.string(),
  birthDate: z.string().nullable().optional(),
  timezone: z.string().optional(),
  role: z.enum(['patient', 'caregiver', 'admin']).optional(),
});
export type User = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export const meResponseSchema = z.object({ user: userSchema });

export const riskFactorSchema = z.object({
  name: z.string(),
  impact: z.number(),
  direction: z.enum(['up', 'down']),
  detail: z.string(),
});
export type RiskFactor = z.infer<typeof riskFactorSchema>;

export const heartAlertKindSchema = z.enum(['tachycardia', 'motion_convulsive', 'hr_anomaly', 'fall']);

export const wearableAlertSchema = z.object({
  id: z.string(),
  detectedAt: z.string(),
  kind: heartAlertKindSchema,
  confidence: z.number(),
  convertedEventId: z.string().nullable().optional(),
});
export type WearableAlert = z.infer<typeof wearableAlertSchema>;

export const dashboardSchema = z.object({
  risk: z.object({
    score: z.number(),
    level: riskLevelSchema,
    factors: z.array(riskFactorSchema),
    confidence: z.number().optional(),
    degraded: z.boolean().optional(),
  }),
  adherence: z.object({
    rate: z.number().nullable(),
    last7Rate: z.number().nullable(),
    streakDays: z.number(),
  }),
  lastSeizure: z
    .object({
      id: z.string(),
      startedAt: z.string(),
      severity: z.number().nullable(),
      durationSeconds: z.number().nullable(),
    })
    .nullable(),
  seizureFreeStreakDays: z.number().nullable(),
  currentHeartRate: z.number().nullable(),
  activeAlerts: z.object({ count: z.number(), items: z.array(wearableAlertSchema) }),
  activeEmergencies: z.number(),
});
export type DashboardSummary = z.infer<typeof dashboardSchema>;

export const medicationStatusSchema = z.enum(['taken', 'missed', 'skipped', 'pending']);
export type MedicationStatus = z.infer<typeof medicationStatusSchema>;

/** El API en produccion devuelve la dosis como numero (NUMERIC) y en memoria como texto: se normaliza a texto. */
const doseSchema = z
  .union([z.string(), z.number()])
  .nullable()
  .transform((v) => (v === null ? null : String(v)));

export const medicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  dose: doseSchema,
  unit: z.string().nullable(),
  scheduleTimes: z.array(z.string()),
  active: z.boolean(),
  notes: z.string().nullable(),
});
export type Medication = z.infer<typeof medicationSchema>;
export const medicationsResponseSchema = z.object({ medications: z.array(medicationSchema) });
export const medicationResponseSchema = z.object({ medication: medicationSchema });

export const scheduledDoseSchema = z.object({
  medicationId: z.string(),
  name: z.string(),
  dose: doseSchema,
  unit: z.string().nullable(),
  scheduledFor: z.string(),
  status: medicationStatusSchema,
  takenAt: z.string().nullable(),
  logId: z.string().nullable(),
  overdue: z.boolean(),
});
export type ScheduledDose = z.infer<typeof scheduledDoseSchema>;
export const scheduleResponseSchema = z.object({ doses: z.array(scheduledDoseSchema) });

export const adherenceSchema = z.object({
  days: z.number(),
  taken: z.number(),
  missed: z.number(),
  skipped: z.number(),
  total: z.number(),
  rate: z.number().nullable(),
  streakDays: z.number(),
  last7Rate: z.number().nullable(),
  perMedication: z.array(
    z.object({ medicationId: z.string(), name: z.string(), taken: z.number(), total: z.number(), rate: z.number().nullable() }),
  ),
});
export type Adherence = z.infer<typeof adherenceSchema>;

export const medicationSearchSchema = z.object({
  query: z.string().optional(),
  results: z.array(z.union([z.string(), z.object({ name: z.string() }).passthrough()])),
});

export const dailyLogSchema = z.object({
  id: z.string().optional(),
  logDate: z.string(),
  sleepHours: z.number().nullable(),
  stressLevel: z.number().nullable(),
  caffeineMg: z.number().nullable(),
  exerciseMinutes: z.number().nullable(),
  mood: z.number().nullable(),
  alcoholUnits: z.number().nullable(),
  notes: z.string().nullable(),
});
export type DailyLog = z.infer<typeof dailyLogSchema>;
export const dailyLogResponseSchema = z.object({ log: dailyLogSchema });
export const dailyLogsResponseSchema = z.object({ logs: z.array(dailyLogSchema) });

export const seizureSchema = z.object({
  id: z.string(),
  startedAt: z.string(),
  durationSeconds: z.number().nullable(),
  severity: z.number().nullable(),
  seizureType: z.string().nullable(),
  triggersNoted: z.array(z.string()),
  location: z.string().nullable(),
  notes: z.string().nullable(),
  source: z.enum(['manual', 'emergency', 'wearable']),
  resolvedAt: z.string().nullable(),
});
export type Seizure = z.infer<typeof seizureSchema>;
export const seizureListSchema = z.object({
  seizures: z.array(seizureSchema),
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export const seizureResponseSchema = z.object({ seizure: seizureSchema });

export const seizureStatsSchema = z.object({
  total: z.number(),
  lastSeizureAt: z.string().nullable(),
  daysSinceLast: z.number().nullable(),
  avgDurationSeconds: z.number().nullable(),
  lowSleepShare: z.number().nullable(),
  lowSleepSamples: z.number().optional(),
  byHour: z.unknown().optional(),
  bySeverity: z.unknown().optional(),
  byType: z.unknown().optional(),
  triggers: z.unknown().optional(),
});
export type SeizureStats = z.infer<typeof seizureStatsSchema>;

export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  relationship: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  priority: z.number(),
  notifySms: z.boolean(),
  notifyEmail: z.boolean(),
});
export type Contact = z.infer<typeof contactSchema>;
export const contactsResponseSchema = z.object({ contacts: z.array(contactSchema) });
export const contactResponseSchema = z.object({ contact: contactSchema });

export const emergencyEventSchema = z.object({
  id: z.string(),
  seizureId: z.string().nullable(),
  triggeredAt: z.string(),
  status: z.enum(['active', 'notified', 'resolved', 'false_alarm']),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});
export type EmergencyEvent = z.infer<typeof emergencyEventSchema>;
export const emergencyOutcomeSchema = z.object({
  event: emergencyEventSchema,
  seizure: z.unknown().optional(),
  notifications: z.array(z.unknown()).optional(),
  warning: z.string().optional(),
});
export type EmergencyOutcome = z.infer<typeof emergencyOutcomeSchema>;
export const emergencyEventResponseSchema = z.object({ event: emergencyEventSchema });
export const activeEmergenciesSchema = z.object({ events: z.array(emergencyEventSchema) });

export const insightSchema = z.object({
  id: z.string().optional(),
  kind: z.string(),
  title: z.string(),
  body: z.string(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  createdAt: z.string().optional(),
});
export type Insight = z.infer<typeof insightSchema>;
export const insightsResponseSchema = z.object({ insights: z.array(insightSchema), degraded: z.boolean().optional() });

export const riskTodaySchema = z.object({
  assessment: z.object({
    score: z.number(),
    level: riskLevelSchema,
    factors: z.array(riskFactorSchema),
    assessedOn: z.string().optional(),
    modelVersion: z.string().optional(),
  }),
  confidence: z.number().optional(),
  degraded: z.boolean().optional(),
});
export const riskHistorySchema = z.object({
  days: z.number(),
  assessments: z.array(z.object({ assessedOn: z.string(), score: z.number(), level: riskLevelSchema })),
});
export type RiskHistory = z.infer<typeof riskHistorySchema>;

export const wearableDeviceSchema = z.object({
  id: z.string(),
  provider: z.enum(['web_bluetooth', 'fitbit', 'google_health', 'apple_health', 'garmin', 'manual']),
  deviceName: z.string().nullable(),
  externalId: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  active: z.boolean(),
});
export type WearableDevice = z.infer<typeof wearableDeviceSchema>;
export const devicesResponseSchema = z.object({ devices: z.array(wearableDeviceSchema) });
export const deviceResponseSchema = z.object({ device: wearableDeviceSchema });

export const wearableSummarySchema = z.object({
  hours: z.number(),
  samples: z.number(),
  heartRate: z.object({ avg: z.number().nullable(), min: z.number().nullable(), max: z.number().nullable() }),
  avgHrvMs: z.number().nullable(),
  avgSpo2: z.number().nullable(),
  maxMotion: z.number().nullable(),
});
export type WearableSummary = z.infer<typeof wearableSummarySchema>;

export const liveSamplesSchema = z.object({
  minutes: z.number(),
  count: z.number(),
  samples: z.array(z.object({ sampledAt: z.string(), heartRate: z.number().nullable() }).passthrough()),
});
export const alertsResponseSchema = z.object({ alerts: z.array(wearableAlertSchema) });
export const ingestResponseSchema = z.object({ accepted: z.number(), alerts: z.array(z.unknown()).optional() });
