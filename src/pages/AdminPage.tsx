import React, { useState, useEffect, useRef } from 'react';
import { useCard, toSlug } from '../context/CardContext';
import LeftPanel from '../components/Admin/LeftPanel';
import RightPanel from '../components/Admin/RightPanel';
import CanvasRenderer from '../components/Shared/CanvasRenderer';
import { Save, Eye, Globe, RotateCcw, Link2, Check, Loader2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DEFAULT_TEMPLATE } from '../types';

const i18n = {
    en: {
        cardBuilder: 'Card Builder',
        beta: 'BETA',
        preview: 'Preview',
        publish: 'Publish',
        publishing: 'Publishing…',
        published: '✓ Published!',
        reset: 'Reset',
        resetConfirm: 'Reset all layers and settings to default? This cannot be undone.',
        cardName: 'Card Name (URL slug)',
        cardNamePlaceholder: 'e.g. eid-2025',
        cardNameHint: 'This becomes the link: ',
    },
    ar: {
        cardBuilder: 'منشئ البطاقة',
        beta: 'تجريبي',
        preview: 'معاينة',
        publish: 'نشر',
        publishing: 'جاري النشر…',
        published: '✓ تم النشر!',
        reset: 'إعادة',
        resetConfirm: 'هل تريد إعادة ضبط جميع الطبقات والإعدادات إلى الافتراضي؟',
        cardName: 'اسم البطاقة (رابط)',
        cardNamePlaceholder: 'مثال: eid-2025',
        cardNameHint: 'سيصبح الرابط: ',
    },
};

const AdminPage: React.FC = () => {
    const { template, setTemplate, publishTemplate, publishedTemplate, publishing, publishError, shareUrl, language, toggleLanguage, updateLayer } = useCard();
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [scale, setScale] = useState(0.5);
    const [publishFlash, setPublishFlash] = useState(false);
    const [copied, setCopied] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { cardId } = useParams<{ cardId: string }>();
    const t = i18n[language];

    // Load explicitly from DB if opening an existing card
    useEffect(() => {
        const loadCard = async () => {
            if (cardId && cardId !== 'new') {
                try {
                    const snap = await getDoc(doc(db, 'cards', cardId));
                    if (snap.exists()) {
                        setTemplate(snap.data() as any);
                    }
                } catch (e) {
                    console.error("Error loading card:", e);
                }
            } else if (cardId === 'new') {
                setTemplate({ ...DEFAULT_TEMPLATE, id: `new-${Date.now()}`, slug: '' });
            }
        };
        // Only load if it's our first time mounting or cardId changes
        loadCard();
    }, [cardId]);

    // Preview slug as user types
    const previewSlug = toSlug(template.slug || template.id || 'my-card');
    const previewUrl = `${window.location.origin}/${previewSlug}`;

    const handleCopyLink = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    useEffect(() => {
        const calc = () => {
            if (!containerRef.current) return;
            const { clientWidth, clientHeight } = containerRef.current;
            const { dimensions, orientation } = template;
            const w = orientation === 'landscape'
                ? Math.max(dimensions.width, dimensions.height)
                : Math.min(dimensions.width, dimensions.height);
            const h = orientation === 'landscape'
                ? Math.min(dimensions.width, dimensions.height)
                : Math.max(dimensions.width, dimensions.height);
            const sx = (clientWidth - 80) / w;
            const sy = (clientHeight - 80) / h;
            setScale(Math.min(sx, sy, 1));
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, [template.dimensions, template.orientation]);

    const handlePublish = async () => {
        await publishTemplate();
        setPublishFlash(true);
        setTimeout(() => setPublishFlash(false), 2500);
    };

    const handleReset = () => {
        if (window.confirm(t.resetConfirm)) {
            // Revert to published version if editing existing
            if (publishedTemplate && cardId !== 'new') {
                setTemplate(publishedTemplate);
            } else {
                setTemplate({ ...DEFAULT_TEMPLATE, id: `default-${Date.now()}`, slug: '' });
            }
            setSelectedLayerId(null);
        }
    };

    return (
        <div className="admin-shell">
            {/* Top Bar */}
            <header className="admin-topbar">
                <div className="admin-topbar-brand">
                    <Link to="/admin" className="btn btn-ghost" style={{ padding: 6, marginRight: 10 }}>← Back</Link>
                    <div className="brand-icon">G</div>
                    <span className="brand-name">{t.cardBuilder}</span>
                    <span className="badge">{t.beta}</span>
                </div>

                <div className="admin-topbar-actions">
                    <button onClick={handleReset} className="btn btn-ghost" title={t.reset}>
                        <RotateCcw size={15} />
                        {t.reset}
                    </button>

                    <button onClick={toggleLanguage} className="btn btn-ghost">
                        <Globe size={16} />
                        {language === 'en' ? 'AR' : 'EN'}
                    </button>

                    <Link to={`/${previewSlug}`} target="_blank" className="btn btn-ghost">
                        <Eye size={16} />
                        {t.preview}
                    </Link>

                    <button
                        onClick={handlePublish}
                        disabled={publishing}
                        className={`btn ${publishFlash ? 'btn-success' : 'btn-primary'}`}
                        style={{ transition: 'all 0.3s ease', minWidth: 120 }}
                    >
                        {publishing
                            ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Save size={16} />}
                        {publishing ? t.publishing : publishFlash ? t.published : t.publish}
                    </button>
                </div>
            </header>

            {/* Card Name / Slug input bar */}
            <div className="admin-slug-bar">
                <label className="admin-slug-label">
                    {t.cardName}
                </label>
                <input
                    type="text"
                    className="admin-slug-input"
                    value={template.slug || ''}
                    onChange={(e) => setTemplate({ ...template, slug: e.target.value })}
                    placeholder={t.cardNamePlaceholder}
                    dir="ltr"
                />
                <span className="admin-slug-preview">
                    {t.cardNameHint}<strong>{previewUrl}</strong>
                </span>
            </div>

            {/* Error banner */}
            {publishError && (
                <div className="admin-error-banner">{publishError}</div>
            )}

            {/* Share URL Banner */}
            {shareUrl && !publishing && (
                <div className="admin-share-banner">
                    <Link2 size={15} style={{ flexShrink: 0 }} />
                    <span className="admin-share-label">
                        {language === 'en' ? 'Share link:' : 'رابط المشاركة:'}
                    </span>
                    <span className="admin-share-url">{shareUrl}</span>
                    <button
                        className={`btn ${copied ? 'btn-success' : 'btn-ghost'} admin-share-copy`}
                        onClick={handleCopyLink}
                    >
                        {copied ? <Check size={14} /> : <Link2 size={14} />}
                        {copied
                            ? (language === 'en' ? 'Copied!' : 'تم النسخ!')
                            : (language === 'en' ? 'Copy Link' : 'نسخ الرابط')
                        }
                    </button>
                </div>
            )}

            {/* Main */}
            <div className="admin-body">
                {/* Left Panel */}
                <aside className="admin-sidebar">
                    <LeftPanel template={template} setTemplate={setTemplate} />
                </aside>

                {/* Canvas */}
                <main className="admin-canvas-area" ref={containerRef}>
                    <div className="canvas-grid" />
                    <div style={{ position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.7)', borderRadius: 4 }}>
                        <CanvasRenderer
                            template={template}
                            scale={scale}
                            interactive={true}
                            onLayerUpdate={(id, updates) => updateLayer(id, updates)}
                            highlightedLayerId={selectedLayerId}
                            onSelectLayer={setSelectedLayerId}
                        />
                    </div>
                    <div className="canvas-zoom-badge">{Math.round(scale * 100)}%</div>
                </main>

                {/* Right Panel */}
                <aside className="admin-sidebar admin-sidebar-right">
                    <RightPanel
                        template={template}
                        setTemplate={setTemplate}
                        selectedLayerId={selectedLayerId}
                        setSelectedLayerId={setSelectedLayerId}
                        language={language}
                    />
                </aside>
            </div>
        </div>
    );
};

export default AdminPage;
