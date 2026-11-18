import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { Header } from '@/components/ui/Header';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { friendlyMessage } from '@/lib/api/errors';
import { endpoints } from '@/lib/api/instance';
import type { Seizure } from '@/lib/api/schemas';
import { toDateKey } from '@/lib/dates';
import { buildReport, reportToHtml, reportToText, type DoctorReport } from '@/lib/doctorReport';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import { colors, space } from '@/theme/tokens';

const RANGES = [
  { days: 30, label: 'Último mes' },
  { days: 90, label: '3 meses' },
  { days: 180, label: '6 meses' },
] as const;

const PAGE = 50;
const MAX_PAGES = 10;

async function allSeizures(): Promise<Seizure[]> {
  const out: Seizure[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await endpoints.seizures.list(page, PAGE);
    out.push(...res.seizures);
    if (page >= res.totalPages) break;
  }
  return out;
}

export default function Report() {
  const { user } = useAuth();
  const toast = useToast();
  const [days, setDays] = useState<number>(30);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<DoctorReport | null>(null);

  const generate = async () => {
    setBusy(true);
    try {
      const to = new Date();
      const from = new Date(to.getTime() - (days - 1) * 86_400_000);
      const [seizures, meds, adherence, logs] = await Promise.all([
        allSeizures(),
        endpoints.medications.list(),
        endpoints.medications.adherence(days),
        endpoints.dailyLogs.range(toDateKey(from), toDateKey(to)),
      ]);
      setReport(buildReport({ patientName: user?.fullName ?? 'Paciente', from, to, seizures, medications: meds.medications, adherence, logs: logs.logs }));
    } catch (e) {
      toast.error(friendlyMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const shareText = () => {
    if (report) void Share.share({ message: reportToText(report) }).catch(() => undefined);
  };

  const sharePdf = async () => {
    if (!report) return;
    try {
      const { uri } = await Print.printToFileAsync({ html: reportToHtml(report) });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Reporte para el médico' });
      else toast.error('Este dispositivo no permite compartir archivos. Usa "Compartir como texto".');
    } catch {
      toast.error('No se pudo crear el PDF. Prueba con "Compartir como texto".');
    }
  };

  return (
    <Screen glow={colors.cyan}>
      <Header title="Reporte para el médico" subtitle="Resumen de crisis, medicación y hábitos" back />

      <Card style={{ gap: space.md }}>
        <Text variant="label" color={colors.muted}>
          Periodo
        </Text>
        <View style={styles.wrap}>
          {RANGES.map((r) => (
            <Chip key={r.days} label={r.label} selected={days === r.days} onPress={() => setDays(r.days)} />
          ))}
        </View>
      </Card>

      <View style={{ gap: space.md, marginTop: space.lg }}>
        <Button label="Crear reporte" icon="chart" size="lg" loading={busy} onPress={() => void generate()} />

        {report ? (
          <>
            <Card tone="raised" style={{ gap: space.sm }}>
              <Text variant="h2">
                {report.totalSeizures} crisis del {report.fromKey} al {report.toKey}
              </Text>
              <Text variant="small" selectable>
                {reportToText(report)}
              </Text>
            </Card>
            <Button label="Compartir PDF" icon="edit" onPress={() => void sharePdf()} />
            <Button label="Compartir como texto" variant="soft" icon="users" onPress={shareText} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm } });
