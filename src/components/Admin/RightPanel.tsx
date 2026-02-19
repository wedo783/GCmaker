import React from 'react';
import type { TextLayer, TemplateConfig, LayerLangConfig } from '../../types';
import { FONTS_EN, FONTS_AR, FONT_WEIGHTS } from '../../types';
import { Trash2, Plus, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

interface RightPanelProps {
    template: TemplateConfig;
    setTemplate: (t: TemplateConfig) => void;
    selectedLayerId: string | null;
    setSelectedLayerId: (id: string | null) => void;
    language: 'en' | 'ar';
}

const i18n = {
    en: {
        layers: 'Layers',
        noLayers: 'No layers yet. Click Add.',
        properties: 'Properties',
        langNote: 'English Settings',
        label: 'Field Label',
        defaultText: 'Default Text',
        fontSize: 'Font Size',
        font: 'Font',
        fontWeight: 'Font Weight',
        color: 'Color',
        alignment: 'Alignment',
        opacity: 'Opacity',
        shadow: 'Text Shadow',
        selectLayer: 'Select a layer to edit its properties',
        sharedProps: 'Shared (Both Languages)',
    },
    ar: {
        layers: 'الطبقات',
        noLayers: 'لا توجد طبقات. انقر إضافة.',
        properties: 'الخصائص',
        langNote: 'الإعدادات العربية',
        label: 'تسمية الحقل',
        defaultText: 'النص الافتراضي',
        fontSize: 'حجم الخط',
        font: 'الخط',
        fontWeight: 'ثخانة الخط',
        color: 'اللون',
        alignment: 'المحاذاة',
        opacity: 'الشفافية',
        shadow: 'ظل النص',
        selectLayer: 'اختر طبقة لتعديل خصائصها',
        sharedProps: 'مشترك (كلا اللغتين)',
    },
};

const RightPanel: React.FC<RightPanelProps> = ({
    template, setTemplate, selectedLayerId, setSelectedLayerId, language,
}) => {
    const t = i18n[language];
    const lang = template.cardLanguage ?? 'en';
    const selectedLayer = template.layers.find((l) => l.id === selectedLayerId);
    const fontOptions = lang === 'ar' ? FONTS_AR : FONTS_EN;

    /** Update only the per-language config for the selected layer */
    const updateLangConfig = (updates: Partial<LayerLangConfig>) => {
        if (!selectedLayerId) return;
        setTemplate({
            ...template,
            layers: template.layers.map((l) =>
                l.id === selectedLayerId
                    ? { ...l, [lang]: { ...l[lang], ...updates } }
                    : l
            ),
        });
    };

    /** Update shared (language-independent) properties */
    const updateShared = (updates: Partial<TextLayer>) => {
        if (!selectedLayerId) return;
        setTemplate({
            ...template,
            layers: template.layers.map((l) =>
                l.id === selectedLayerId ? { ...l, ...updates } : l
            ),
        });
    };

    const getCenterX = () => {
        const { width, height } = template.dimensions;
        const canvasW = template.orientation === 'landscape'
            ? Math.max(width, height) : Math.min(width, height);
        return Math.round(canvasW / 2) - 60;
    };
    const getCenterY = () => {
        const { width, height } = template.dimensions;
        const canvasH = template.orientation === 'landscape'
            ? Math.min(width, height) : Math.max(width, height);
        return Math.round(canvasH / 2) - 16;
    };

    const handleAddLayer = () => {
        const newLayer: TextLayer = {
            id: `layer-${Date.now()}`,
            x: getCenterX(),
            y: getCenterY(),
            color: '#ffffff',
            opacity: 1,
            shadow: false,
            shadowBlur: 0,
            en: {
                label: 'New Text',
                defaultText: 'New Text',
                fontFamily: FONTS_EN[0].value,
                fontWeight: 400,
                fontSize: 48,
                align: 'center',
            },
            ar: {
                label: 'نص جديد',
                defaultText: 'نص جديد',
                fontFamily: FONTS_AR[0].value,
                fontWeight: 400,
                fontSize: 48,
                align: 'center',
            },
        };
        setTemplate({ ...template, layers: [...template.layers, newLayer] });
        setSelectedLayerId(newLayer.id);
    };

    const handleDeleteLayer = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setTemplate({ ...template, layers: template.layers.filter((l) => l.id !== id) });
        if (selectedLayerId === id) setSelectedLayerId(null);
    };

    return (
        <>
            {/* ── Layer list ── */}
            <div className="sidebar-section">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div className="sidebar-label" style={{ marginBottom: 0 }}>{t.layers}</div>
                    <button
                        className="btn btn-primary"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={handleAddLayer}
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
                <div className="layer-list">
                    {template.layers.length === 0 && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                            {t.noLayers}
                        </p>
                    )}
                    {template.layers.map((layer) => (
                        <div
                            key={layer.id}
                            className={`layer-item${selectedLayerId === layer.id ? ' active' : ''}`}
                            onClick={() => setSelectedLayerId(layer.id)}
                        >
                            <span className="layer-item-name">
                                {/* Show layer label in the current card language */}
                                {layer[lang]?.label || layer.en.label}
                            </span>
                            <button
                                className="layer-delete-btn"
                                onClick={(e) => handleDeleteLayer(layer.id, e)}
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Layer properties ── */}
            {selectedLayer ? (
                <div className="sidebar-section" style={{ flex: 1, overflowY: 'auto' }}>
                    <div className="sidebar-label">{t.properties}</div>

                    {/* Language badge */}
                    <div className="lang-settings-badge">
                        {lang === 'ar' ? '🇸🇦' : '🇺🇸'} {t.langNote}
                    </div>

                    {/* ── Per-language settings ── */}
                    <div className="form-group">
                        <label className="form-label">{t.label}</label>
                        <input
                            type="text"
                            className="form-input"
                            value={selectedLayer[lang]?.label || ''}
                            onChange={(e) => updateLangConfig({ label: e.target.value })}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                            placeholder={lang === 'ar' ? 'مثال: الاسم' : 'e.g. Name'}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t.defaultText}</label>
                        <textarea
                            className="form-textarea"
                            value={selectedLayer[lang]?.defaultText || ''}
                            onChange={(e) => updateLangConfig({ defaultText: e.target.value })}
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        />
                    </div>

                    {/* Font */}
                    <div className="form-group">
                        <label className="form-label">{t.font}</label>
                        <select
                            className="form-select"
                            value={selectedLayer[lang]?.fontFamily || fontOptions[0].value}
                            onChange={(e) => updateLangConfig({ fontFamily: e.target.value })}
                            style={{ fontFamily: selectedLayer[lang]?.fontFamily }}
                        >
                            {fontOptions.map((f) => (
                                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Font weight */}
                    <div className="form-group">
                        <label className="form-label">{t.fontWeight}</label>
                        <select
                            className="form-select"
                            value={selectedLayer[lang]?.fontWeight ?? 400}
                            onChange={(e) => updateLangConfig({ fontWeight: Number(e.target.value) })}
                        >
                            {FONT_WEIGHTS.map((w) => (
                                <option key={w.value} value={w.value}>{w.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Font size */}
                    <div className="form-group">
                        <label className="form-label">{t.fontSize}</label>
                        <input
                            type="number"
                            className="form-input"
                            value={selectedLayer[lang]?.fontSize ?? 48}
                            min={8}
                            max={500}
                            onChange={(e) => updateLangConfig({ fontSize: Number(e.target.value) })}
                        />
                    </div>

                    {/* Alignment */}
                    <div className="form-group">
                        <label className="form-label">{t.alignment}</label>
                        <div className="align-group">
                            {(['left', 'center', 'right'] as const).map((align) => (
                                <button
                                    key={align}
                                    className={`align-btn${selectedLayer[lang]?.align === align ? ' active' : ''}`}
                                    onClick={() => updateLangConfig({ align })}
                                >
                                    {align === 'left' && <AlignLeft size={15} />}
                                    {align === 'center' && <AlignCenter size={15} />}
                                    {align === 'right' && <AlignRight size={15} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Shared settings ── */}
                    <div className="lang-settings-badge lang-settings-badge--shared">
                        🔗 {t.sharedProps}
                    </div>

                    {/* Color */}
                    <div className="form-group">
                        <label className="form-label">{t.color}</label>
                        <div className="color-row">
                            <input
                                type="color"
                                className="color-swatch"
                                value={selectedLayer.color}
                                onChange={(e) => updateShared({ color: e.target.value })}
                            />
                            <span className="color-hex">{selectedLayer.color}</span>
                        </div>
                    </div>

                    {/* Opacity */}
                    <div className="form-group">
                        <label className="form-label">
                            {t.opacity}
                            <span style={{ float: 'right', color: 'var(--accent-light)', fontFamily: 'monospace' }}>
                                {Math.round(selectedLayer.opacity * 100)}%
                            </span>
                        </label>
                        <div className="range-row">
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={selectedLayer.opacity}
                                onChange={(e) => updateShared({ opacity: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Shadow */}
                    <div className="checkbox-row">
                        <input
                            type="checkbox"
                            id="shadow-toggle"
                            checked={selectedLayer.shadow}
                            onChange={(e) => updateShared({ shadow: e.target.checked })}
                        />
                        <label htmlFor="shadow-toggle">{t.shadow}</label>
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                    </svg>
                    <p>{t.selectLayer}</p>
                </div>
            )}
        </>
    );
};

export default RightPanel;
