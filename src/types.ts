export type Orientation = 'portrait' | 'landscape';
export type Alignment = 'left' | 'center' | 'right';
export type Language = 'en' | 'ar';

// ─── Per-language layer config ──────────────────────────────────────────────
export interface LayerLangConfig {
  label: string;       // field label shown to end user (e.g. "Name" / "الاسم")
  defaultText: string; // placeholder shown on canvas
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  align: Alignment;
}

// ─── Text Layer ──────────────────────────────────────────────────────────────
export interface TextLayer {
  id: string;
  x: number;
  y: number;
  color: string;     // shared across both languages
  opacity: number;
  shadow: boolean;
  shadowBlur: number;
  en: LayerLangConfig;  // English-specific settings
  ar: LayerLangConfig;  // Arabic-specific settings
}

export interface PosterDimensions {
  width: number;
  height: number;
  dpi: number;
  label: string;
}

export interface TemplateConfig {
  id: string;
  slug: string;
  cardLanguage: 'en' | 'ar';
  backgroundUrl: string | null;
  headerUrl: string | null;     // admin-uploadable header banner for the user page
  dimensions: PosterDimensions;
  orientation: Orientation;
  layers: TextLayer[];
  isPublished: boolean;
  isActive: boolean; // Controls whether this card shows up in the user page nav bar
  lastPublishedAt: string | null;
}

// ─── Font options ─────────────────────────────────────────────────────────────
export const FONTS_EN: { label: string; value: string }[] = [
  { label: 'Karbon (Default)', value: 'Karbon, Inter, sans-serif' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Playfair Display', value: '"Playfair Display", serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
];

export const FONTS_AR: { label: string; value: string }[] = [
  { label: 'Luma (الافتراضي)', value: 'Luma, serif' },
  { label: 'Amiri', value: 'Amiri, serif' },
  { label: 'Cairo', value: 'Cairo, sans-serif' },
  { label: 'Tajawal', value: 'Tajawal, sans-serif' },
  { label: 'Noto Sans Arabic', value: '"Noto Sans Arabic", sans-serif' },
];

export const FONT_WEIGHTS = [
  { label: 'Thin (100)', value: 100 },
  { label: 'Light (300)', value: 300 },
  { label: 'Regular (400)', value: 400 },
  { label: 'Medium (500)', value: 500 },
  { label: 'Semi-Bold (600)', value: 600 },
  { label: 'Bold (700)', value: 700 },
  { label: 'Heavy (800)', value: 800 },
];

// ─── Default template ─────────────────────────────────────────────────────────
export const DEFAULT_TEMPLATE: TemplateConfig = {
  id: 'default',
  slug: 'my-card',
  cardLanguage: 'en',
  backgroundUrl: null,
  headerUrl: null,
  dimensions: { width: 1080, height: 1080, dpi: 72, label: 'Instagram Post' },
  orientation: 'portrait',
  layers: [
    {
      id: 'layer-name',
      x: 440, y: 480,
      color: '#000000',
      opacity: 1,
      shadow: false,
      shadowBlur: 0,
      en: { label: 'Name', defaultText: 'Your Name', fontFamily: 'Karbon, Inter, sans-serif', fontWeight: 700, fontSize: 48, align: 'center' },
      ar: { label: 'الاسم', defaultText: 'اسمك', fontFamily: 'Luma, serif', fontWeight: 700, fontSize: 48, align: 'center' },
    },
    {
      id: 'layer-job',
      x: 450, y: 560,
      color: '#333333',
      opacity: 1,
      shadow: false,
      shadowBlur: 0,
      en: { label: 'Job Title', defaultText: 'Job Title', fontFamily: 'Karbon, Inter, sans-serif', fontWeight: 400, fontSize: 32, align: 'center' },
      ar: { label: 'المسمى الوظيفي', defaultText: 'المسمى الوظيفي', fontFamily: 'Luma, serif', fontWeight: 400, fontSize: 32, align: 'center' },
    },
  ],
  isPublished: false,
  isActive: true,
  lastPublishedAt: null,
};

export const PRESET_DIMENSIONS: PosterDimensions[] = [
  { label: 'Instagram Post', width: 1080, height: 1080, dpi: 72 },
  { label: 'LinkedIn Post', width: 1200, height: 627, dpi: 72 },
  { label: 'TV / 16:9', width: 1920, height: 1080, dpi: 72 },
  { label: 'Story', width: 1080, height: 1920, dpi: 72 },
];
