import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, FAB, List, Text } from 'react-native-paper';
import { getAllPlaces } from '../../lib/db';
import type { Place } from '../../types';

export default function PlacesScreen() {
  const router = useRouter();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPlaces = useCallback(async () => {
    try {
      const data = await getAllPlaces();
      setPlaces(data);
    } catch (e) {
      console.error('Ошибка загрузки мест:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPlaces();
    }, [loadPlaces])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlaces();
  }, [loadPlaces]);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Места" />
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
        ) : places.length === 0 ? (
          <Text variant="bodyLarge" style={styles.empty}>
            Нет мест. Добавьте первое место.
          </Text>
        ) : (
          places.map((place) => (
            <List.Item
              key={place.id}
              title={place.name}
              description={place.description || undefined}
              left={(props) => (
                <List.Icon {...props} icon="map-marker" />
              )}
              right={(props) => (
                <List.Icon {...props} icon="chevron-right" />
              )}
              onPress={() => router.push(`/places/${place.id}`)}
              style={styles.listItem}
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/places/new')}
        label="Добавить место"
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
