import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Switch, TextInput } from 'react-native-paper';
import { formatDD, parseCoordinates, validateDD } from '../../../lib/coords';
import { getPlaceById, updatePlace } from '../../../lib/db';

export default function EditPlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const placeId = parseInt(id ?? '0', 10);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coords, setCoords] = useState('');
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
        setCoords(place.lat !== 0 || place.lon !== 0 ? formatDD(place.lat, place.lon) : '');
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
      await updatePlace(placeId, {
        name: trimmedName,
        description: description.trim(),
        visitLater,
        liked,
        lat: latDD,
        lon: lonDD,
      });
      router.back();
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      Alert.alert(t('common.error'), t('places.errorSave'));
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
        <Appbar.Content title={t('places.editPlace')} />
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
