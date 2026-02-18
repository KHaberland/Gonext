import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
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
import {
  addPlacePhoto,
  deletePlacePhoto,
  getPlaceById,
  getPlacePhotos,
} from '../../../lib/db';
import { pickAndSavePhoto } from '../../../lib/photo-utils';
import type { Place, PlacePhoto } from '../../../types';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const placeId = parseInt(id ?? '0', 10);
  const [place, setPlace] = useState<Place | null>(null);
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);

  const loadData = useCallback(async () => {
    if (!placeId) return;
    try {
      const [p, ph] = await Promise.all([
        getPlaceById(placeId),
        getPlacePhotos(placeId),
      ]);
      setPlace(p ?? null);
      setPhotos(ph);
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
        loadData();
      } catch (e) {
        console.error('Ошибка добавления фото:', e);
        Alert.alert('Ошибка', 'Не удалось добавить фото');
      }
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    Alert.alert('Удалить фото?', '', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlacePhoto(photoId);
            loadData();
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
          <Appbar.Content title="Место" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text variant="bodyLarge">Загрузка...</Text>
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
            title="Редактировать"
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
                  Посетить позже
                </Text>
              )}
              {place.liked && (
                <Text variant="labelSmall" style={styles.badge}>
                  Понравилось
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

        {photos.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleSmall" style={styles.sectionTitle}>
              Фотографии
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photosRow}
            >
              {photos.map((photo) => (
                <View key={photo.id} style={styles.photoWrap}>
                  <Image
                    source={{ uri: photo.fileUri }}
                    style={styles.photo}
                    resizeMode="cover"
                  />
                  <IconButton
                    icon="close"
                    size={20}
                    style={styles.photoDelete}
                    onPress={() => handleDeletePhoto(photo.id)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.buttons}>
          {hasCoords && (
            <Button
              mode="outlined"
              icon="map-marker"
              onPress={() => router.push(`/places/${placeId}/map`)}
              style={styles.button}
            >
              На карте
            </Button>
          )}
          <Menu
            visible={photoMenuVisible}
            onDismiss={() => setPhotoMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => setPhotoMenuVisible(true)}
                style={styles.button}
              >
                Добавить фото
              </Button>
            }
          >
            <Menu.Item
              onPress={() => handleAddPhoto('camera')}
              title="Сделать фото"
              leadingIcon="camera"
            />
            <Menu.Item
              onPress={() => handleAddPhoto('gallery')}
              title="Выбрать из галереи"
              leadingIcon="image"
            />
          </Menu>
          <Button
            mode="outlined"
            icon="microphone"
            onPress={() => {
              // Этап 8 — диктофон
              Alert.alert(
                'Голосовая запись',
                'Функция будет доступна в этапе 8 (Диктофон).'
              );
            }}
            style={styles.button}
          >
            Голосовая запись
          </Button>
        </View>
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
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 8,
  },
  photosRow: {
    gap: 8,
    paddingVertical: 8,
  },
  photoWrap: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  photoDelete: {
    position: 'absolute',
    top: 0,
    right: 0,
    margin: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  buttons: {
    gap: 12,
  },
  button: {
    marginBottom: 4,
  },
});
