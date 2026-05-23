import type { PoiCategory } from '../types/index.js';

export interface PoiCategoryMeta {
  label: string;
  /** Single emoji used for marker glyph on web + mobile. */
  icon: string;
  /** CSS / RN colour for the pin background. */
  color: string;
  /** Whether the layer is on by default the first time the user opens the map. */
  defaultOn: boolean;
}

export const POI_CATEGORY_META: Record<PoiCategory, PoiCategoryMeta> = {
  AED: { label: 'Defibrillator', icon: '⚡', color: '#dc2626', defaultOn: false },
  AREA: { label: 'Area label', icon: '🅰️', color: '#94a3b8', defaultOn: false },
  ATM: { label: 'ATM', icon: '💷', color: '#0ea5e9', defaultOn: true },
  BAR: { label: 'Bar', icon: '🍺', color: '#f97316', defaultOn: false },
  BUS_STOP: { label: 'Bus stop', icon: '🚌', color: '#6366f1', defaultOn: false },
  CAMPING: { label: 'Camping', icon: '⛺', color: '#84cc16', defaultOn: false },
  CAMPING_SHOP: { label: 'Camping shop', icon: '🛒', color: '#84cc16', defaultOn: false },
  CAMPSITE_STEWARDS: { label: 'Stewards', icon: '🦺', color: '#eab308', defaultOn: false },
  CHARITY_PARTNER: { label: 'Charity', icon: '❤️', color: '#ec4899', defaultOn: false },
  DEAF_ZONE: { label: 'Deaf Zone', icon: '🤟', color: '#a855f7', defaultOn: false },
  FOOD: { label: 'Food', icon: '🍔', color: '#f59e0b', defaultOn: true },
  INDUCTION_LOOP_SYSTEM: {
    label: 'Induction loop',
    icon: '👂',
    color: '#a855f7',
    defaultOn: false,
  },
  INFORMATION_POINT: { label: 'Info point', icon: 'ℹ️', color: '#0284c7', defaultOn: true },
  LANDMARK: { label: 'Landmark', icon: '📍', color: '#64748b', defaultOn: false },
  LOST_PROPERTY: { label: 'Lost property', icon: '🎒', color: '#64748b', defaultOn: false },
  MARKET_CLUSTER_LABEL: { label: 'Market', icon: '🛍️', color: '#f59e0b', defaultOn: false },
  MEDICAL_CENTRE: { label: 'Medical', icon: '➕', color: '#dc2626', defaultOn: true },
  OFFICIAL_MERCHANDISE: { label: 'Merch', icon: '👕', color: '#ec4899', defaultOn: false },
  PARKING: { label: 'Parking', icon: '🅿️', color: '#475569', defaultOn: false },
  PHARMACY: { label: 'Pharmacy', icon: '💊', color: '#dc2626', defaultOn: true },
  PROPERTY_LOCKUP: { label: 'Lockup', icon: '🔒', color: '#475569', defaultOn: false },
  SENSORY_CALM_SPACE: { label: 'Calm space', icon: '🧘', color: '#a855f7', defaultOn: false },
  SHOP: { label: 'Shop', icon: '🏪', color: '#f59e0b', defaultOn: false },
  SITE_ENTRANCES_AND_EXITS: { label: 'Entrance', icon: '🚪', color: '#475569', defaultOn: false },
  STAGE: { label: 'Stage', icon: '🎤', color: '#f59e0b', defaultOn: false },
  TOILET: { label: 'Toilets', icon: '🚻', color: '#10b981', defaultOn: true },
  VIEWING_PLATFORM: { label: 'Viewing platform', icon: '👁️', color: '#a855f7', defaultOn: false },
  VODAFONE_CONNECT_AND_CHARGE: {
    label: 'Charge point',
    icon: '🔌',
    color: '#dc2626',
    defaultOn: false,
  },
  VODAFONE_CONNECT_AND_CHARGE_SATELLITE: {
    label: 'Charge point',
    icon: '🔌',
    color: '#dc2626',
    defaultOn: false,
  },
  WATER: { label: 'Water tap', icon: '💧', color: '#0ea5e9', defaultOn: true },
  WELFARE: { label: 'Welfare', icon: '🤝', color: '#ec4899', defaultOn: true },
  WHEELCHAIR_ACCESSIBLE_TOILET: {
    label: 'Accessible WC',
    icon: '♿',
    color: '#10b981',
    defaultOn: false,
  },
  WORTHY_REST: { label: 'Worthy Rest', icon: '🛌', color: '#a855f7', defaultOn: false },
};

export const POI_CATEGORY_ORDER: PoiCategory[] = [
  'TOILET',
  'WHEELCHAIR_ACCESSIBLE_TOILET',
  'WATER',
  'FOOD',
  'BAR',
  'MEDICAL_CENTRE',
  'PHARMACY',
  'AED',
  'WELFARE',
  'INFORMATION_POINT',
  'ATM',
  'STAGE',
  'AREA',
  'LANDMARK',
  'VIEWING_PLATFORM',
  'SENSORY_CALM_SPACE',
  'DEAF_ZONE',
  'INDUCTION_LOOP_SYSTEM',
  'CAMPING',
  'CAMPING_SHOP',
  'CAMPSITE_STEWARDS',
  'PARKING',
  'BUS_STOP',
  'SITE_ENTRANCES_AND_EXITS',
  'OFFICIAL_MERCHANDISE',
  'SHOP',
  'CHARITY_PARTNER',
  'MARKET_CLUSTER_LABEL',
  'LOST_PROPERTY',
  'PROPERTY_LOCKUP',
  'VODAFONE_CONNECT_AND_CHARGE',
  'VODAFONE_CONNECT_AND_CHARGE_SATELLITE',
  'WORTHY_REST',
];
