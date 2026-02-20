import AsyncStorage from '@react-native-async-storage/async-storage';
import Color from 'color';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

const THEME_KEY = '@gonext/theme';
const PRIMARY_COLOR_KEY = '@gonext/primaryColor';

export type ThemeMode = 'light' | 'dark';

/** 10 preset цветов для выбора основной темы */
export const PRESET_COLORS = [
  '#6750A4', // фиолетовый (MD3 default)
  '#D32F2F', // красный
  '#388E3C', // зелёный
  '#F57C00', // оранжевый
  '#7B1FA2', // пурпурный
  '#00796B', // бирюзовый
  '#303F9F', // индиго
  '#C2185B', // розовый
  '#FF8F00', // янтарный
  '#0097A7', // циан
] as const;

export type PresetColor = (typeof PRESET_COLORS)[number];

function applyPrimaryToTheme(baseTheme: MD3Theme, primaryHex: string): MD3Theme {
  const c = Color(primaryHex);
  const onPrimary = c.isDark() ? '#FFFFFF' : '#000000';
  const primaryContainer = baseTheme.dark
    ? c.mix(Color('#000000'), 0.5).hex()
    : c.mix(Color('#FFFFFF'), 0.7).hex();
  const onPrimaryContainer = baseTheme.dark
    ? c.mix(Color('#FFFFFF'), 0.5).hex()
    : c.darken(0.2).hex();

  return {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: primaryHex,
      onPrimary,
      primaryContainer,
      onPrimaryContainer,
    },
  };
}

type ThemeContextValue = {
  theme: MD3Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
  primaryColor: string;
  setPrimaryColor: (color: string) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [primaryColor, setPrimaryColorState] = useState<string>(PRESET_COLORS[0]);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(PRIMARY_COLOR_KEY),
    ]).then(([storedTheme, storedColor]) => {
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemeModeState(storedTheme);
      }
      if (storedColor && PRESET_COLORS.includes(storedColor as PresetColor)) {
        setPrimaryColorState(storedColor);
      }
    });
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  }, []);

  const setPrimaryColor = useCallback(async (color: string) => {
    setPrimaryColorState(color);
    await AsyncStorage.setItem(PRIMARY_COLOR_KEY, color);
  }, []);

  const theme = useMemo(
    () =>
      applyPrimaryToTheme(
        themeMode === 'dark' ? MD3DarkTheme : MD3LightTheme,
        primaryColor
      ),
    [themeMode, primaryColor]
  );

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        isDark: themeMode === 'dark',
        primaryColor,
        setPrimaryColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return ctx;
}
