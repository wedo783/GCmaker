import React, { useRef, useState } from 'react';
import { PRESET_DIMENSIONS } from '../../types';
import type { TemplateConfig } from '../../types';

interface LeftPanelProps {
    template: TemplateConfig;
    setTemplate: (t: TemplateConfig) => void;
}

const CUSTOM_LABEL = 'Custom';

const LeftPanel: React.FC<LeftPanelProps> = ({ template, setTemplate }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isCustom = template.dimensions.label === CUSTOM_LABEL;
    const [customW, setCustomW] = useState(String(isCustom ? template.dimensions.width : 1080));
    const [customH, setCustomH] = useState(String(isCustom ? template.dimensions.height : 1080));

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                if (ev.target?.result) {
                    setTemplate({ ...template, backgroundUrl: ev.target.result as string });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const applyCustomSize = (w: string, h: string) => {
        const width = Math.max(100, Math.min(8000, parseInt(w) || 1080));
        const height = Math.max(100, Math.min(8000, parseInt(h) || 1080));
        setCustomW(String(width));
        setCustomH(String(height));
        setTemplate({
            ...template,
            dimensions: { label: CUSTOM_LABEL, width, height, dpi: 72 },
        });
    };

    const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, w: string, h: string) => {
        if (e.key === 'Enter') applyCustomSize(w, h);
    };

    /** Switch card language — canvas + property panel both switch instantly */
    const handleCardLanguageChange = (lang: 'en' | 'ar') => {
        setTemplate({ ...template, cardLanguage: lang });
    };

    return (
        <>
            {/* ── Card Language ── */}
            <div className="sidebar-section">
                <div className="sidebar-label">Card Language</div>
                <div className="toggle-group">
                    <button
                        className={`toggle-btn${(template.cardLanguage ?? 'en') === 'en' ? ' active' : ''}`}
                        onClick={() => handleCardLanguageChange('en')}
                    >
                        🇺🇸 English
                    </button>
                    <button
                        className={`toggle-btn${template.cardLanguage === 'ar' ? ' active' : ''}`}
                        onClick={() => handleCardLanguageChange('ar')}
                    >
                        🇸🇦 عربي
                    </button>
                </div>
            </div>

            {/* ── Background ── */}
            <div className="sidebar-section">
                <div className="sidebar-label">Background</div>
                <div
                    className="upload-zone"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {template.backgroundUrl ? (
                        <>
                            <img
                                src={template.backgroundUrl}
                                alt="Background preview"
                                className="upload-preview"
                            />
                            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>Click to change</div>
                        </>
                    ) : (
                        <>
                            <svg className="upload-zone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="upload-zone-text">Click to upload</div>
                            <div className="upload-zone-hint">PNG or JPG</div>
                        </>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/png,image/jpeg"
                        style={{ display: 'none' }}
                    />
                </div>
                {template.backgroundUrl && (
                    <button
                        className="btn btn-danger-ghost"
                        style={{ marginTop: 8, width: '100%' }}
                        onClick={(e) => { e.stopPropagation(); setTemplate({ ...template, backgroundUrl: null }); }}
                    >
                        Remove background
                    </button>
                )}
            </div>

            {/* ── Canvas Size ── */}
            <div className="sidebar-section">
                <div className="sidebar-label">Canvas Size</div>
                <div className="preset-list">
                    {PRESET_DIMENSIONS.map((preset) => (
                        <button
                            key={preset.label}
                            className={`preset-btn${template.dimensions.label === preset.label ? ' active' : ''}`}
                            onClick={() => setTemplate({ ...template, dimensions: preset })}
                        >
                            <span>{preset.label}</span>
                            <span className="preset-btn-size">{preset.width}×{preset.height}</span>
                        </button>
                    ))}

                    <button
                        className={`preset-btn${isCustom ? ' active' : ''}`}
                        onClick={() => applyCustomSize(customW, customH)}
                    >
                        <span>Custom</span>
                        <span className="preset-btn-size">
                            {isCustom ? `${template.dimensions.width}×${template.dimensions.height}` : 'W×H'}
                        </span>
                    </button>

                    {isCustom && (
                        <div className="custom-size-inputs">
                            <div className="custom-size-field">
                                <label className="custom-size-label">Width (px)</label>
                                <input
                                    type="number"
                                    className="custom-size-input"
                                    value={customW}
                                    min={100}
                                    max={8000}
                                    onChange={(e) => setCustomW(e.target.value)}
                                    onBlur={() => applyCustomSize(customW, customH)}
                                    onKeyDown={(e) => handleCustomKeyDown(e, customW, customH)}
                                />
                            </div>
                            <div className="custom-size-field">
                                <label className="custom-size-label">Height (px)</label>
                                <input
                                    type="number"
                                    className="custom-size-input"
                                    value={customH}
                                    min={100}
                                    max={8000}
                                    onChange={(e) => setCustomH(e.target.value)}
                                    onBlur={() => applyCustomSize(customW, customH)}
                                    onKeyDown={(e) => handleCustomKeyDown(e, customW, customH)}
                                />
                            </div>
                            <div className="custom-size-hint">Press Enter or click outside to apply</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Orientation ── */}
            <div className="sidebar-section">
                <div className="sidebar-label">Orientation</div>
                <div className="toggle-group">
                    <button
                        className={`toggle-btn${template.orientation === 'portrait' ? ' active' : ''}`}
                        onClick={() => setTemplate({ ...template, orientation: 'portrait' })}
                    >
                        Portrait
                    </button>
                    <button
                        className={`toggle-btn${template.orientation === 'landscape' ? ' active' : ''}`}
                        onClick={() => setTemplate({ ...template, orientation: 'landscape' })}
                    >
                        Landscape
                    </button>
                </div>
            </div>
        </>
    );
};

export default LeftPanel;
