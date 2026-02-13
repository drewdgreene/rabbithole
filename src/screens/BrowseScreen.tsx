import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTabStore } from '../store/tabStore';
import { useThemeColors } from '../theme';
import { ScreenContainer } from '../components/ScreenContainer';
import { FeedScreen } from './FeedScreen';
import { ArticleContent } from './ArticleScreen';
import { FloatingTabBar } from '../components/FloatingTabBar';
import { TabPillStrip } from '../components/TabPillStrip';

export const BrowseScreen: React.FC = () => {
  const colors = useThemeColors();
  const activeTabId = useTabStore(s => s.activeTabId);
  const activeTab = useTabStore(s => s.tabs[s.activeTabId]);
  const articleTabCount = useTabStore(s =>
    Object.values(s.tabs).filter(t => t.type === 'article').length
  );

  return (
    <ScreenContainer backgroundColor={colors.background}>
      <View style={styles.content}>
        {!activeTab || activeTab.type === 'feed' ? (
          <FeedScreen />
        ) : (
          <ArticleContent
            key={activeTabId}
            pageId={activeTab.pageId || 0}
            title={activeTab.title || ''}
            source={activeTab.source}
            sourceDetail={activeTab.sourceDetail}
            restoreScrollPct={activeTab.scrollDepthPct}
          />
        )}
      </View>

      {/* Tab UI overlay */}
      <View style={styles.tabOverlay} pointerEvents="box-none">
        {articleTabCount > 0 && <TabPillStrip />}
        <FloatingTabBar />
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  tabOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
});
