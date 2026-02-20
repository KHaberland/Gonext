import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Divider, Icon, List, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { getAllTrips, getCurrentTrip, updateTrip } from '../../lib/db';
import { LANGUAGES, setLanguage, type LanguageCode } from '../../lib/i18n';
import { PRESET_COLORS, useThemeMode } from '../../lib/theme';
import type { Trip } from '../../types';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useThemeMode();
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
        <Appbar.Content title={t('settings.title')} />
      </Appbar.Header>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <List.Section>
          <List.Subheader>{t('settings.language')}</List.Subheader>
          <Text variant="bodySmall" style={styles.hint}>
            {t('settings.languageHint')}
          </Text>
          <View style={styles.themeRow}>
            <SegmentedButtons
              value={i18n.language?.startsWith('ru') ? 'ru' : 'en'}
              onValueChange={(v) => setLanguage(v as LanguageCode)}
              buttons={LANGUAGES.map(({ code, label }) => ({
                value: code,
                label,
              }))}
            />
          </View>
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <List.Subheader>{t('settings.appearance')}</List.Subheader>
          <Text variant="bodySmall" style={styles.hint}>
            {t('settings.appearanceHint')}
          </Text>
          <View style={styles.themeRow}>
            <SegmentedButtons
              value={themeMode}
              onValueChange={(v) => setThemeMode(v as 'light' | 'dark')}
              buttons={[
                { value: 'light', label: t('settings.light'), icon: 'white-balance-sunny' },
                { value: 'dark', label: t('settings.dark'), icon: 'moon-waning-crescent' },
              ]}
            />
          </View>
          <Text variant="bodySmall" style={styles.hint}>
            {t('settings.themeColor')}
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
          <View style={[styles.labelButton, { backgroundColor: theme.colors.primary }]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
              {t('settings.currentTrip')}
            </Text>
          </View>
          <View style={[styles.labelButton, { backgroundColor: theme.colors.primary }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary }}>
              {t('settings.currentTripHint')}
            </Text>
          </View>
          {loading ? (
            <List.Item
              title={t('common.loading')}
              left={(props) => <List.Icon {...props} icon="progress-clock" />}
              right={() => <ActivityIndicator size="small" />}
            />
          ) : trips.length === 0 ? (
            <Pressable
              onPress={() => router.push('/trips')}
              style={[styles.tripItemButton, { backgroundColor: theme.colors.primary }]}
            >
              <View style={styles.tripItemRow}>
                <Icon source="map-marker-outline" size={24} color={theme.colors.onPrimary} />
                <View style={styles.tripItemText}>
                  <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
                    {t('settings.noTrips')}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onPrimary, opacity: 0.9 }}>
                    {t('settings.noTripsHint')}
                  </Text>
                </View>
              </View>
            </Pressable>
          ) : (
            <>
              {trips.map((trip) => (
                <Pressable
                  key={trip.id}
                  onPress={() => handleSelectCurrentTrip(trip)}
                  style={[styles.tripItemButton, { backgroundColor: theme.colors.primary }]}
                >
                  <View style={styles.tripItemRow}>
                    <Icon
                      source={currentTripId === trip.id ? 'radiobox-marked' : 'radiobox-blank'}
                      size={24}
                      color={theme.colors.onPrimary}
                    />
                    <View style={styles.tripItemText}>
                      <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
                        {trip.title}
                      </Text>
                      {trip.startDate && (
                        <Text variant="bodySmall" style={{ color: theme.colors.onPrimary, opacity: 0.9 }}>
                          {t('trips.fromDate', { date: trip.startDate.slice(0, 10) })}
                        </Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
              {currentTripId !== null && (
                <Pressable
                  onPress={handleClearCurrentTrip}
                  style={[styles.resetTripButton, { backgroundColor: theme.colors.primary }]}
                >
                  <View style={styles.tripItemRow}>
                    <Icon
                      source="close-circle-outline"
                      size={20}
                      color={theme.colors.onPrimary}
                    />
                    <Text variant="labelMedium" style={{ color: theme.colors.onPrimary }}>
                      {t('settings.resetCurrentTrip')}
                    </Text>
                  </View>
                </Pressable>
              )}
            </>
          )}
        </List.Section>

        <Divider style={styles.divider} />

        <List.Section>
          <View style={[styles.labelButton, { backgroundColor: theme.colors.primary }]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
              {t('settings.about')}
            </Text>
          </View>
          <View style={[styles.labelButton, { backgroundColor: theme.colors.primary }]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
              GoNext
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onPrimary, marginTop: 4 }}>
              {t('settings.aboutDescription')}
            </Text>
          </View>
          <View style={[styles.labelButton, { backgroundColor: theme.colors.primary }]}>
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
              {t('settings.version')}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onPrimary, marginTop: 4 }}>
              {appVersion}
            </Text>
          </View>
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
  labelButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tripItemButton: {
    alignSelf: 'stretch',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginLeft: 32,
    marginRight: 16,
    marginBottom: 8,
  },
  resetTripButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 32,
    marginRight: 16,
    marginBottom: 8,
  },
  tripItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripItemText: {
    flex: 1,
  },
});
