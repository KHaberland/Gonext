import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  Appbar,
  Button,
  Card,
  Checkbox,
  Chip,
  FAB,
  IconButton,
  List,
  Menu,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import {
  addTripPlacePhoto,
  deleteTripPlacePhoto,
  deleteRecording,
  getTripById,
  getTripPlacesWithDetails,
  getAllPlaces,
  insertRecording,
  insertTripPlace,
  updateTripPlace,
  deleteTripPlace,
} from '../../../lib/db';
import { openInNavigatorWithChoice } from '../../../lib/navigator';
import { pickAndSavePhoto } from '../../../lib/photo-utils';
import type { Place, Trip, TripPlaceWithDetails } from '../../../types';
import { PhotoViewer } from '../../../components/PhotoViewer';
import { RecordingSection } from '../../../components/RecordingSection';

function formatDate(s: string | null): string {
  if (!s) return '';
  return s.slice(0, 10);
}

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const tripId = parseInt(id ?? '0', 10);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [places, setPlaces] = useState<TripPlaceWithDetails[]>([]);
  const [viewMode, setViewMode] = useState<'plan' | 'diary'>('plan');
  const [addPlaceModalVisible, setAddPlaceModalVisible] = useState(false);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [expandedPlaceId, setExpandedPlaceId] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: number; notes: string } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewingPhotosTpId, setViewingPhotosTpId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!tripId) return;
    try {
      const [t, tp] = await Promise.all([
        getTripById(tripId),
        getTripPlacesWithDetails(tripId),
      ]);
      setTrip(t ?? null);
      setPlaces(tp);
    } catch (e) {
      console.error('Ошибка загрузки:', e);
    }
  }, [tripId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const loadAllPlaces = useCallback(async () => {
    try {
      const data = await getAllPlaces();
      setAllPlaces(data);
    } catch (e) {
      console.error('Ошибка загрузки мест:', e);
    }
  }, []);

  const openAddPlaceModal = useCallback(() => {
    loadAllPlaces();
    setAddPlaceModalVisible(true);
  }, [loadAllPlaces]);

  const handleAddPlace = async (placeId: number) => {
    const exists = places.some((tp) => tp.placeId === placeId);
    if (exists) {
      Alert.alert(t('trips.placeAlreadyInRoute'));
      return;
    }
    try {
      const maxOrder = places.length > 0 ? Math.max(...places.map((tp) => tp.order)) : -1;
      await insertTripPlace({
        tripId,
        placeId,
        order: maxOrder + 1,
        visited: false,
        visitDate: null,
        notes: '',
      });
      setAddPlaceModalVisible(false);
      loadData();
    } catch (e) {
      console.error('Ошибка добавления:', e);
      Alert.alert(t('common.error'), t('trips.errorAddPlace'));
    }
  };

  const movePlace = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= places.length) return;
    const a = places[index];
    const b = places[newIndex];
    try {
      await Promise.all([
        updateTripPlace(a.id, { order: b.order }),
        updateTripPlace(b.id, { order: a.order }),
      ]);
      loadData();
    } catch (e) {
      console.error('Ошибка изменения порядка:', e);
    }
  };

  const toggleVisited = async (tp: TripPlaceWithDetails) => {
    try {
      const newVisited = !tp.visited;
      await updateTripPlace(tp.id, {
        visited: newVisited,
        visitDate: newVisited ? new Date().toISOString().slice(0, 10) : null,
      });
      loadData();
    } catch (e) {
      console.error('Ошибка:', e);
    }
  };

  const updateVisitDate = async (tpId: number, visitDate: string) => {
    try {
      await updateTripPlace(tpId, { visitDate: visitDate || null });
      loadData();
    } catch (e) {
      console.error('Ошибка:', e);
    }
  };

  const saveNotes = async (tpId: number, notes: string) => {
    setEditingNotes(null);
    try {
      await updateTripPlace(tpId, { notes });
      loadData();
    } catch (e) {
      console.error('Ошибка:', e);
    }
  };

  const handleAddPhoto = async (tripPlaceId: number, source: 'gallery' | 'camera') => {
    const uri = await pickAndSavePhoto(source);
    if (uri) {
      try {
        await addTripPlacePhoto(tripPlaceId, uri);
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
            await deleteTripPlacePhoto(photoId);
            await loadData();
            onAfterDelete?.();
          } catch (e) {
            console.error('Ошибка удаления:', e);
          }
        },
      },
    ]);
  };

  const handleRemovePlace = (tp: TripPlaceWithDetails) => {
    Alert.alert(t('trips.deletePlaceConfirm'), tp.place?.name ?? '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTripPlace(tp.id);
            loadData();
          } catch (e) {
            console.error('Ошибка:', e);
          }
        },
      },
    ]);
  };

  const filteredPlaces =
    viewMode === 'diary'
      ? places.filter((tp) => tp.visited)
      : places;

  const availablePlaces = allPlaces.filter(
    (p) => !places.some((tp) => tp.placeId === p.id)
  );

  if (!trip) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => router.back()} />
          <Appbar.Content title={t('trips.trip')} />
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
        <Appbar.Content title={trip.title} />
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
              router.push(`/trips/${tripId}/edit`);
            }}
            title={t('common.edit')}
            leadingIcon="pencil"
          />
        </Menu>
      </Appbar.Header>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            {trip.description ? (
              <Text variant="bodyMedium" style={styles.description}>
                {trip.description}
              </Text>
            ) : null}
            <Text variant="bodySmall" style={styles.dates}>
              {trip.startDate.slice(0, 10)} — {trip.endDate.slice(0, 10)}
            </Text>
            {trip.current && (
              <Chip compact style={styles.chip}>
                {t('trips.currentTrip')}
              </Chip>
            )}
          </Card.Content>
        </Card>

        <SegmentedButtons
          value={viewMode}
          onValueChange={(v) => setViewMode(v as 'plan' | 'diary')}
          buttons={[
            { value: 'plan', label: t('trips.plan'), icon: 'format-list-bulleted' },
            { value: 'diary', label: t('trips.diary'), icon: 'book-open-variant' },
          ]}
          style={styles.segmented}
        />

        {filteredPlaces.length === 0 ? (
          <Text variant="bodyLarge" style={styles.empty}>
            {viewMode === 'plan'
              ? t('trips.noPlacesInRoute')
              : t('trips.noVisitedPlaces')}
          </Text>
        ) : (
          filteredPlaces.map((tp, index) => {
            const isExpanded = expandedPlaceId === tp.id;
            const globalIndex = places.findIndex((p) => p.id === tp.id);

            return (
              <Card key={tp.id} style={styles.placeCard}>
                <List.Item
                  title={tp.place?.name ?? t('trips.placeNumber', { id: tp.placeId })}
                  description={
                    viewMode === 'diary' && tp.visitDate
                      ? t('trips.visitedOn', { date: formatDate(tp.visitDate) })
                      : undefined
                  }
                  left={(props) => (
                    <View style={styles.placeLeft}>
                      {viewMode === 'plan' && (
                        <View style={styles.orderButtons}>
                          <IconButton
                            icon="chevron-up"
                            size={20}
                            onPress={() => movePlace(globalIndex, 'up')}
                            disabled={globalIndex === 0}
                          />
                          <IconButton
                            icon="chevron-down"
                            size={20}
                            onPress={() => movePlace(globalIndex, 'down')}
                            disabled={globalIndex === places.length - 1}
                          />
                        </View>
                      )}
                      <Checkbox
                        status={tp.visited ? 'checked' : 'unchecked'}
                        onPress={() => toggleVisited(tp)}
                      />
                    </View>
                  )}
                  right={(props) => (
                    <View style={styles.placeRight}>
                      <IconButton
                        icon={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        onPress={() =>
                          setExpandedPlaceId(isExpanded ? null : tp.id)
                        }
                      />
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => handleRemovePlace(tp)}
                      />
                    </View>
                  )}
                  onPress={() =>
                    setExpandedPlaceId(isExpanded ? null : tp.id)
                  }
                />
                {isExpanded && (
                  <Card.Content style={styles.expandedContent}>
                    {tp.place?.description ? (
                      <Text variant="bodySmall" style={styles.placeDesc}>
                        {tp.place.description}
                      </Text>
                    ) : null}

                    <View style={styles.visitedRow}>
                      <Text variant="labelMedium">{t('trips.visitDate')}</Text>
                      <TextInput
                        mode="outlined"
                        value={tp.visitDate?.slice(0, 10) ?? ''}
                        onChangeText={(t) =>
                          updateVisitDate(tp.id, t)
                        }
                        placeholder="YYYY-MM-DD"
                        dense
                        style={styles.dateInput}
                      />
                    </View>

                    <View style={styles.notesRow}>
                      <Text variant="labelMedium">{t('trips.notes')}</Text>
                      {editingNotes?.id === tp.id ? (
                        <View style={styles.notesEdit}>
                          <TextInput
                            mode="outlined"
                            value={editingNotes.notes}
                            onChangeText={(t) =>
                              setEditingNotes({ id: tp.id, notes: t })
                            }
                            multiline
                            numberOfLines={3}
                            style={styles.notesInput}
                          />
                          <Button
                            onPress={() =>
                              saveNotes(tp.id, editingNotes.notes)
                            }
                          >
                            {t('common.save')}
                          </Button>
                        </View>
                      ) : (
                        <Button
                          mode="text"
                          onPress={() =>
                            setEditingNotes({
                              id: tp.id,
                              notes: tp.notes ?? '',
                            })
                          }
                        >
                          {tp.notes ? tp.notes : t('trips.addNotes')}
                        </Button>
                      )}
                    </View>

                    <View style={styles.placeActions}>
                      {tp.photos.length > 0 && (
                      <Button
                        mode="outlined"
                        icon="image-multiple"
                        compact
                        onPress={() => setViewingPhotosTpId(tp.id)}
                      >
                        {t('places.viewPhotos')} ({tp.photos.length})
                      </Button>
                      )}
                      <AddPhotoButton
                        tripPlaceId={tp.id}
                        onAdd={handleAddPhoto}
                      />
                      {(tp.place?.lat !== 0 || tp.place?.lon !== 0) && (
                        <>
                          <Button
                            mode="outlined"
                            icon="map-marker"
                            compact
                            onPress={() =>
                              router.push(`/places/${tp.placeId}/map`)
                            }
                          >
                            {t('trips.map')}
                          </Button>
                          <Button
                            mode="outlined"
                            icon="navigation"
                            compact
                            onPress={() =>
                              tp.place &&
                              openInNavigatorWithChoice(
                                tp.place.lat,
                                tp.place.lon,
                                tp.place.name
                              )
                            }
                          >
                            {t('trips.navigator')}
                          </Button>
                        </>
                      )}
                    </View>
                    <RecordingSection
                      recordings={tp.recordings}
                      onRecordSaved={async (audioUri) => {
                        await insertRecording({
                          audioUri,
                          tripPlaceId: tp.id,
                        });
                        await loadData();
                      }}
                      onDelete={async (id) => {
                        await deleteRecording(id);
                        await loadData();
                      }}
                      compact
                    />
                  </Card.Content>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={openAddPlaceModal}
        label={t('trips.addPlace')}
      />

      {(() => {
        const tp = viewingPhotosTpId
          ? places.find((p) => p.id === viewingPhotosTpId)
          : null;
        return (
          <PhotoViewer
            visible={!!tp && tp.photos.length > 0}
            photos={tp?.photos.map((p) => ({ id: p.id, fileUri: p.fileUri })) ?? []}
            onClose={() => setViewingPhotosTpId(null)}
            onDelete={(id) =>
              handleDeletePhoto(id, () => {
                if (tp && tp.photos.length === 1) setViewingPhotosTpId(null);
              })
            }
          />
        );
      })()}

      <Modal
        visible={addPlaceModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddPlaceModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">{t('trips.addPlace')}</Text>
              <IconButton
                icon="close"
                onPress={() => setAddPlaceModalVisible(false)}
              />
            </View>
            <ScrollView style={styles.modalList}>
              <Button
                mode="outlined"
                icon="plus"
                onPress={() => {
                  setAddPlaceModalVisible(false);
                  router.push(`/places/new?addToTrip=${tripId}`);
                }}
                style={styles.addNewButton}
              >
                {t('trips.createNewPlace')}
              </Button>
              {availablePlaces.map((place) => (
                <List.Item
                  key={place.id}
                  title={place.name}
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                  onPress={() => handleAddPlace(place.id)}
                />
              ))}
              {availablePlaces.length === 0 && (
                <Text variant="bodyMedium" style={styles.modalEmpty}>
                  {t('trips.allPlacesAdded')}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AddPhotoButton({
  tripPlaceId,
  onAdd,
}: {
  tripPlaceId: number;
  onAdd: (id: number, source: 'gallery' | 'camera') => void;
}) {
  const { t } = useTranslation();
  const [menuVisible, setMenuVisible] = useState(false);
  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button
          mode="outlined"
          icon="camera"
          compact
          onPress={() => setMenuVisible(true)}
        >
          {t('trips.photo')}
        </Button>
      }
    >
      <Menu.Item
        onPress={() => {
          setMenuVisible(false);
          onAdd(tripPlaceId, 'camera');
        }}
        title={t('places.takePhoto')}
        leadingIcon="camera"
      />
      <Menu.Item
        onPress={() => {
          setMenuVisible(false);
          onAdd(tripPlaceId, 'gallery');
        }}
        title={t('trips.fromGallery')}
        leadingIcon="image"
      />
    </Menu>
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
    paddingBottom: 80,
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
    marginBottom: 4,
  },
  dates: {
    color: '#666',
  },
  chip: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  segmented: {
    marginBottom: 16,
  },
  empty: {
    textAlign: 'center',
    padding: 32,
    color: '#666',
  },
  placeCard: {
    marginBottom: 12,
  },
  placeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderButtons: {
    flexDirection: 'column',
  },
  placeRight: {
    flexDirection: 'row',
  },
  expandedContent: {
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeDesc: {
    marginBottom: 12,
    color: '#666',
  },
  visitedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  dateInput: {
    flex: 1,
  },
  notesRow: {
    marginBottom: 12,
  },
  notesEdit: {
    marginTop: 4,
  },
  notesInput: {
    marginBottom: 8,
  },
  placeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalList: {
    padding: 16,
  },
  addNewButton: {
    marginBottom: 16,
  },
  modalEmpty: {
    textAlign: 'center',
    padding: 24,
    color: '#666',
  },
});
