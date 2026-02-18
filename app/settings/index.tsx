import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Divider, List, Text } from 'react-native-paper';
import { getAllTrips, getCurrentTrip, updateTrip } from '../../lib/db';
import type { Trip } from '../../types';

export default function SettingsScreen() {
  const router = useRouter();
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
  divider: {
    marginVertical: 16,
  },
});
