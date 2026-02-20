import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { ActivityIndicator, PaperProvider, Text } from 'react-native-paper';
import { initDatabase } from '../lib/db';
import { initI18n } from '../lib/i18n';
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
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([initI18n(), initDatabase()]).then(() => setReady(true));
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

  if (!ready) {
    return (
      <PaperProvider theme={theme}>
        {renderContent(
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge">Loading...</Text>
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
