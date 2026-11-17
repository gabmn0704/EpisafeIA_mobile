import { StyleSheet, View } from 'react-native';
import { colors, radius, space } from '@/theme/tokens';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export interface EmptyStateProps {
  icon: IconName;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: string;
}

export function EmptyState({ icon, title, body, actionLabel, onAction, tone = colors.brand }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.badge, { borderColor: tone }]}>
        <Icon name={icon} size={26} color={tone} />
      </View>
      <Text variant="h2" center>
        {title}
      </Text>
      {body ? (
        <Text variant="body" color={colors.muted} center style={styles.body}>
          {body}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} variant="brand" size="sm" style={{ marginTop: space.sm }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.lg },
  badge: { width: 60, height: 60, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, marginBottom: space.sm },
  body: { maxWidth: 300 },
});
