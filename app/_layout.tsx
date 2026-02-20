import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import { initDatabase } from '../lib/db';
import { ThemeProvider, useThemeMode } from '../lib/theme';

const BG_IMAGE = require('../assets/backgrounds/gonext-bg.png');

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}

function RootLayoutContent() {
  const { theme, isDark } = useThemeMode();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initDatabase().then(() => setDbReady(true));
  }, []);

  const backgroundStyle = isDark
    ? [styles.background, { backgroundColor: theme.colors.background }]
    : styles.background;

  const renderContent = (children: React.ReactNode) =>
    isDark ? (
      <View style={backgroundStyle}>{children}</View>
    ) : (
      <ImageBackground source={BG_IMAGE} style={backgroundStyle} resizeMode="cover">
        {children}
      </ImageBackground>
    );

  if (!dbReady) {
    return (
      <PaperProvider theme={theme}>
        {renderContent(
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge">Загрузка...</Text>
          </View>
        )}
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      {renderContent(
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      )}
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
