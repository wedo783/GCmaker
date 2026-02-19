import React, { useEffect, useState, useRef } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthSettings } from '../context/AuthSettingsContext';
import type { TemplateConfig } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Eye, EyeOff, Settings, LogOut, Loader2 } from 'lucide-react';
import { signOut } from 'firebase/auth';

const AdminDashboard: React.FC = () => {
    const { user, settings, loading: authLoading, updateSettings } = useAuthSettings();
    const [cards, setCards] = useState<TemplateConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const navigate = useNavigate();

    // Settings Form State
    const [appNameEn, setAppNameEn] = useState(settings.appNameEn);
    const [appNameAr, setAppNameAr] = useState(settings.appNameAr);
    const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
    const [accentColor, setAccentColor] = useState(settings.accentColor);
    const [logoUrlEn, setLogoUrlEn] = useState(settings.logoUrlEn);
    const [logoUrlAr, setLogoUrlAr] = useState(settings.logoUrlAr);
    const [savingSettings, setSavingSettings] = useState(false);

    const logoEnRef = useRef<HTMLInputElement>(null);
    const logoArRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, lang: 'en' | 'ar') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const b64 = ev.target?.result as string;
                if (b64) {
                    if (lang === 'en') setLogoUrlEn(b64);
                    else setLogoUrlAr(b64);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) navigate('/admin/login');
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const snap = await getDocs(collection(db, 'cards'));
                const fetched = snap.docs.map(doc => doc.data() as TemplateConfig);
                setCards(fetched);
            } catch (err) {
                console.error("Failed to load cards", err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchCards();
    }, [user]);

    const handleCreateNew = () => {
        // Clear draft
        localStorage.removeItem('greeting-card-draft');
        navigate('/admin/edit/new');
    };

    const handleToggleActive = async (card: TemplateConfig) => {
        const newStatus = !card.isActive;
        setCards(prev => prev.map(c => c.slug === card.slug ? { ...c, isActive: newStatus } : c));
        try {
            await updateDoc(doc(db, 'cards', card.slug), { isActive: newStatus });
        } catch (e) {
            console.error(e);
            // Revert on fail
            setCards(prev => prev.map(c => c.slug === card.slug ? { ...c, isActive: card.isActive } : c));
        }
    };

    const handleDelete = async (slug: string) => {
        if (!window.confirm("Are you sure you want to delete this card format entirely?")) return;
        setCards(prev => prev.filter(c => c.slug !== slug));
        try {
            await deleteDoc(doc(db, 'cards', slug));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSaveSettings = async () => {
        setSavingSettings(true);
        await updateSettings({ appNameEn, appNameAr, primaryColor, accentColor, logoUrlEn, logoUrlAr });
        setSavingSettings(false);
        setShowSettings(false);
    };

    if (authLoading || loading) {
        return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}><Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent)' }} /></div>;
    }

    if (!user) return null; // Redirected

    return (
        <div style={{ background: 'var(--bg-app)', minHeight: '100vh', padding: 40, color: 'var(--text-primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
                <h1>Admin Dashboard - {settings.appNameEn}</h1>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => setShowSettings(!showSettings)} className="btn btn-ghost" style={{ background: 'var(--bg-surface)' }}>
                        <Settings size={18} /> Settings
                    </button>
                    <button onClick={() => signOut(auth)} className="btn btn-danger-ghost">
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>

            {showSettings && (
                <div style={{ background: 'var(--bg-surface)', padding: 20, borderRadius: 12, marginBottom: 40, border: '1px solid var(--border)' }}>
                    <h3>Global Application Settings</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>App Name (English)</label>
                            <input className="form-input" value={appNameEn} onChange={e => setAppNameEn(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>App Name (Arabic)</label>
                            <input className="form-input" value={appNameAr} onChange={e => setAppNameAr(e.target.value)} dir="rtl" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Primary Color (Navy/Dark)</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent' }} />
                                <input className="form-input" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Accent Color (Green/Action)</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent' }} />
                                <input className="form-input" value={accentColor} onChange={e => setAccentColor(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Logo (English)</label>
                            <div className="upload-zone" onClick={() => logoEnRef.current?.click()}>
                                {logoUrlEn ? (
                                    <img src={logoUrlEn} alt="En Logo Preview" style={{ maxHeight: 60 }} />
                                ) : (
                                    <span className="upload-zone-text">Click to upload</span>
                                )}
                                <input type="file" ref={logoEnRef} onChange={(e) => handleLogoUpload(e, 'en')} accept="image/*" style={{ display: 'none' }} />
                            </div>
                            {logoUrlEn && (
                                <button className="btn btn-danger-ghost" style={{ marginTop: 8, padding: 4 }} onClick={() => setLogoUrlEn(null)}>Remove</button>
                            )}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: 13, marginBottom: 5 }}>Logo (Arabic)</label>
                            <div className="upload-zone" onClick={() => logoArRef.current?.click()}>
                                {logoUrlAr ? (
                                    <img src={logoUrlAr} alt="Ar Logo Preview" style={{ maxHeight: 60 }} />
                                ) : (
                                    <span className="upload-zone-text">Click to upload</span>
                                )}
                                <input type="file" ref={logoArRef} onChange={(e) => handleLogoUpload(e, 'ar')} accept="image/*" style={{ display: 'none' }} />
                            </div>
                            {logoUrlAr && (
                                <button className="btn btn-danger-ghost" style={{ marginTop: 8, padding: 4 }} onClick={() => setLogoUrlAr(null)}>Remove</button>
                            )}
                        </div>
                    </div>

                    <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSaveSettings} disabled={savingSettings}>
                        {savingSettings ? 'Saving...' : 'Save Theme & Settings'}
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2>Your Occasions / Cards</h2>
                <button onClick={handleCreateNew} className="btn btn-success">
                    <Plus size={18} /> Create New Card
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {cards.map(card => (
                    <div key={card.slug} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18 }}>{card.slug}</h3>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                                    {card.layers.length} Layers • {card.dimensions.label}
                                </div>
                            </div>
                            <span style={{ padding: '4px 8px', borderRadius: 99, fontSize: 11, fontWeight: 'bold', background: card.isActive ? 'rgba(63, 175, 110, 0.2)' : 'rgba(255, 255, 255, 0.1)', color: card.isActive ? 'var(--accent-light)' : 'var(--text-muted)' }}>
                                {card.isActive ? 'Active' : 'Hidden'}
                            </span>
                        </div>
                        <div style={{ padding: '15px 20px', display: 'flex', gap: 10, background: 'rgba(0,0,0,0.2)' }}>
                            <button
                                onClick={() => { localStorage.removeItem('greeting-card-draft'); navigate(`/admin/edit/${card.slug}`); }}
                                className="btn btn-ghost"
                                style={{ flex: 1, justifyContent: 'center' }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                            <button
                                onClick={() => handleToggleActive(card)}
                                className="btn btn-ghost"
                                style={{ flex: 1, justifyContent: 'center', color: card.isActive ? 'var(--text-secondary)' : 'var(--accent-light)' }}
                                title="Toggle visibility in User Nav"
                            >
                                {card.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                                {card.isActive ? 'Hide' : 'Show'}
                            </button>
                            <button
                                onClick={() => handleDelete(card.slug)}
                                className="btn btn-danger-ghost"
                                style={{ padding: '0 12px' }}
                                title="Delete forever"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {cards.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                        No cards found. Create your first occasion!
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
