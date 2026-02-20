import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Divider, List, SegmentedButtons, Text } from 'react-native-paper';
import { getAllTrips, getCurrentTrip, updateTrip } from '../../lib/db';
import { PRESET_COLORS, useThemeMode } from '../../lib/theme';
import type { Trip } from '../../types';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, themeMode, setThemeMode, primaryColor, setPrimaryColor } = useThemeMode();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allTrips, current] = await Promise.all([getAllTrips(), getCurrentTrip()]);
      setTrips(allTrips);
      setCurrentTripId(current?.id ?? null);
    } catch (e) {
      console.error('Ошибка загрузки настроек:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSelectCurrentTrip = async (trip: Trip) => {
    try {
      await updateTrip(trip.id, { current: true });
      setCurrentTripId(trip.id);
    } catch (e) {
      console.error('Ошибка при выборе текущей поездки:', e);
    }
  };

  const handleClearCurrentTrip = async () => {
    if (!currentTripId) return;
    try {
      await updateTrip(currentTripId, { current: false });
      setCurrentTripId(null);
    } catch (e) {
      console.error('Ошибка при сбросе текущей поездки:', e);
    }
  };

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Настройки" />
      </Appbar.Header>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>Внешний вид</List.Subheader>
          <Text variant="bodySmall" style={styles.hint}>
            Выберите светлую или тёмную тему. В тёмной теме фоновое изображение отключается.
          </Text>
          <View style={styles.themeRow}>
            <SegmentedButtons
              value={themeMode}
              onValueChange={(v) => setThemeMode(v as 'light' | 'dark')}
              buttons={[
                { value: 'light', label: 'Светлая', icon: 'white-balance-sunny' },
                { value: 'dark', label: 'Тёмная', icon: 'moon-waning-crescent' },
              ]}
            />
          </View>
          <Text variant="bodySmall" style={styles.hint}>
            Основной цвет темы:
          </Text>
          <View style={styles.colorRow}>
            {PRESET_COLORS.map((color) => (
              <Pressable
                key={color}
                onPress={() => setPrimaryColor(color)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  primaryColor === color && {
                    borderWidth: 3,
                    borderColor: theme.colors.onSurface,
                  },
                ]}
              />
            ))}
          </View>
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>Текущая поездка</List.Subheader>
          <Text variant="bodySmall" style={styles.hint}>
            Выберите поездку, для которой показывается «Следующее место».
          </Text>
          {loading ? (
            <List.Item
              title="Загрузка..."
              left={(props) => <List.Icon {...props} icon="progress-clock" />}
              right={() => <ActivityIndicator size="small" />}
            />
          ) : trips.length === 0 ? (
            <List.Item
              title="Нет поездок"
              description="Создайте поездку в разделе «Поездки»"
              left={(props) => <List.Icon {...props} icon="map-marker-outline" />}
              onPress={() => router.push('/trips')}
            />
          ) : (
            <>
              {trips.map((trip) => (
                <List.Item
                  key={trip.id}
                  title={trip.title}
                  description={trip.startDate ? `с ${trip.startDate}` : undefined}
                  left={(props) => (
                    <List.Icon
                      {...props}
                      icon={currentTripId === trip.id ? 'radiobox-marked' : 'radiobox-blank'}
                    />
                  )}
                  onPress={() => handleSelectCurrentTrip(trip)}
                />
              ))}
              {currentTripId !== null && (
                <List.Item
                  title="Сбросить текущую поездку"
                  left={(props) => <List.Icon {...props} icon="close-circle-outline" />}
                  onPress={handleClearCurrentTrip}
                />
              )}
            </>
          )}
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>О приложении</List.Subheader>
          <List.Item
            title="GoNext"
            description="Дневник туриста — планирование поездок и ведение дневника путешествий. Работает полностью офлайн."
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />
          <List.Item
            title="Версия"
            description={appVersion}
            left={(props) => <List.Icon {...props} icon="tag-outline" />}
          />
        </List.Section>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  hint: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    color: '#666',
  },
  themeRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  divider: {
    marginVertical: 16,
  },
});
