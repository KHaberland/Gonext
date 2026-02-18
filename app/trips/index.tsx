import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Chip, FAB, List, Text } from 'react-native-paper';
import { getAllTrips } from '../../lib/db';
import type { Trip } from '../../types';

function formatDateRange(start: string, end: string): string {
  const s = start.slice(0, 10);
  const e = end.slice(0, 10);
  return s === e ? s : `${s} — ${e}`;
}

export default function TripsScreen() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const data = await getAllTrips();
      setTrips(data);
    } catch (e) {
      console.error('Ошибка загрузки поездок:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadTrips();
    }, [loadTrips])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTrips();
  }, [loadTrips]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Поездки" />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <Text variant="bodyLarge" style={styles.empty}>
            Загрузка...
          </Text>
        ) : trips.length === 0 ? (
          <Text variant="bodyLarge" style={styles.empty}>
            Нет поездок. Создайте первую поездку.
          </Text>
        ) : (
          trips.map((trip) => (
            <List.Item
              key={trip.id}
              title={trip.title}
              description={formatDateRange(trip.startDate, trip.endDate)}
              left={(props) => (
                <List.Icon {...props} icon="map-marker-path" />
              )}
              right={(props) => (
                <View style={styles.rightContent}>
                  {trip.current && (
                    <Chip compact style={styles.chip}>
                      Текущая
                    </Chip>
                  )}
                  <List.Icon {...props} icon="chevron-right" />
                </View>
              )}
              onPress={() => router.push(`/trips/${trip.id}`)}
              style={styles.listItem}
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/trips/new')}
        label="Создать поездку"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  listItem: {
    paddingHorizontal: 16,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    marginRight: 4,
  },
  empty: {
    textAlign: 'center',
    padding: 32,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
