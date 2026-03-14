import { cosmeticRarityRank, parseCosmeticRarityFromLore, stripMinecraftFormatting } from '../utils/skinRarity';

export function assetUrl(path: string) {
  if (/^(data:|https?:\/\/)/.test(path)) return path;
  const base = import.meta.env.BASE_URL || '';
  return `${base}${path.replace(/^\//, '')}`;
}

export type BrowseLayout = 'grid' | 'list';
export type CosmeticKind = 'petSkin' | 'dye' | 'helmetSkin';
export type CosmeticPreviewMode = 'skin-head' | 'flat-image';
export type CosmeticViewerSupport = 'petViewer' | 'none';

export interface PetAnimation {
  ticks: number;
  frames: string[];
}

export interface DayNightAnimation {
  day: PetAnimation;
  night: PetAnimation;
}

export interface PetVariant {
  id: string;
  name: string;
  texturePath: string;
  lore?: string;
  animated?: boolean;
  animation?: PetAnimation | DayNightAnimation;
}

export interface PetRecord {
  name: string;
  type: string;
  category: string;
  description: string;
  infoUrls: string[];
  recipes: unknown[];
  rarities: PetVariant[];
  variants: PetVariant[];
}

export interface RegistryEntry {
  name: string;
  category: string;
  rarities: { name: string }[];
  variantsCount: number;
}

export type CosmeticRarity =
  | 'COMMON'
  | 'UNCOMMON'
  | 'RARE'
  | 'EPIC'
  | 'LEGENDARY'
  | 'MYTHIC'
  | 'DIVINE'
  | 'SPECIAL'
  | 'VERY SPECIAL'
  | 'ULTIMATE'
  | 'SUPREME'
  | 'UNKNOWN';

export interface OwnedCosmeticEntry {
  key: string;
  type: CosmeticKind;
  parentId: string;
  parentName: string;
  itemId: string;
  itemName: string;
  rarity: CosmeticRarity;
  quantity: number;
  acquiredDate?: string;
  pricePaid?: number;
  updatedAt: number;
}

export interface CatalogItem {
  key: string;
  type: CosmeticKind;
  typeLabel: string;
  parentId: string;
  parentName: string;
  parentNamePlain: string;
  itemId: string;
  itemName: string;
  itemNamePlain: string;
  rarity: CosmeticRarity;
  rarityRank: number;
  category: string;
  description?: string;
  lore?: string;
  texturePath: string;
  animated: boolean;
  animation?: PetAnimation | DayNightAnimation;
  frames: string[];
  ticks: number;
  previewMode: CosmeticPreviewMode;
  viewerSupport: CosmeticViewerSupport;
  infoUrls: string[];
  viewIn3D?: {
    petId: string;
    skinId: string;
  };
}

interface StaticManifestItem {
  id: string;
  name: string;
  texturePath: string;
  lore?: string;
  animated?: boolean;
  animation?: PetAnimation | DayNightAnimation;
  previewMode?: CosmeticPreviewMode;
  description?: string;
  category?: string;
  parentId?: string;
  parentName?: string;
  infoUrls?: string[];
  viewerSupport?: CosmeticViewerSupport;
}

interface LegacyStaticManifest {
  kind: Exclude<CosmeticKind, 'petSkin'>;
  label: string;
  items: StaticManifestItem[];
}

interface VariantStaticManifest {
  variants: StaticManifestItem[];
}

interface LoadedStaticManifest {
  kind: Exclude<CosmeticKind, 'petSkin'>;
  label: string;
  items: StaticManifestItem[];
}

const STATIC_MANIFESTS: ReadonlyArray<{ kind: Exclude<CosmeticKind, 'petSkin'>; path: string }> = [
  { kind: 'dye', path: '/assets/dyes/dyes.json' },
  { kind: 'helmetSkin', path: '/assets/helmets/helmets.json' },
];

export function makeCosmeticKey(type: CosmeticKind, parentId: string, itemId: string) {
  return `${type}::${parentId}::${itemId}`;
}

export function getCosmeticTypeLabel(type: CosmeticKind) {
  switch (type) {
    case 'petSkin':
      return 'Pet Skin';
    case 'dye':
      return 'Dye';
    case 'helmetSkin':
      return 'Helmet Skin';
    default: {
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
    }
  }
}

function getDefaultPreviewMode(type: CosmeticKind): CosmeticPreviewMode {
  switch (type) {
    case 'petSkin':
    case 'dye':
    case 'helmetSkin':
      return 'skin-head';
    default: {
      const exhaustiveCheck: never = type;
      return exhaustiveCheck;
    }
  }
}

export function getCatalogLoadUnitCount(registry: Record<string, RegistryEntry>) {
  return Object.keys(registry).length + STATIC_MANIFESTS.length;
}

export function getAnimationFrames(variant: {
  texturePath: string;
  animation?: PetAnimation | DayNightAnimation;
  animated?: boolean;
}) {
  if (variant.animation) {
    if ('day' in variant.animation) {
      return { frames: variant.animation.day.frames, ticks: variant.animation.day.ticks };
    }
    return { frames: variant.animation.frames, ticks: variant.animation.ticks };
  }
  return { frames: [variant.texturePath], ticks: 2 };
}

function createCatalogItem(
  type: CosmeticKind,
  parentId: string,
  parentName: string,
  item: {
    id: string;
    name: string;
    texturePath: string;
    lore?: string;
    animated?: boolean;
    animation?: PetAnimation | DayNightAnimation;
    category?: string;
    description?: string;
    previewMode?: CosmeticPreviewMode;
    viewerSupport?: CosmeticViewerSupport;
    infoUrls?: string[];
    viewIn3D?: { petId: string; skinId: string };
  },
): CatalogItem {
  const itemName = item.name ?? item.id;
  const rarity = parseCosmeticRarityFromLore(item.lore);
  const animationFrames = getAnimationFrames(item);

  return {
    key: makeCosmeticKey(type, parentId, item.id),
    type,
    typeLabel: getCosmeticTypeLabel(type),
    parentId,
    parentName,
    parentNamePlain: stripMinecraftFormatting(parentName),
    itemId: item.id,
    itemName,
    itemNamePlain: stripMinecraftFormatting(itemName),
    rarity,
    rarityRank: cosmeticRarityRank(rarity),
    category: item.category ?? getCosmeticTypeLabel(type),
    description: item.description,
    lore: item.lore,
    texturePath: item.texturePath,
    animated: Boolean(item.animated || item.animation),
    animation: item.animation,
    frames: animationFrames.frames.map(assetUrl),
    ticks: animationFrames.ticks,
    previewMode: item.previewMode ?? getDefaultPreviewMode(type),
    viewerSupport: item.viewerSupport ?? 'none',
    infoUrls: item.infoUrls ?? [],
    viewIn3D: item.viewIn3D,
  };
}

function getStaticManifestLabel(kind: Exclude<CosmeticKind, 'petSkin'>) {
  switch (kind) {
    case 'dye':
      return 'Dyes';
    case 'helmetSkin':
      return 'Helmet Skins';
    default: {
      const exhaustiveCheck: never = kind;
      return exhaustiveCheck;
    }
  }
}

function normalizeStaticTexturePath(texturePath: string) {
  if (/^(data:|https?:\/\/)/.test(texturePath)) return texturePath;
  if (texturePath.startsWith('/assets/catalog/dyes/')) return texturePath.replace('/assets/catalog/dyes/', '/assets/dyes/');
  if (texturePath.startsWith('/assets/catalog/helmets/')) return texturePath.replace('/assets/catalog/helmets/', '/assets/helmets/');
  return texturePath;
}

function getStaticParentName(
  kind: Exclude<CosmeticKind, 'petSkin'>,
  manifest: LoadedStaticManifest,
  item: StaticManifestItem,
) {
  if (item.parentName) return item.parentName;
  if (kind === 'helmetSkin' && item.category) return item.category;
  return manifest.label;
}

async function loadStaticManifest(
  manifestPath: string,
  expectedKind: Exclude<CosmeticKind, 'petSkin'>,
): Promise<LoadedStaticManifest | null> {
  try {
    const response = await fetch(assetUrl(manifestPath));
    if (!response.ok) return null;

    const manifest = (await response.json()) as LegacyStaticManifest | VariantStaticManifest;

    if ('kind' in manifest && 'items' in manifest) {
      if (manifest.kind !== expectedKind) return null;
      return {
        kind: manifest.kind,
        label: manifest.label,
        items: manifest.items.map((item) => ({
          ...item,
          texturePath: normalizeStaticTexturePath(item.texturePath),
        })),
      };
    }

    if ('variants' in manifest) {
      return {
        kind: expectedKind,
        label: getStaticManifestLabel(expectedKind),
        items: manifest.variants.map((item) => ({
          ...item,
          texturePath: normalizeStaticTexturePath(item.texturePath),
        })),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function loadCosmeticCatalog(
  registry: Record<string, RegistryEntry>,
  onProgress?: () => void,
): Promise<CatalogItem[]> {
  const items: CatalogItem[] = [];
  const petIds = Object.keys(registry);

  await Promise.all([
    ...petIds.map(async (petId) => {
      try {
        const response = await fetch(assetUrl(`/assets/pet_data/${petId}.json`));
        if (!response.ok) return;

        const data = (await response.json()) as PetRecord;
        const parentName = data.name ?? registry[petId]?.name ?? petId;
        for (const variant of data.variants ?? []) {
          items.push(
            createCatalogItem('petSkin', petId, parentName, {
              ...variant,
              category: data.category ?? registry[petId]?.category ?? 'Pet Skin',
              description: `${stripMinecraftFormatting(parentName)} skin`,
              previewMode: getDefaultPreviewMode('petSkin'),
              viewerSupport: 'petViewer',
              infoUrls: data.infoUrls ?? [],
              viewIn3D: { petId, skinId: variant.id },
            }),
          );
        }
      } catch {
        return;
      } finally {
        onProgress?.();
      }
    }),
    ...STATIC_MANIFESTS.map(async ({ kind, path }) => {
      try {
        const manifest = await loadStaticManifest(path, kind);
        if (!manifest) return;

        for (const item of manifest.items) {
          items.push(
            createCatalogItem(kind, item.parentId ?? manifest.kind, getStaticParentName(kind, manifest, item), {
              ...item,
              category: item.category ?? manifest.label,
              previewMode: item.previewMode ?? getDefaultPreviewMode(kind),
              viewerSupport: item.viewerSupport ?? 'none',
            }),
          );
        }
      } finally {
        onProgress?.();
      }
    }),
  ]);

  return [...items].sort(
    (a, b) =>
      a.typeLabel.localeCompare(b.typeLabel) ||
      a.parentNamePlain.localeCompare(b.parentNamePlain) ||
      a.itemNamePlain.localeCompare(b.itemNamePlain),
  );
}
