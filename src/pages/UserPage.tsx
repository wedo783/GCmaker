import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthSettings } from '../context/AuthSettingsContext';
import { useCard } from '../context/CardContext';
import PreviewContainer from '../components/User/PreviewContainer';
import { Download, Share2, AlertCircle, Loader2, Globe } from 'lucide-react';
import { renderCardToCanvas } from '../utils/renderCardToCanvas';
import type { TemplateConfig } from '../types';

const i18n = {
    en: {
        customize: 'Customize Your Card',
        download: 'Download Image',
        share: 'Share / Save Image',
        whatsAppWeb: 'Share via WhatsApp Web',
        generating: 'Generating…',
        noTemplate: 'Card Not Found',
        noTemplateDesc: 'This card link is invalid or no template has been published yet.',
        openAdmin: 'Open Admin Panel →',
        loading: 'Loading card…',
    },
    ar: {
        customize: 'خصص بطاقتك',
        download: 'تحميل الصورة',
        share: 'مشاركة / حفظ الصورة',
        whatsAppWeb: 'مشاركة عبر واتسآب',
        generating: 'جاري الإنشاء…',
        noTemplate: 'البطاقة غير موجودة',
        noTemplateDesc: 'رابط البطاقة غير صالح أو لم يتم نشر أي قالب بعد.',
        openAdmin: '← فتح لوحة التحكم',
        loading: 'جاري تحميل البطاقة…',
    },
};

const UserPage: React.FC = () => {
    const { slug } = useParams<{ slug?: string }>();
    const { publishedTemplate, language, toggleLanguage } = useCard();
    const [inputs, setInputs] = useState<Record<string, string>>({});
    const [downloading, setDownloading] = useState(false);
    const [activeTemplate, setActiveTemplate] = useState<TemplateConfig | null>(null);
    const [occasions, setOccasions] = useState<TemplateConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const { settings } = useAuthSettings();
    const t = i18n[language];

    useEffect(() => {
        const fetchOccasions = async () => {
            try {
                // Fetch all cards and only show active ones
                const snap = await getDocs(collection(db, 'cards'));
                const fetched = snap.docs.map(d => d.data() as TemplateConfig)
                    .filter(c => c.isActive !== false) // Treat missing isActive as true
                    .sort((a, b) => a.slug.localeCompare(b.slug));
                setOccasions(fetched);

                // If there's no slug in the URL, pick the first active occasion if exists
                if (!slug && fetched.length > 0 && !publishedTemplate) {
                    window.history.replaceState(null, '', `/${fetched[0].slug}`);
                    setActiveTemplate(fetched[0]);
                }
            } catch (err) {
                console.error("Failed to load occasions.", err);
            }
        };
        fetchOccasions();
    }, []);

    // Load template: from Firestore if slug present, else from local context
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            if (slug) {
                try {
                    const snap = await getDoc(doc(db, 'cards', slug));
                    if (snap.exists()) {
                        setActiveTemplate(snap.data() as TemplateConfig);
                    } else {
                        setActiveTemplate(null);
                    }
                } catch (err) {
                    console.error('Failed to load card:', err);
                    setActiveTemplate(null);
                }
            } else {
                // No slug — fall back to locally published template (admin preview)
                setActiveTemplate(publishedTemplate);
            }
            setLoading(false);
        };
        load();
    }, [slug, publishedTemplate]);

    const handleSwitchLanguage = () => {
        toggleLanguage();
        if (activeTemplate) {
            // Flip the card language as well so the renderer updates
            const newLang = language === 'en' ? 'ar' : 'en';
            setActiveTemplate({
                ...activeTemplate,
                cardLanguage: newLang,
            });
        }
    };

    const handleInputChange = useCallback((id: string, value: string) => {
        setInputs((prev) => ({ ...prev, [id]: value }));
    }, []);

    const generateImage = async (): Promise<string | null> => {
        if (!activeTemplate) return null;
        // Use Canvas 2D API — works reliably on both desktop and mobile
        return await renderCardToCanvas(activeTemplate, inputs, 2, 0.85);
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const dataUrl = await generateImage();
            if (dataUrl) {
                const link = document.createElement('a');
                link.download = `${slug || 'greeting-card'}.jpg`;
                link.href = dataUrl;
                link.click();
            }
        } catch (err: any) {
            console.error('Export error:', err);
            alert(`Export failed: ${err?.message || err}. Please try again.`);
        } finally {
            setDownloading(false);
        }
    };

    const handleShare = async () => {
        setDownloading(true);
        try {
            const dataUrl = await generateImage();
            if (!dataUrl) return;

            // Mobile Native Share (Save to Gallery / Share to App)
            if (navigator.canShare && navigator.share) {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                const file = new File([blob], `${slug || 'card'}.jpg`, { type: 'image/jpeg' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: 'My Greeting Card',
                        text: 'Check out my personalized card!',
                    });
                    return;
                }
            }

            // Fallback for Desktop: Open WhatsApp Web
            const text = encodeURIComponent('Check out my Greeting Card!');
            window.open(`https://wa.me/?text=${text}`, '_blank');
        } catch (e) {
            console.error('Share failed', e);
            // Fallback to download if share fails entirely
            handleDownload();
        } finally {
            setDownloading(false);
        }
    };

    // --- Loading state ---
    if (loading) {
        return (
            <div className="no-template">
                <Loader2 size={42} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
                <h2>{t.loading}</h2>
            </div>
        );
    }

    // --- No template found ---
    if (!activeTemplate) {
        return (
            <div className="no-template">
                <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} />
                <h2>{t.noTemplate}</h2>
                <p>{t.noTemplateDesc}</p>
                <a href="/admin">{t.openAdmin}</a>
            </div>
        );
    }

    return (
        <div className="user-shell">
            {/* ── Header ── */}
            <header className="user-header">
                <div className="user-header-inner">
                    {/* Logo — Left side */}
                    <div className="user-header-logo">
                        <div className="user-header-logo-icon">GC</div>
                        <span className="user-header-logo-text">
                            {language === 'en' ? settings.appNameEn : settings.appNameAr}
                        </span>
                    </div>

                    {/* Right side — header banner + language toggle */}
                    <div className="user-header-right">
                        {activeTemplate.headerUrl && (
                            <img
                                src={activeTemplate.headerUrl}
                                alt="Header"
                                className="user-header-banner"
                            />
                        )}
                        <button
                            className="lang-toggle-btn"
                            onClick={handleSwitchLanguage}
                            title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '6px 14px',
                                borderRadius: 20,
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Globe size={15} />
                            <span>{language === 'en' ? 'عربي' : 'EN'}</span>
                        </button>
                    </div>
                </div>

                {/* Navbar for active Occasions */}
                {occasions.length > 0 && (
                    <div className="user-occasions-nav" style={{
                        gap: 12, padding: '12px 20px',
                        overflowX: 'auto', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        justifyContent: 'center',
                        display: 'flex'
                    }}>
                        {occasions.map(occ => (
                            <a
                                key={occ.slug}
                                href={`/${occ.slug}`}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 99,
                                    whiteSpace: 'nowrap',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s',
                                    color: (activeTemplate?.slug === occ.slug) ? '#fff' : 'var(--text-secondary)',
                                    background: (activeTemplate?.slug === occ.slug) ? 'var(--accent)' : 'rgba(255,255,255,0.05)'
                                }}
                            >
                                {occ.slug.replace(/-/g, ' ')}
                            </a>
                        ))}
                    </div>
                )}
            </header>

            {/* Main Grid */}
            <div className="user-grid">
                {/* ── Form Card ── */}
                <div className="user-form-card">
                    <h1 className="user-form-title">{t.customize}</h1>

                    <div className="user-form-fields">
                        {activeTemplate.layers.map((layer) => {
                            // Use the card's configured language for field labels + placeholders
                            const cardLang = activeTemplate.cardLanguage ?? 'en';
                            const cfg = layer[cardLang] ?? layer.en;
                            return (
                                <div key={layer.id}>
                                    <label className="user-field-label" dir={cardLang === 'ar' ? 'rtl' : 'ltr'}>
                                        {cfg.label}
                                    </label>
                                    <input
                                        type="text"
                                        className="user-field-input"
                                        value={inputs[layer.id] || ''}
                                        onChange={(e) => handleInputChange(layer.id, e.target.value)}
                                        placeholder={cfg.defaultText}
                                        dir={cardLang === 'ar' ? 'rtl' : 'ltr'}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    <div className="user-actions">
                        <button
                            className="user-btn-download"
                            onClick={handleDownload}
                            disabled={downloading}
                        >
                            <Download size={20} />
                            {downloading ? t.generating : t.download}
                        </button>
                        <button
                            className="user-btn-whatsapp"
                            onClick={handleShare}
                            disabled={downloading}
                        >
                            <Share2 size={20} />
                            {downloading ? t.generating : t.share}
                        </button>
                    </div>
                </div>

                {/* ── Preview Card ── */}
                <div className="user-preview-card">
                    <div className="user-preview-bg" />
                    <div className="user-preview-grid" />
                    <div className="user-preview-inner">
                        <PreviewContainer template={activeTemplate} inputs={inputs} />
                    </div>
                </div>
            </div>

            {/* Export is now handled via Canvas 2D API — no hidden DOM element needed */}
        </div>
    );
};

export default UserPage;
