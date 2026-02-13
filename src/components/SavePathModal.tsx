import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, Modal, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { useThemeColors, useEffectiveColorScheme, spacing, borderRadius } from '../theme';
import { FONTS } from '../theme/typography';
import { useTabStore } from '../store/tabStore';
import { useNotebookStore } from '../store/notebookStore';
import { tapFeedback } from '../utils/haptics';

interface SavePathModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SavePathModal: React.FC<SavePathModalProps> = ({ visible, onClose }) => {
  const colors = useThemeColors();
  const isDark = useEffectiveColorScheme() === 'dark';
  const [name, setName] = useState('');

  // Pre-fill name from the first root article tab
  useEffect(() => {
    if (visible) {
      const state = useTabStore.getState();
      const tabOrder = state.tabOrder;
      if (tabOrder.length > 0) {
        const rootTab = state.tabs[tabOrder[0]];
        if (rootTab?.displayTitle || rootTab?.title) {
          setName(rootTab.displayTitle || rootTab.title || '');
        }
      }
    }
  }, [visible]);

  const handleSave = async () => {
    if (!name.trim()) return;
    tapFeedback();

    const state = useTabStore.getState();
    // Find the first root tab to use as the path root
    const rootTabId = state.tabOrder[0];
    if (rootTabId) {
      await useNotebookStore.getState().savePath(name.trim(), rootTabId);
    }

    setName('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={{ flex: 1 }} />
      </Pressable>

      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 240 }}
        style={[
          styles.modal,
          {
            backgroundColor: isDark ? '#261A10' : '#FFFDF9',
            borderColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Save Path
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Save this rabbit hole to revisit later
        </Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Path name..."
          placeholderTextColor={colors.placeholder}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />

        <View style={styles.buttons}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveBtn,
              {
                backgroundColor: name.trim() ? colors.primary : colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            disabled={!name.trim()}
          >
            <Text style={[styles.saveText, { color: isDark ? '#1A120B' : '#FFFDF9' }]}>
              Save Path
            </Text>
          </Pressable>
        </View>
      </MotiView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    position: 'absolute',
    top: '30%',
    left: spacing.lg,
    right: spacing.lg,
    maxWidth: 340,
    alignSelf: 'center',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: {
    fontFamily: FONTS.googleSans.bold,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 14,
    lineHeight: 18,
  },
  input: {
    fontFamily: FONTS.googleSans.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
    marginTop: spacing.xs,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cancelText: {
    fontFamily: FONTS.googleSans.medium,
    fontSize: 14,
  },
  saveBtn: {
    paddingHorizontal: spacing.md + 4,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.pill,
  },
  saveText: {
    fontFamily: FONTS.googleSans.semibold,
    fontSize: 14,
  },
});
