import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Card,
  IconButton,
  Menu,
  Text,
} from 'react-native-paper';
import { formatDD } from '../../../lib/coords';
import { openInNavigatorWithChoice } from '../../../lib/navigator';
import {
  addPlacePhoto,
  deletePlacePhoto,
  deleteRecording,
  getPlaceById,
  getPlacePhotos,
  getRecordingsByPlaceId,
  insertRecording,
} from '../../../lib/db';
import { pickAndSavePhoto } from '../../../lib/photo-utils';
import type { Place, PlacePhoto } from '../../../types';
import { PhotoViewer } from '../../../components/PhotoViewer';
import { RecordingSection } from '../../../components/RecordingSection';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const placeId = parseInt(id ?? '0', 10);
  const [place, setPlace] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [recordings, setRecordings] = useState<Awaited<ReturnType<typeof getRecordingsByPlaceId>>>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState(false);

  const loadData = useCallback(async () => {
    if (!placeId) return;
    try {
      const [p, ph, recs] = await Promise.all([
        getPlaceById(placeId),
        getPlacePhotos(placeId),
        getRecordingsByPlaceId(placeId),
      ]);
      setPlace(p ?? null);
      setPhotos(ph);
      setRecordings(recs);
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  }, [placeId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddPhoto = async (source: 'gallery' | 'camera') => {
    setPhotoMenuVisible(false);
    const uri = await pickAndSavePhoto(source);
    if (uri) {
      try {
        await addPlacePhoto(placeId, uri);
        await loadData();
      } catch (e) {
        console.error('Ошибка добавления фото:', e);
        Alert.alert(t('common.error'), t('places.errorAddPhoto'));
      }
    }
  };

  const handleDeletePhoto = (
    photoId: number,
    onAfterDelete?: () => void
  ) => {
    Alert.alert(t('places.deletePhotoConfirm'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlacePhoto(photoId);
            await loadData();
            onAfterDelete?.();
          } catch (e) {
            console.error('Ошибка удаления:', e);
          }
        },
      },
    ]);
  };

  const hasCoords = place && (place.lat !== 0 || place.lon !== 0);

  if (!place) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('places.place')} />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={place.name} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              router.push(`/places/${placeId}/edit`);
            }}
            title={t('common.edit')}
            leadingIcon="pencil"
          />
        </Menu>
      </Appbar.Header>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">{place.name}</Text>
            {place.description ? (
              <Text variant="bodyMedium" style={styles.description}>
                {place.description}
              </Text>
            ) : null}
            <View style={styles.badges}>
              {place.visitLater && (
                <Text variant="labelSmall" style={styles.badge}>
                  {t('places.visitLater')}
                </Text>
              )}
              {place.liked && (
                <Text variant="labelSmall" style={styles.badge}>
                  {t('places.liked')}
                </Text>
              )}
            </View>
            {(place.lat !== 0 || place.lon !== 0) && (
              <Text variant="bodySmall" style={styles.coords}>
                {formatDD(place.lat, place.lon)}
              </Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttons}>
          {hasCoords && (
            <>
              <Button
                mode="contained"
                icon="map-marker"
                onPress={() => router.push(`/places/${placeId}/map`)}
                style={styles.button}
              >
                {t('places.onMap')}
              </Button>
              <Button
                mode="contained"
                icon="navigation"
                onPress={() =>
                  openInNavigatorWithChoice(place.lat, place.lon, place.name)
                }
                style={styles.button}
              >
                {t('places.openInNavigator')}
              </Button>
            </>
          )}
          {photos.length > 0 && (
          <Button
            mode="contained"
            icon="image-multiple"
            onPress={() => setViewingPhotos(true)}
            style={styles.button}
          >
            {t('places.viewPhotos')} ({photos.length})
          </Button>
          )}
          <Menu
            visible={photoMenuVisible}
            onDismiss={() => setPhotoMenuVisible(false)}
            anchor={
              <Button
                mode="contained"
                icon="camera"
                onPress={() => setPhotoMenuVisible(true)}
                style={styles.button}
              >
                {photos.length > 0 ? t('places.morePhotos') : t('places.addPhoto')}
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleAddPhoto('camera')}
              title={t('places.takePhoto')}
              leadingIcon="camera"
            />
            <Menu.Item
              onPress={() => handleAddPhoto('gallery')}
              title={t('places.chooseFromGallery')}
              leadingIcon="image"
            />
          </Menu>
          <RecordingSection
            recordings={recordings}
            onRecordSaved={async (audioUri) => {
              await insertRecording({ audioUri, placeId });
              await loadData();
            }}
            onDelete={async (id) => {
              await deleteRecording(id);
              await loadData();
            }}
          />
        </View>
      </ScrollView>

      <PhotoViewer
        visible={viewingPhotos}
        photos={photos.map((p) => ({ id: p.id, fileUri: p.fileUri }))}
        onClose={() => setViewingPhotos(false)}
        onDelete={(id) =>
          handleDeletePhoto(id, () => {
            if (photos.length === 1) setViewingPhotos(false);
          })
        }
      />
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
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  badge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  coords: {
    marginTop: 8,
    color: '#666',
  },
  buttons: {
    gap: 12,
  },
  button: {
    marginBottom: 4,
  },
});
