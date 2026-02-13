import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InterestProfile } from '../../types';
import { STORAGE_KEY } from './interestHelpers';

export async function saveProfile(profile: InterestProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.error('[InterestStore] Failed to save profile:', error);
  }
}

export async function loadProfileFromStorage(): Promise<InterestProfile | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) {
      return JSON.parse(json) as InterestProfile;
    }
  } catch (error) {
    console.error('[InterestStore] Failed to load profile:', error);
  }
  return null;
}

export async function removeProfile(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[InterestStore] Failed to reset profile:', error);
  }
}
