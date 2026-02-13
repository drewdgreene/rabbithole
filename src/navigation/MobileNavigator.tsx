import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColors } from '../theme';
import { FONTS } from '../theme/typography';
import { BrowseScreen } from '../screens/BrowseScreen';
import { NotebooksScreen } from '../screens/NotebooksScreen';
import { NotebookDetailScreen } from '../screens/NotebookDetailScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TopicsScreen } from '../screens/TopicsScreen';
import type { MainStackParamList } from '../types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MobileNavigator: React.FC = () => {
  const colors = useThemeColors();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: FONTS.googleSans.regular,
          fontSize: 20,
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="Browse"
        component={BrowseScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Topics"
        component={TopicsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notebooks"
        component={NotebooksScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotebookDetail"
        component={NotebookDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen as any}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
