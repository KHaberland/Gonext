import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Switch, TextInput } from 'react-native-paper';
import { parseCoordinates, validateDD } from '../../lib/coords';
import { getTripPlaces, insertPlace, insertTripPlace } from '../../lib/db';

export default function NewPlaceScreen() {
  const router = useRouter();
  const { addToTrip } = useLocalSearchParams<{ addToTrip?: string }>();
  const tripId = addToTrip ? parseInt(addToTrip, 10) : null;
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState('');
  const [visitLater, setVisitLater] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Ошибка', 'Введите название места');
      return;
    }

    const { lat: latDD, lon: lonDD } = parseCoordinates(coords);
    const validation = validateDD(latDD, lonDD);
    if (!validation.valid) {
      Alert.alert('Ошибка', validation.error);
      return;
    }

    setSaving(true);
    try {
      const id = await insertPlace({
        name: trimmedName,
        description: description.trim(),
        visitLater,
        liked,
        lat: latDD,
        lon: lonDD,
      });
      if (tripId) {
        const existing = await getTripPlaces(tripId);
        const maxOrder = existing.length > 0 ? Math.max(...existing.map((tp) => tp.order)) : -1;
        await insertTripPlace({
          tripId,
          placeId: id,
          order: maxOrder + 1,
          visited: false,
          visitDate: null,
          notes: '',
        });
        router.replace(`/trips/${tripId}`);
      } else {
        router.replace(`/places/${id}`);
      }
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      Alert.alert('Ошибка', 'Не удалось сохранить место');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={tripId ? 'Новое место в поездке' : 'Новое место'} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TextInput
            label="Название *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Описание"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label="Координаты места"
            value={coords}
            onChangeText={setCoords}
            mode="outlined"
            placeholder="55.744920, 37.604677"
            style={styles.input}
          />
          <View style={styles.switchRow}>
            <Switch value={visitLater} onValueChange={setVisitLater} />
            <Button mode="text" onPress={() => setVisitLater(!visitLater)}>
              Посетить позже
            </Button>
          </View>
          <View style={styles.switchRow}>
            <Switch value={liked} onValueChange={setLiked} />
            <Button mode="text" onPress={() => setLiked(!liked)}>
              Понравилось
            </Button>
          </View>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            Сохранить
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  input: {
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButton: {
    marginTop: 24,
  },
});
