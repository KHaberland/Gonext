import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Switch, TextInput } from 'react-native-paper';
import { getTripById, updateTrip } from '../../../lib/db';

export default function EditTripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const tripId = parseInt(id ?? '0', 10);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [current, setCurrent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadTrip = useCallback(async () => {
    if (!tripId) return;
    try {
      const trip = await getTripById(tripId);
      if (trip) {
        setTitle(trip.title);
        setDescription(trip.description);
        setStartDate(trip.startDate.slice(0, 10));
        setEndDate(trip.endDate.slice(0, 10));
        setCurrent(trip.current);
      }
    } catch (e) {
      console.error('Ошибка загрузки поездки:', e);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    loadTrip();
  }, [loadTrip]);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert(t('common.error'), t('trips.errorNameRequired'));
      return;
    }

    if (startDate > endDate) {
      Alert.alert(t('common.error'), t('trips.errorDateRange'));
      return;
    }

    setSaving(true);
    try {
      await updateTrip(tripId, {
        title: trimmedTitle,
        description: description.trim(),
        startDate,
        endDate,
        current,
      });
      router.back();
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      Alert.alert(t('common.error'), t('trips.errorSave'));
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
        <Appbar.Content title={t('trips.editTrip')} />
      </Appbar.Header>

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TextInput
            label={t('trips.name')}
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label={t('trips.description')}
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />
          <TextInput
            label={t('trips.startDate')}
            value={startDate}
            onChangeText={setStartDate}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />
          <TextInput
            label={t('trips.endDate')}
            value={endDate}
            onChangeText={setEndDate}
            mode="outlined"
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />
          <View style={styles.switchRow}>
            <Switch value={current} onValueChange={setCurrent} />
            <Button mode="text" onPress={() => setCurrent(!current)}>
              {t('trips.currentTrip')}
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
