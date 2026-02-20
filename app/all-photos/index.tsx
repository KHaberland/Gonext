import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import { getAllPhotos, type AllPhotoItem } from '../../lib/db';
import { PhotoViewer } from '../../components/PhotoViewer';

const NUM_COLUMNS = 3;
const GAP = 4;

function ensureImageUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('http')) return uri;
  return `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
}

export default function AllPhotosScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<AllPhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllPhotos();
      setPhotos(data);
    } catch (e) {
      console.error('Ошибка загрузки фото:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [loadPhotos])
  );

  const handlePhotoPress = (index: number) => {
    setViewerStartIndex(index);
    setViewerVisible(true);
  };

  const { width } = Dimensions.get('window');
  const itemSize = (width - GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

  const photoItems = photos.map((p, i) => ({ id: i, fileUri: p.fileUri }));

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={t('allPhotos.title')} />
      </Appbar.Header>

      {loading ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t('common.loading')}</Text>
        </View>
      ) : photos.length === 0 ? (
        <View style={styles.centered}>
          <Text variant="bodyLarge" style={styles.empty}>
            {t('allPhotos.noPhotos')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.thumbWrap, { width: itemSize, height: itemSize }]}
              onPress={() => handlePhotoPress(index)}
            >
              <Image
                source={{ uri: ensureImageUri(item.fileUri) }}
                style={styles.thumb}
                resizeMode="cover"
              />
            </Pressable>
          )}
        />
      )}

      <PhotoViewer
        visible={viewerVisible}
        photos={photoItems}
        onClose={() => setViewerVisible(false)}
        initialIndex={viewerStartIndex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  empty: {
    textAlign: 'center',
    color: '#666',
  },
  grid: {
    padding: GAP,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    gap: GAP,
    marginBottom: GAP,
  },
  thumbWrap: {
    overflow: 'hidden',
    borderRadius: 4,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
});
