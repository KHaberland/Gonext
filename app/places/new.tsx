import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Switch, TextInput } from 'react-native-paper';
import { parseCoordinates, validateDD } from '../../lib/coords';
import { getTripPlaces, insertPlace, insertTripPlace } from '../../lib/db';

export default function NewPlaceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      Alert.alert(t('common.error'), t('places.errorNameRequired'));
      return;
    }

    const { lat: latDD, lon: lonDD } = parseCoordinates(coords);
    const validation = validateDD(latDD, lonDD);
    if (!validation.valid) {
      Alert.alert(t('common.error'), t(validation.errorKey, validation.errorParams));
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
      Alert.alert(t('common.error'), t('places.errorSavePlace'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={tripId ? t('places.newPlaceInTrip') : t('places.newPlace')} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TextInput
            label={t('places.name')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('places.description')}
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label={t('places.coords')}
            value={coords}
            onChangeText={setCoords}
            mode="outlined"
            placeholder={t('places.coordsPlaceholder')}
            style={styles.input}
          />
          <View style={styles.switchRow}>
            <Switch value={visitLater} onValueChange={setVisitLater} />
            <Button mode="text" onPress={() => setVisitLater(!visitLater)}>
              {t('places.visitLater')}
            </Button>
          </View>
          <View style={styles.switchRow}>
            <Switch value={liked} onValueChange={setLiked} />
            <Button mode="text" onPress={() => setLiked(!liked)}>
              {t('places.liked')}
            </Button>
          </View>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
          >
            {t('common.save')}
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
