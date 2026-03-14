import { Filter, Palette, Shield, Sparkles } from 'lucide-react';
import type { CatalogItem } from '../lib/cosmetics';
import { stripMinecraftFormatting } from './skinRarity';

export type BrowseFilterKey = 'all' | 'petSkin' | 'dye' | `helmet:${string}`;

function slugifyFilterValue(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function getHelmetCategoryFilterKey(category: string): BrowseFilterKey {
  return `helmet:${slugifyFilterValue(category || 'helmet')}`;
}

export function getBrowseFilterKey(item: CatalogItem): BrowseFilterKey {
  switch (item.type) {
    case 'petSkin':
      return 'petSkin';
    case 'dye':
      return 'dye';
    case 'helmetSkin':
      return getHelmetCategoryFilterKey(item.category);
    default: {
      const exhaustiveCheck: never = item.type;
      return exhaustiveCheck;
    }
  }
}

export function getBrowseDescription(item: CatalogItem) {
  const description = item.description?.trim();
  if (!description) return null;

  const normalizedDescription = stripMinecraftFormatting(description).trim().toLowerCase();
  const redundantPetSkinLabel = `${item.parentNamePlain.trim().toLowerCase()} skin`;

  if (normalizedDescription === redundantPetSkinLabel) {
    return null;
  }

  return description;
}

export function getTypeIcon(type: BrowseFilterKey) {
  switch (type) {
    case 'all':
      return Filter;
    case 'petSkin':
      return Sparkles;
    case 'dye':
      return Palette;
    default:
      return Shield;
  }
}

export function matchesBrowseQuery(item: CatalogItem, query: string) {
  if (!query) return true;

  const haystacks = [
    item.itemNamePlain,
    item.parentNamePlain,
    item.category,
    item.typeLabel,
    stripMinecraftFormatting(item.description ?? ''),
  ];

  return haystacks.some((value) => value.toLowerCase().includes(query));
}

export function uniqueSortedValues<T extends string>(values: Iterable<T>, compare?: (a: T, b: T) => number) {
  return [...new Set(values)].sort(compare);
}
