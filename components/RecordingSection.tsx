/**
 * Секция голосовых записей: кнопка записи и список записей с воспроизведением.
 */

import { useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, IconButton, List, Text } from 'react-native-paper';
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
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const recordingRef = useRef<RecordingHandle | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const handleStartRecording = useCallback(async () => {
    const recording = await startRecording({
      onStateChange: setIsRecording.bind(null, true),
      onDurationUpdate: setDurationMs,
    });
    if (recording) {
      recordingRef.current = recording;
      setDurationMs(0);
    } else {
      Alert.alert(
        'Нет доступа',
        'Разрешите доступ к микрофону в настройках приложения.'
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
      Alert.alert('Ошибка', 'Не удалось сохранить запись');
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
        Alert.alert('Ошибка', 'Не удалось воспроизвести запись');
      }
    },
    [playingId]
  );

  const handleDelete = useCallback(
    (r: Recording) => {
      Alert.alert('Удалить запись?', '', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
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
    [onDelete, playingId]
  );

  return (
    <View style={styles.container}>
      <View style={styles.recordRow}>
        {isRecording ? (
          <>
            <View style={styles.recordingInfo}>
              <Text variant="bodyMedium" style={styles.recordingText}>
                Запись: {formatDuration(durationMs)}
              </Text>
            </View>
            <Button
              mode="contained"
              icon="stop"
              onPress={handleStopRecording}
              buttonColor="#c62828"
            >
              Остановить
            </Button>
          </>
        ) : (
          <Button
            mode="outlined"
            icon="microphone"
            onPress={handleStartRecording}
            style={compact ? undefined : styles.recordButton}
          >
            {compact ? 'Записать' : 'Голосовая запись'}
          </Button>
        )}
      </View>

      {recordings.length > 0 && (
        <View style={styles.list}>
          <Text variant="labelMedium" style={styles.listTitle}>
            Записи ({recordings.length})
          </Text>
          {recordings.map((r) => (
            <List.Item
              key={r.id}
              title={
                r.transcribedText
                  ? r.transcribedText.slice(0, 50) + (r.transcribedText.length > 50 ? '…' : '')
                  : `Запись от ${new Date(r.createdAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}`
              }
              left={(props) => (
                <IconButton
                  icon={playingId === r.id ? 'stop' : 'play'}
                  size={24}
                  onPress={() => handlePlay(r)}
                  {...props}
                />
              )}
              right={(props) => (
                <IconButton
                  icon="delete"
                  size={20}
                  onPress={() => handleDelete(r)}
                  {...props}
                />
              )}
            />
          ))}
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
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingText: {
    color: '#c62828',
    fontWeight: '500',
  },
  recordButton: {
    alignSelf: 'flex-start',
  },
  list: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  listTitle: {
    marginBottom: 4,
    color: '#666',
  },
});
