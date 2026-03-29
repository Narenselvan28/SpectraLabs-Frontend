import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Terminal, Lock, User, ShieldAlert, ArrowLeft } from 'lucide-react';

import API_BASE_URL from '../apiConfig';

axios.defaults.withCredentials = true;

const AdminLoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                team_name: username,
                team_code: password,
                is_admin: true
            });
            if (res.data.success) {
                window.location.href = '/admin';
            }
        } catch (err) {
            setError(err.response?.data?.error || "Credential mismatch. Unauthorized access detected.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page" style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--bg-main)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Subtle Green Background Accent */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(74, 222, 128, 0.05) 0%, transparent 70%)', filter: 'blur(80px)', pointerEvents: 'none' }}></div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card" 
                style={{ padding: '3.5rem 4rem', width: '480px', borderTop: '2px solid var(--primary-soft)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <div style={{ 
                        width: '70px', 
                        height: '70px', 
                        background: 'rgba(74, 222, 128, 0.05)', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        margin: '0 auto 1.5rem auto',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <ShieldAlert size={36} color="var(--primary)" />
                    </div>
                    <h1 className="heading-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Admin Console</h1>
                    <p className="text-label" style={{ color: 'var(--text-muted)' }}>Restricted Access Gate</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label className="text-label" style={{ display: 'block', marginBottom: '0.8rem' }}>Administrator ID</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="text" 
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ width: '100%', paddingLeft: '3rem !important' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label className="text-label" style={{ display: 'block', marginBottom: '0.8rem' }}>Master Passcode</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1.1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input 
                                type="password" 
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', paddingLeft: '3rem !important', letterSpacing: '0.2rem' }}
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{ 
                            background: 'rgba(248, 113, 113, 0.05)', 
                            color: 'var(--error)', 
                            fontSize: '13px', 
                            padding: '0.8rem', 
                            borderRadius: '8px', 
                            border: '1px solid rgba(248, 113, 113, 0.1)',
                            fontWeight: '600'
                        }}>
                             {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                    >
                        {loading ? 'Authorizing...' : 'Access Console'}
                        {!loading && <Terminal size={18} />}
                    </button>
                    
                    <div 
                        onClick={() => navigate('/')}
                        style={{ 
                            textAlign: 'center', 
                            color: 'var(--text-muted)', 
                            fontSize: '12px', 
                            cursor: 'pointer', 
                            marginTop: '1.5rem', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '0.6rem',
                            fontWeight: '500',
                            transition: 'var(--transition)'
                        }}
                        onMouseEnter={(e) => e.target.style.color = 'var(--primary)'}
                        onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                    >
                        <ArrowLeft size={14} /> Back to Participant Portal
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminLoginPage;
