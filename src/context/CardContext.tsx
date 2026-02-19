import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_TEMPLATE, FONTS_EN, FONTS_AR } from '../types';
import type { TemplateConfig, TextLayer } from '../types';

/** Convert any string to a URL-safe slug */
export function toSlug(s: string): string {
    return s
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u0600-\u06ff-]/g, '')
        .replace(/-+/g, '-')
        .slice(0, 60) || 'my-card';
}

/** 
 * Automatically migrate old templates to new schema 
 * (Adds `en` and `ar` config objects to layers if missing)
 */
function migrateTemplate(t: any): TemplateConfig {
    if (!t || !t.layers) return DEFAULT_TEMPLATE;

    // Ensure layers have the new structure
    const migratedLayers = t.layers.map((l: any) => {
        if (l.en && l.ar) return l as TextLayer; // already migrated

        // Create default EN/AR configs from old flat properties
        return {
            ...l,
            en: {
                label: l.label || 'Text',
                defaultText: l.defaultText || 'Text',
                fontFamily: l.fontFamily || FONTS_EN[0].value,
                fontWeight: l.fontWeight || 400,
                fontSize: l.fontSize || 48,
                align: l.align || 'center',
            },
            ar: {
                label: l.labelAr || 'نص',
                defaultText: l.defaultText || 'نص',
                fontFamily: FONTS_AR[0].value,
                fontWeight: l.fontWeight || 400,
                fontSize: l.fontSize || 48,
                align: l.align || 'center',
            }
        } as TextLayer;
    });

    return { ...t, layers: migratedLayers } as TemplateConfig;
}

interface CardContextType {
    template: TemplateConfig;
    setTemplate: (template: TemplateConfig) => void;
    publishedTemplate: TemplateConfig | null;
    publishTemplate: () => Promise<void>;
    publishing: boolean;
    publishError: string | null;
    shareUrl: string | null;
    language: 'en' | 'ar';
    toggleLanguage: () => void;
    updateLayer: (layerId: string, updates: Partial<TemplateConfig['layers'][0]>) => void;
}

const CardContext = createContext<CardContextType | undefined>(undefined);

export const CardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Language
    const [language, setLanguage] = useState<'en' | 'ar'>(() => {
        const saved = localStorage.getItem('greeting-card-lang');
        return (saved as 'en' | 'ar') || 'en';
    });

    useEffect(() => {
        localStorage.setItem('greeting-card-lang', language);
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));

    // Template Draft (localStorage)
    const [template, setTemplate] = useState<TemplateConfig>(() => {
        try {
            const saved = localStorage.getItem('greeting-card-draft');
            return saved ? migrateTemplate(JSON.parse(saved)) : DEFAULT_TEMPLATE;
        } catch (e) {
            console.error('Failed to parse draft template, resetting to default', e);
            return DEFAULT_TEMPLATE;
        }
    });

    useEffect(() => {
        localStorage.setItem('greeting-card-draft', JSON.stringify(template));
    }, [template]);

    // Published template (from localStorage cache)
    const [publishedTemplate, setPublishedTemplate] = useState<TemplateConfig | null>(() => {
        try {
            const saved = localStorage.getItem('greeting-card-published');
            return saved ? migrateTemplate(JSON.parse(saved)) : null;
        } catch (e) {
            return null;
        }
    });

    // Share URL
    const [shareUrl, setShareUrl] = useState<string | null>(() => {
        return localStorage.getItem('greeting-card-share-url') || null;
    });

    const [publishing, setPublishing] = useState(false);
    const [publishError, setPublishError] = useState<string | null>(null);

    const publishTemplate = async () => {
        setPublishing(true);
        setPublishError(null);
        try {
            const slug = toSlug(template.slug || template.id);
            const toPublish: TemplateConfig = {
                ...template,
                slug,
                isPublished: true,
                lastPublishedAt: new Date().toISOString(),
            };

            // Save to Firestore under cards/{slug}
            await setDoc(doc(db, 'cards', slug), toPublish);

            // Cache locally
            setPublishedTemplate(toPublish);
            localStorage.setItem('greeting-card-published', JSON.stringify(toPublish));

            // Build clean short URL  →  domain/slug
            const url = `${window.location.origin}/${slug}`;
            setShareUrl(url);
            localStorage.setItem('greeting-card-share-url', url);
        } catch (err) {
            console.error('Publish failed:', err);
            setPublishError('Failed to publish. Check Firestore permissions.');
        } finally {
            setPublishing(false);
        }
    };

    const updateLayer = (layerId: string, updates: Partial<TemplateConfig['layers'][0]>) => {
        setTemplate((prev) => ({
            ...prev,
            layers: prev.layers.map((layer) =>
                layer.id === layerId ? { ...layer, ...updates } : layer
            ),
        }));
    };

    return (
        <CardContext.Provider
            value={{
                template,
                setTemplate,
                publishedTemplate,
                publishTemplate,
                publishing,
                publishError,
                shareUrl,
                language,
                toggleLanguage,
                updateLayer,
            }}
        >
            {children}
        </CardContext.Provider>
    );
};

export const useCard = () => {
    const context = useContext(CardContext);
    if (!context) throw new Error('useCard must be used within a CardProvider');
    return context;
};
