/**
 * Компонент полноэкранного просмотра фотографий.
 * Свайп между фото, удаление по кнопке. Закрытие по нажатию на тёмную область.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Text } from 'react-native-paper';

export interface PhotoItem {
  id: number;
  fileUri: string;
}

interface PhotoViewerProps {
  visible: boolean;
  photos: PhotoItem[];
  onClose: () => void;
  onDelete?: (photoId: number) => void;
  /** Начальный индекс при открытии (по умолчанию 0) */
  initialIndex?: number;
}

function ensureImageUri(uri: string): string {
  if (uri.startsWith('file://') || uri.startsWith('http')) return uri;
  return `file://${uri.startsWith('/') ? '' : '/'}${uri}`;
}

export function PhotoViewer({
  visible,
  photos,
  onClose,
  onDelete,
  initialIndex = 0,
}: PhotoViewerProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(Math.min(initialIndex, Math.max(0, photos.length - 1)));
    }
  }, [visible, initialIndex, photos.length]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const handleDelete = useCallback(() => {
    const photo = photos[currentIndex];
    if (photo && onDelete) {
      onDelete(photo.id);
      if (photos.length <= 1) {
        onClose();
      }
    }
  }, [photos, currentIndex, onDelete, onClose]);

  if (!visible || photos.length === 0) return null;

  const { width, height } = Dimensions.get('window');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.content} pointerEvents="box-none">
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <Text variant="titleSmall" style={styles.counter}>
              {currentIndex + 1} / {photos.length}
            </Text>
            <View style={styles.headerActions}>
              {onDelete && (
                <IconButton
                  icon="delete"
                  size={24}
                  onPress={handleDelete}
                  iconColor="#fff"
                />
              )}
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                iconColor="#fff"
              />
            </View>
          </View>
          <View style={styles.imageWrap} pointerEvents="auto">
            <FlatList
              key={`viewer-${initialIndex}`}
              data={photos}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={Math.min(initialIndex, Math.max(0, photos.length - 1))}
              getItemLayout={(_, index) => ({
                length: width,
                offset: width * index,
                index,
              })}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <View style={[styles.slide, { width, height: height * 0.85 }]}>
                  <Image
                    source={{ uri: ensureImageUri(item.fileUri) }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    zIndex: 10,
  },
  counter: {
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
  },
  imageWrap: {
    width: '100%',
    height: '85%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
