import { CompanionOption, Language, MenuItem, SoftDrinkOption } from '../types';

export interface CompanionInfo {
  id: CompanionOption;
  nameEs: string;
  nameEn: string;
  shortDescEs: string;
  shortDescEn: string;
  iconType: 'naan' | 'roti' | 'rice' | 'garlic_naan';
}

export const COMPANION_OPTIONS: CompanionInfo[] = [
  {
    id: 'plain_naan',
    nameEs: 'Pan Naan Tradicional',
    nameEn: 'Plain Naan',
    shortDescEs: 'Horneado al Tandoor',
    shortDescEn: 'Tandoori baked',
    iconType: 'naan',
  },
  {
    id: 'roti',
    nameEs: 'Pan Roti (Naan Integral)',
    nameEn: 'Roti (Whole Wheat)',
    shortDescEs: '100% Trigo Integral',
    shortDescEn: '100% Whole Wheat',
    iconType: 'roti',
  },
  {
    id: 'rice',
    nameEs: 'Arroz Basmati Simple',
    nameEn: 'Plain Basmati Rice',
    shortDescEs: 'Grano largo aromático',
    shortDescEn: 'Aromatic long grain',
    iconType: 'rice',
  },
  {
    id: 'garlic_naan',
    nameEs: 'Pan Garlic Naan (Ajo)',
    nameEn: 'Garlic Naan',
    shortDescEs: 'Con ajo fresco y mantequilla',
    shortDescEn: 'With fresh garlic & butter',
    iconType: 'garlic_naan',
  },
];

export interface SoftDrinkInfo {
  id: SoftDrinkOption;
  nameEs: string;
  nameEn: string;
  badgeColor: string;
}

export const SOFT_DRINK_OPTIONS: SoftDrinkInfo[] = [
  { id: 'coke', nameEs: 'coke', nameEn: 'coke', badgeColor: '#E61C24' },
  { id: 'fanta', nameEs: 'fanta', nameEn: 'fanta', badgeColor: '#FF7900' },
  { id: 'sprite', nameEs: 'sprite', nameEn: 'sprite', badgeColor: '#008B45' },
  { id: 'fuze_tea', nameEs: 'fuze tea', nameEn: 'fuze tea', badgeColor: '#6B8E23' },
];

export type CustomizationType =
  | 'curry_with_companion' // chicken, mutton, seafood, vegetarian, eggs -> Spice Level + Choice of 1 Companion
  | 'starter_spice_only'   // starters -> Spice Level only, NO add-on's
  | 'soft_drink_flavor'    // soft drinks -> Choice of Coke, Fanta, Sprite, Fuze Tea
  | 'none';                // soups, salads, other drinks, breads, biryanis, desserts, alcohols -> No customization

/**
 * Determine the exact customization rule for a menu item based on category and dish name
 */
export function getItemCustomizationType(item: {
  id?: string;
  categoryId: string;
  nameEs?: string;
  nameEn?: string;
}): CustomizationType {
  const catId = item.categoryId;
  const fullName = `${item.nameEs || ''} ${item.nameEn || ''} ${item.id || ''}`.toLowerCase();

  // 1. Meat & Chicken, Chicken Curries, Mutton & Lamb Curries, Fish & Prawns, Vegetarian & Vegan, Egg Specialties
  if (['chicken', 'mutton', 'seafood', 'vegetarian', 'eggs'].includes(catId)) {
    return 'curry_with_companion';
  }

  // 2. Starters & Appetizers: Spice level only, NO add-ons
  if (catId === 'starters') {
    return 'starter_spice_only';
  }

  // 3. Soft Drinks inside drinks category
  if (
    catId === 'drinks' &&
    (fullName.includes('soft drink') ||
      fullName.includes('gaseosa') ||
      fullName.includes('coke') ||
      fullName.includes('soda') ||
      item.id?.includes('109_soft_drinks'))
  ) {
    return 'soft_drink_flavor';
  }

  // 4. Salads & Raita, Indian Soups, Other Drinks, Breads, Biryanis, Desserts, Alcohol: Nothing
  return 'none';
}

export function getCompanionLabel(option: CompanionOption, lang: Language): string {
  const match = COMPANION_OPTIONS.find((c) => c.id === option);
  if (!match) return option;
  return lang === 'es' ? match.nameEs : match.nameEn;
}

export function getSoftDrinkLabel(option: SoftDrinkOption, lang: Language): string {
  const match = SOFT_DRINK_OPTIONS.find((d) => d.id === option);
  if (!match) return option;
  return lang === 'es' ? match.nameEs : match.nameEn;
}
