import { router } from "expo-router";
import { Linking, StyleSheet, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Header } from "@/components/ui/Header";
import { Icon } from "@/components/ui/Icon";
import { PressableScale } from "@/components/ui/PressableScale";
import { QueryError } from "@/components/ui/QueryError";
import { Screen } from "@/components/ui/Screen";
import { Skeleton } from "@/components/ui/Skeleton";
import { Text } from "@/components/ui/Text";
import { useContacts } from "@/hooks/queries";
import { telUrl } from "@/lib/emergencyMachine";
import { colors, space } from "@/theme/tokens";

export default function Contacts() {
  const q = useContacts();
  const list = q.data ?? [];

  return (
    <Screen refreshing={q.isRefetching} onRefresh={() => void q.refetch()}>
      <Header
        title="Contactos"
        subtitle="Reciben el aviso en una emergencia, por prioridad"
        back
        right={
          <PressableScale
            onPress={() => router.push("/contact-form")}
            accessibilityLabel="Agregar contacto"
            style={styles.add}
          >
            <Icon
              name="plus"
              size={22}
              color={colors.limeInk}
              strokeWidth={2.6}
            />
          </PressableScale>
        }
      />
      {q.isLoading ? (
        <View style={{ gap: space.md }}>
          <Skeleton height={86} rounded={22} />
          <Skeleton height={86} rounded={22} />
        </View>
      ) : q.isError ? (
        <QueryError error={q.error} onRetry={() => void q.refetch()} />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon="users"
            title="Sin contactos de emergencia"
            body="Agrega al menos uno: sin contactos, el botón SOS no tiene a quién avisar."
            actionLabel="Agregar contacto"
            onAction={() => router.push("/contact-form")}
            tone={colors.coral}
          />
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          {list.map((c) => (
            <Card key={c.id} style={styles.row}>
              <PressableScale
                onPress={() =>
                  router.push({
                    pathname: "/contact-form",
                    params: { id: c.id },
                  })
                }
                accessibilityLabel={`Editar ${c.name}`}
                style={styles.edit}
              >
                <View style={styles.priority}>
                  <Text variant="title" color={colors.limeInk}>
                    {c.priority}
                  </Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="title">{c.name}</Text>
                  <Text variant="small" color={colors.muted} numberOfLines={1}>
                    {[c.relationship, c.phone ?? c.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                  <Text variant="small" color={colors.faint}>
                    {[
                      c.notifySms && c.phone ? "SMS" : null,
                      c.notifyEmail && c.email ? "Correo" : null,
                    ]
                      .filter(Boolean)
                      .join(" + ") || "Sin canal activo"}
                  </Text>
                </View>
              </PressableScale>
              {c.phone ? (
                <PressableScale
                  onPress={() =>
                    void Linking.openURL(telUrl(c.phone as string))
                  }
                  accessibilityLabel={`Llamar a ${c.name}`}
                  style={styles.call}
                >
                  <Icon name="phone" size={18} color={colors.lime} />
                </PressableScale>
              ) : null}
            </Card>
          ))}
          <Text
            variant="small"
            color={colors.faint}
            center
            style={{ marginTop: space.sm }}
          >
            El 1 es el primero en recibir el aviso.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  add: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  edit: { flex: 1, flexDirection: "row", alignItems: "center", gap: space.md },
  priority: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  call: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface3,
    alignItems: "center",
    justifyContent: "center",
  },
});
