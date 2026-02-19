import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface GlobalSettings {
    appNameEn: string;
    appNameAr: string;
    primaryColor: string;
    accentColor: string;
}

const DEFAULT_SETTINGS: GlobalSettings = {
    appNameEn: 'GC Maker',
    appNameAr: 'صانع البطاقات',
    primaryColor: '#1c3258',
    accentColor: '#3faf6e'
};

interface AuthSettingsContextType {
    user: User | null;
    settings: GlobalSettings;
    loading: boolean;
    updateSettings: (newSettings: Partial<GlobalSettings>) => Promise<void>;
}

const AuthSettingsContext = createContext<AuthSettingsContextType | undefined>(undefined);

export const AuthSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [settings, setSettings] = useState<GlobalSettings>(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        const loadSettings = async () => {
            try {
                const snap = await getDoc(doc(db, 'settings', 'global'));
                if (snap.exists()) {
                    setSettings(snap.data() as GlobalSettings);
                }
            } catch (err) {
                console.error("Failed to load settings:", err);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();

        return () => unsubscribe();
    }, []);

    // Apply CSS variables when settings change
    useEffect(() => {
        document.documentElement.style.setProperty('--primary', settings.primaryColor);
        // compute subtle variants for CSS
        document.documentElement.style.setProperty('--accent', settings.accentColor);
        document.documentElement.style.setProperty('--accent-light', settings.accentColor); // Or compute lighter
    }, [settings.primaryColor, settings.accentColor]);

    const updateSettings = async (newSettings: Partial<GlobalSettings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        try {
            await setDoc(doc(db, 'settings', 'global'), updated);
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    };

    return (
        <AuthSettingsContext.Provider value={{ user, settings, loading, updateSettings }}>
            {children}
        </AuthSettingsContext.Provider>
    );
};

export const useAuthSettings = () => {
    const ctx = useContext(AuthSettingsContext);
    if (!ctx) throw new Error("useAuthSettings must be within AuthSettingsProvider");
    return ctx;
};
