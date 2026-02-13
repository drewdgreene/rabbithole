import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';

export const isModuleAvailable = (moduleName: string): boolean => {
  try {
    require.resolve(moduleName);
    return true;
  } catch (e) {
    return false;
  }
};

export const platformSelect = <T>(values: {
  web?: T;
  ios?: T;
  android?: T;
  mobile?: T;
  default?: T;
}): T | undefined => {
  if (isWeb && values.web !== undefined) return values.web;
  if (isIOS && values.ios !== undefined) return values.ios;
  if (isAndroid && values.android !== undefined) return values.android;
  if (isMobile && values.mobile !== undefined) return values.mobile;
  return values.default;
};
