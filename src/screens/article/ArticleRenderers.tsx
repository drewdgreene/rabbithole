import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { spacing } from '../../theme';

export function WebArticleRenderer({
  html,
}: {
  html: string;
  onLinkPress: (url: string) => boolean;
}) {
  // Link clicks and scroll depth are handled via postMessage in the parent
  // component's useEffect (handleMessage listener). The inline script in
  // the HTML intercepts clicks and sends { type: 'link', url } messages.
  return (
    <View style={styles.webViewContainer}>
      <iframe
        srcDoc={html}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
          height: '100%',
        } as any}
        sandbox="allow-same-origin allow-scripts"
      />
    </View>
  );
}

export function MobileArticleRenderer({
  html,
  onLinkPress,
  onScrollDepth,
  onScrollY,
  onImagePress,
  bgColor,
}: {
  html: string;
  onLinkPress: (url: string) => boolean;
  onScrollDepth?: (depth: number) => void;
  onScrollY?: (y: number) => void;
  onImagePress?: (url: string) => void;
  bgColor?: string;
}) {
  const [WebViewComponent, setWebViewComponent] = useState<any>(null);

  useEffect(() => {
    import('react-native-webview').then(mod => {
      setWebViewComponent(() => mod.default || mod.WebView);
    }).catch(() => {
      console.error('[ArticleScreen] Failed to load WebView');
    });
  }, []);

  if (!WebViewComponent) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <View style={[styles.webViewContainer, bgColor ? { backgroundColor: bgColor } : undefined]}>
      <WebViewComponent
        source={{ html, baseUrl: 'https://en.wikipedia.org' }}
        style={{ flex: 1, backgroundColor: bgColor || 'transparent' }}
        originWhitelist={['*']}
        androidLayerType="hardware"
        onMessage={(event: any) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'link' && data.url) {
              onLinkPress(data.url);
            } else if (data.type === 'scrollDepth' && typeof data.depth === 'number') {
              onScrollDepth?.(data.depth);
            } else if (data.type === 'scrollY' && typeof data.y === 'number') {
              onScrollY?.(data.y);
            } else if (data.type === 'imagePress' && data.url) {
              onImagePress?.(data.url);
            }
          } catch {}
        }}
        onNavigationStateChange={(navState: any) => {
          if (navState.url && navState.url.includes('/wiki/') && !navState.url.includes('about:')) {
            onLinkPress(navState.url);
          }
        }}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webViewContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    padding: spacing.md,
  },
});
