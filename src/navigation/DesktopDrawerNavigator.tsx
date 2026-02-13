import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { FONTS } from '../theme/typography';
import { BrowseScreen } from '../screens/BrowseScreen';
import { NotebooksScreen } from '../screens/NotebooksScreen';
import { NotebookDetailScreen } from '../screens/NotebookDetailScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TopicsScreen } from '../screens/TopicsScreen';

const Drawer = createDrawerNavigator();
const BrowseStack = createNativeStackNavigator();
const NotebooksStack = createNativeStackNavigator();

// BrowseScreen handles Feed/Article switching internally via tabStore
function BrowseStackNavigator() {
  const colors = useThemeColors();

  return (
    <BrowseStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <BrowseStack.Screen name="BrowseHome" component={BrowseScreen} />
    </BrowseStack.Navigator>
  );
}

// Notebooks stack — article opening goes through tabStore + navigate to Browse
function NotebooksStackNavigator() {
  const colors = useThemeColors();

  return (
    <NotebooksStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <NotebooksStack.Screen name="NotebooksHome" component={NotebooksScreen} />
      <NotebooksStack.Screen name="NotebookDetail" component={NotebookDetailScreen} />
      <NotebooksStack.Screen name="History" component={HistoryScreen} />
    </NotebooksStack.Navigator>
  );
}

function SidebarContent({ navigation }: any) {
  const colors = useThemeColors();

  const navItems = [
    { label: 'Feed', iconName: 'home', screen: 'Feed' },
    { label: 'Topics', iconName: 'tag', screen: 'Topics' },
    { label: 'Notebooks', iconName: 'book', screen: 'Notebooks' },
    { label: 'Settings', iconName: 'settings', screen: 'Settings' },
  ];

  return (
    <View style={[styles.sidebar, { backgroundColor: colors.backgroundSecondary }]}>
      <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
        <Text style={[styles.sidebarLogo, { color: colors.primary }]}>
          rabbithole
        </Text>
      </View>

      <View style={styles.navItems}>
        {navItems.map((item) => (
          <Pressable
            key={item.screen}
            onPress={() => navigation.navigate(item.screen)}
            style={({ pressed }) => [
              styles.navItem,
              { borderRadius: borderRadius.md, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name={item.iconName as any} size={18} color={colors.textSecondary} />
            <Text style={[styles.navLabel, { color: colors.textPrimary }]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export const DesktopDrawerNavigator: React.FC = () => {
  const colors = useThemeColors();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <SidebarContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'permanent',
        drawerStyle: {
          backgroundColor: colors.backgroundSecondary,
          width: 240,
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },
      }}
    >
      <Drawer.Screen name="Feed" component={BrowseStackNavigator} />
      <Drawer.Screen name="Topics" component={TopicsScreen as any} />
      <Drawer.Screen name="Notebooks" component={NotebooksStackNavigator} />
      <Drawer.Screen name="Settings" component={SettingsScreen as any} />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  sidebarHeader: {
    paddingBottom: spacing.lg,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
  },
  sidebarLogo: {
    fontSize: 20,
    fontFamily: FONTS.crimsonPro.extraBold,
  },
  navItems: {
    gap: spacing.xs,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.sm,
    gap: spacing.sm,
  },
  navLabel: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 15,
  },
});
