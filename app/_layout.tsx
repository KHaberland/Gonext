import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import { initDatabase } from '../lib/db';

const BG_IMAGE = require('../assets/backgrounds/gonext-bg.png');

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  if (!dbReady) {
    return (
      <PaperProvider>
        <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge">Загрузка...</Text>
          </View>
        </ImageBackground>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <ImageBackground source={BG_IMAGE} style={styles.background} resizeMode="cover">
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </ImageBackground>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});
