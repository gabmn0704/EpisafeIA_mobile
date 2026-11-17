import { friendlyMessage } from '@/lib/api/errors';
import { colors } from '@/theme/tokens';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { Text } from './Text';
import { View } from 'react-native';

export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Card tone="danger" style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="alert" size={20} color={colors.coral} />
        <Text variant="title" color={colors.coral}>
          No pudimos cargar esto
        </Text>
      </View>
      <Text variant="small" color={colors.ink}>
        {friendlyMessage(error)}
      </Text>
      {onRetry ? <Button label="Reintentar" onPress={onRetry} variant="ghost" size="sm" icon="refresh" style={{ alignSelf: 'flex-start' }} /> : null}
    </Card>
  );
}
