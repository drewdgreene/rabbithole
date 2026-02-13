import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors, spacing, borderRadius } from '../theme';
import { typography, FONTS } from '../theme/typography';
import { useThemeStore } from '../store/themeStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useInterestStore } from '../store/interestStore';
import { useArticleStore } from '../store/articleStore';
import { useNotebookStore } from '../store/notebookStore';
import { useFeedStore } from '../store/feedStore';
import { useHistoryStore } from '../store/historyStore';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import type { ThemeMode } from '../types';

export const SettingsScreen: React.FC<{ onResetOnboarding?: () => void }> = ({
  onResetOnboarding,
}) => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { themeMode, setThemeMode } = useThemeStore();
  const { resetOnboarding } = useOnboardingStore();
  const { resetProfile, getTopCategories, profile } = useInterestStore();
  const { clearCache } = useArticleStore();
  const { clearAll: clearNotebooks, savedArticles, notebooks } = useNotebookStore();
  const { clearFeed } = useFeedStore();

  const topCategories = getTopCategories(5);
  const readCount = profile.readHistory.length;

  const themeModes: { label: string; value: ThemeMode; iconName: string }[] = [
    { label: 'System', value: 'system', iconName: 'monitor' },
    { label: 'Light', value: 'light', iconName: 'sun' },
    { label: 'Dark', value: 'dark', iconName: 'moon' },
  ];

  const confirmAction = (title: string, message: string, action: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`${title}\n\n${message}`)) action();
    } else {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', style: 'destructive', onPress: action },
      ]);
    }
  };

  const handleClearHistory = () => {
    confirmAction(
      'Clear History & Cache',
      'This will clear your read history and article cache. Your interest profile and saved articles will be kept.',
      () => { clearCache(); clearFeed(); useHistoryStore.getState().clearHistory(); }
    );
  };

  const handleResetAll = () => {
    confirmAction(
      'Reset Everything',
      'This will delete all your data including saved articles, notebooks, and interest profile. You will need to redo onboarding.',
      () => {
        resetProfile();
        clearCache();
        clearFeed();
        clearNotebooks();
        useHistoryStore.getState().clearHistory();
        resetOnboarding();
        onResetOnboarding?.();
      }
    );
  };

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <View style={styles.backRow}>
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>
                Back
              </Text>
            </View>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Settings</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Theme section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Appearance
            </Text>
            <View style={styles.themeRow}>
              {themeModes.map((mode) => (
                <Pressable
                  key={mode.value}
                  onPress={() => setThemeMode(mode.value)}
                  style={[
                    styles.themeButton,
                    {
                      backgroundColor:
                        themeMode === mode.value ? colors.primary : colors.surface,
                      borderColor:
                        themeMode === mode.value ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather
                    name={mode.iconName as any}
                    size={16}
                    color={themeMode === mode.value ? '#FFFDF9' : colors.textPrimary}
                  />
                  <Text
                    style={[
                      styles.themeButtonText,
                      {
                        color: themeMode === mode.value ? '#FFFDF9' : colors.textPrimary,
                      },
                    ]}
                  >
                    {mode.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Interests section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Your Top Interests
            </Text>
            {topCategories.length > 0 ? (
              <View style={styles.interestChips}>
                {topCategories.map((cat) => (
                  <View
                    key={cat}
                    style={[styles.interestChip, { backgroundColor: colors.categoryBadge }]}
                  >
                    <Text style={[styles.interestChipText, { color: colors.categoryBadgeText }]}>
                      {cat}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.sectionBody, { color: colors.textTertiary }]}>
                No interest data yet. Start reading!
              </Text>
            )}
          </View>

          {/* Stats section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Your Stats
            </Text>
            <View style={[styles.statsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <StatRow label="Articles read" value={String(readCount)} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <StatRow label="Saved articles" value={String(savedArticles.length)} colors={colors} />
              <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
              <StatRow label="Notebooks" value={String(notebooks.length)} colors={colors} />
            </View>
          </View>

          {/* Data section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Data
            </Text>
            <Pressable
              onPress={handleClearHistory}
              style={[styles.actionButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
                Clear Read History & Cache
              </Text>
              <Text style={[styles.actionSubtext, { color: colors.textTertiary }]}>
                Keeps saved articles and interest profile
              </Text>
            </Pressable>
            <Pressable
              onPress={handleResetAll}
              style={[styles.actionButton, { borderColor: colors.error }]}
            >
              <Text style={[styles.actionButtonText, { color: colors.error }]}>
                Reset Everything
              </Text>
              <Text style={[styles.actionSubtext, { color: colors.textTertiary }]}>
                Deletes all data and restarts onboarding
              </Text>
            </Pressable>
          </View>

          {/* About */}
          <View style={[styles.section, styles.aboutSection]}>
            <Text style={[styles.aboutLogo, { color: colors.textTertiary }]}>
              rabbithole
            </Text>
            <Text style={[styles.aboutText, { color: colors.textTertiary }]}>
              v1.0
            </Text>
            <Text style={[styles.aboutText, { color: colors.textTertiary }]}>
              Feed-powered Wikipedia reader
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenContainer>
  );
};

function StatRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 70,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 14,
  },
  headerTitle: {
    flex: 1,
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 18,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  sectionBody: {
    ...typography.body,
  },
  themeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
  },
  themeIcon: {
    // icon rendered via Feather component
  },
  themeButtonText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 14,
  },
  interestChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  interestChip: {
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.pill,
  },
  interestChipText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 13,
  },
  statsCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  statLabel: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
  },
  statValue: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 15,
  },
  statDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
  },
  actionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: 2,
  },
  actionButtonText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 15,
  },
  actionSubtext: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 12,
  },
  aboutSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  aboutLogo: {
    fontFamily: FONTS.crimsonPro.extraBold,
    fontSize: 18,
  },
  aboutText: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 13,
  },
});
