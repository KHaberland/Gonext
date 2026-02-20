/**
 * Секция голосовых записей: кнопка записи и список записей с воспроизведением.
 */

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import {
  playAudio,
  startRecording,
  stopRecordingAndSave,
  type RecordingHandle,
} from '../lib/audio-recorder';
import type { Recording } from '../types';
import { Audio } from 'expo-av';

function formatDuration(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export interface RecordingSectionProps {
  recordings: Recording[];
  onRecordSaved: (audioUri: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  compact?: boolean;
}

export function RecordingSection({
  recordings,
  onRecordSaved,
  onDelete,
  compact = false,
}: RecordingSectionProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const recordingRef = useRef<RecordingHandle | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const handleStartRecording = useCallback(async () => {
    const recording = await startRecording({
      onStateChange: (state) => setIsRecording(state === 'recording'),
      onDurationUpdate: setDurationMs,
    });
    if (recording) {
      recordingRef.current = recording;
      setDurationMs(0);
    } else {
      Alert.alert(
        t('recordings.noAccess'),
        t('recordings.noAccessHint')
      );
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null;
    setIsRecording(false);

    const uri = await stopRecordingAndSave(rec);
    if (uri) {
      await onRecordSaved(uri);
    } else {
      Alert.alert(t('common.error'), t('recordings.errorSave'));
    }
  }, [onRecordSaved]);

  const handlePlay = useCallback(
    async (r: Recording) => {
      if (playingId === r.id) {
        try {
          await soundRef.current?.stopAsync();
          await soundRef.current?.unloadAsync();
        } catch {}
        soundRef.current = null;
        setPlayingId(null);
        return;
      }

      try {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const sound = await playAudio(r.audioUri);
        soundRef.current = sound;
        setPlayingId(r.id);

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            setPlayingId(null);
            soundRef.current = null;
          }
        });
      } catch (e) {
        console.error('Ошибка воспроизведения:', e);
        Alert.alert(t('common.error'), t('recordings.errorPlay'));
      }
    },
    [playingId]
  );

  const handleDelete = useCallback(
    (r: Recording) => {
      Alert.alert(t('recordings.deleteConfirm'), '', [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            if (playingId === r.id && soundRef.current) {
              try {
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
              } catch {}
              soundRef.current = null;
              setPlayingId(null);
            }
            await onDelete(r.id);
          },
        },
      ]);
    },
    [onDelete, playingId, t]
  );

  return (
    <View style={styles.container}>
      <View style={styles.recordRow}>
        {isRecording ? (
          <>
            <View
              style={[
                styles.recordingBadge,
                {
                  backgroundColor: theme.colors.primary,
                },
              ]}
            >
              <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
                {t('recordings.recording')}: {formatDuration(durationMs)}
              </Text>
            </View>
            <Button
              mode="contained"
              icon="stop"
              onPress={handleStopRecording}
              buttonColor="#c62828"
              style={styles.stopButton}
            >
              {t('recordings.stop')}
            </Button>
          </>
        ) : (
          <Button
            mode="contained"
            icon="microphone"
            onPress={handleStartRecording}
            style={styles.recordButton}
          >
            {compact ? t('recordings.record') : t('recordings.voiceRecording')}
          </Button>
        )}
      </View>

      {recordings.length > 0 && (
        <View style={[styles.list, { borderTopColor: theme.colors.primary }]}>
          <View
            style={[
              styles.listTitle,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Text variant="labelLarge" style={{ color: theme.colors.onPrimary }}>
              {t('recordings.recordingsCount', { count: recordings.length })}
            </Text>
          </View>
          {recordings.map((r) => {
            const labelText = r.transcribedText
              ? r.transcribedText.slice(0, 50) + (r.transcribedText.length > 50 ? '…' : '')
              : t('recordings.recordFrom', {
                  date: new Date(r.createdAt).toLocaleString(undefined, {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                });
            return (
              <View
                key={r.id}
                style={[
                  styles.recordingItem,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <IconButton
                  icon={playingId === r.id ? 'stop' : 'play'}
                  size={20}
                  onPress={() => handlePlay(r)}
                  iconColor={theme.colors.onPrimary}
                  style={styles.recordingIcon}
                />
                <Text
                  variant="labelLarge"
                  numberOfLines={1}
                  style={[styles.recordingLabelText, { color: theme.colors.onPrimary }]}
                >
                  {labelText}
                </Text>
                <IconButton
                  icon="delete"
                  size={18}
                  onPress={() => handleDelete(r)}
                  iconColor={theme.colors.onPrimary}
                  style={styles.recordingIcon}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    marginBottom: 8,
  },
  recordingBadge: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  stopButton: {
    minWidth: 100,
  },
  recordButton: {
    alignSelf: 'stretch',
    flex: 1,
  },
  list: {
    marginTop: 8,
    borderTopWidth: 2,
    paddingTop: 8,
  },
  listTitle: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 20,
  },
  recordingLabelText: {
    flex: 1,
    marginHorizontal: 4,
  },
  recordingIcon: {
    margin: 0,
  },
});
