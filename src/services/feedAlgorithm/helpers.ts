import { categories } from '../categoryData';
import { useOnboardingStore } from '../../store/onboardingStore';
import { TUNING } from './tuning';

/**
 * Select N category IDs weighted by decayed interest weights.
 * Higher-weighted categories are more likely to be picked.
 */
export function selectWeightedCategories(weights: Record<string, number>, n: number): string[] {
  const catIds = categories.map(c => c.id);

  // Include custom topics from onboarding store
  const customTopics = useOnboardingStore.getState().customTopics;
  const customIds = customTopics.map(t => t.id); // 'custom:WikiCategoryName'

  const allIds = [...catIds, ...customIds];

  const pool: { id: string; weight: number }[] = allIds
    .filter(id => (weights[id] || 0) > TUNING.decayFloor)
    .map(id => ({ id, weight: weights[id] || 0.05 }));

  if (pool.length === 0) {
    const shuffled = [...catIds].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  // Weighted random selection without replacement
  const selected: string[] = [];
  const remaining = [...pool];

  for (let i = 0; i < n && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (let j = 0; j < remaining.length; j++) {
      random -= remaining[j].weight;
      if (random <= 0) {
        selected.push(remaining[j].id);
        remaining.splice(j, 1);
        break;
      }
    }
  }

  return selected;
}
