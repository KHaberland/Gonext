import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Switch, TextInput } from 'react-native-paper';
import { getPlaceById, updatePlace } from '../../../lib/db';

export default function EditPlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const placeId = parseInt(id ?? '0', 10);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lat, setLat] = useState('0');
  const [lon, setLon] = useState('0');
  const [visitLater, setVisitLater] = useState(true);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPlace = useCallback(async () => {
    if (!placeId) return;
    try {
      const place = await getPlaceById(placeId);
      if (place) {
        setName(place.name);
        setDescription(place.description);
        setLat(String(place.lat));
        setLon(String(place.lon));
        setVisitLater(place.visitLater);
        setLiked(place.liked);
      }
    } catch (e) {
      console.error('Ошибка загрузки места:', e);
    } finally {
      setLoading(false);
    }
  }, [placeId]);

  useEffect(() => {
    loadPlace();
  }, [loadPlace]);

  const parseCoord = (s: string): number => {
    const n = parseFloat(s.replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Ошибка', 'Введите название места');
      return;
    }

    setSaving(true);
    try {
      await updatePlace(placeId, {
        name: trimmedName,
        description: description.trim(),
        visitLater,
        liked,
        lat: parseCoord(lat),
        lon: parseCoord(lon),
      });
      router.back();
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Редактировать место" />
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
            label="Широта"
            value={lat}
            onChangeText={setLat}
            mode="outlined"
            keyboardType="numeric"
            placeholder="55.7558"
            style={styles.input}
          />
          <TextInput
            label="Долгота"
            value={lon}
            onChangeText={setLon}
            mode="outlined"
            keyboardType="numeric"
            placeholder="37.6173"
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
