import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthSettings } from '../../context/AuthSettingsContext';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AdminLogin: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuthSettings();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/admin');
        }
    }, [user, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin');
        } catch (err: any) {
            setError('Invalid email or password.');
            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
            <form onSubmit={handleLogin} style={{ background: 'var(--bg-surface)', padding: 40, borderRadius: 16, width: '100%', maxWidth: 400, border: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: 24, marginBottom: 20, textAlign: 'center', color: 'var(--text-primary)' }}>Admin Login</h1>
                {error && <div style={{ color: 'var(--red)', marginBottom: 20, fontSize: 13, background: 'rgba(248,113,113,0.1)', padding: 10, borderRadius: 8 }}>{error}</div>}

                <div style={{ marginBottom: 15 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 5, color: 'var(--text-primary)' }}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: '#fff' }}
                    />
                </div>

                <div style={{ marginBottom: 25 }}>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 5, color: 'var(--text-primary)' }}>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: '#fff' }}
                    />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 8, background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                    {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', margin: '0 auto' }} /> : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;
