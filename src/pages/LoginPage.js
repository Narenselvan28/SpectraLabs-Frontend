import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ArrowRight, Triangle, ShieldAlert, Cpu, Network, Lock } from 'lucide-react';
import logo from '../1723176950534.jpeg';
import API_BASE_URL from '../apiConfig';

axios.defaults.withCredentials = true;

const LoginPage = () => {
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [systemPulse, setSystemPulse] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => setSystemPulse(p => !p), 3000);
        return () => clearInterval(interval);
    }, []);

    const handleEnter = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                team_name: teamName,
                team_code: teamCode,
                role: 'team'
            });
            if (res.data.success) {
                localStorage.setItem('team', JSON.stringify(res.data.team));
                navigate('/select-contest');
            }
        } catch (err) {
            setError(err.response?.data?.error || "ACCESS_DENIED: Invalid Credentials");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            height: '100vh',
            width: '100vw',
            background: '#040d08',
            color: '#fff',
            display: 'flex',
            overflow: 'hidden',
            fontFamily: 'var(--font-main)',
            position: 'relative'
        }}>
            <div className="scanline" />
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'radial-gradient(circle at 70% 30%, rgba(74, 222, 128, 0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
                zIndex: 2
            }} />

            {/* Form Column */}
            <div style={{ flex: '0 0 520px', minWidth: '450px', padding: '4rem 5rem', display: 'flex', flexDirection: 'column', zIndex: 10, background: 'linear-gradient(90deg, #040d08 85%, transparent)' }}>
                
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 'auto' }}
                >
                    <img src={logo} alt="SL" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--primary)' }} />
                    <div>
                        <span style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '4px', color: 'var(--primary)', display: 'block' }}>SPECTRA_HUB</span>
                        <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '2px', opacity: 0.3 }}>DEEP_SPACE_NETWORK</span>
                    </div>
                </motion.div>

                <div style={{ maxWidth: '440px', marginBottom: 'auto' }}>
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 style={{ fontSize: '3.6rem', fontWeight: '900', lineHeight: '0.95', marginBottom: '1.8rem', letterSpacing: '-2px' }}>
                            Pattern<br />Discovery<br /><span style={{ color: 'var(--primary)' }}>Interface</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: '1.7', marginBottom: '2.5rem' }}>
                            Initialize your secure uplink. All operational data is synchronized via SpectraGuard encrypted protocols.
                        </p>
                    </motion.div>

                    <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? 'var(--error)' : 'var(--primary)', boxShadow: `0 0 10px ${error ? 'var(--error)' : 'var(--primary)'}` }} />
                            <span style={{ fontSize: '9px', fontWeight: '900', color: error ? 'var(--error)' : 'var(--primary)', letterSpacing: '2.5px' }}>
                                {loading ? 'SYNCHRONIZING...' : error ? 'ACCESS_BLOCK' : 'UPLINK_READY'}
                            </span>
                        </div>

                        <form onSubmit={handleEnter}>
                            <div style={{ marginBottom: '1.2rem' }}>
                                <label className="text-label" style={{ marginBottom: '0.8rem', display: 'block' }}>NODE_ALIAS</label>
                                <div style={{ position: 'relative' }}>
                                    <Cpu size={16} style={{ position: 'absolute', left: '1.2rem', top: '1.2rem', opacity: 0.2 }} />
                                    <input value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Target Callsign" style={{ width: '100%', paddingLeft: '3.2rem', height: '52px' }} required />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.8rem' }}>
                                <label className="text-label" style={{ marginBottom: '0.8rem', display: 'block' }}>SECURE_KEY</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '1.2rem', top: '1.2rem', opacity: 0.2 }} />
                                    <input type="password" value={teamCode} onChange={e => setTeamCode(e.target.value)} placeholder="••••••••" style={{ width: '100%', paddingLeft: '3.2rem', height: '52px' }} required />
                                </div>
                            </div>

                            {error && (
                                <div style={{ marginBottom: '1.5rem', color: 'var(--error)', background: 'rgba(248, 113, 113, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <ShieldAlert size={14} />
                                    <span style={{ fontSize: '11px', fontWeight: '900' }}>{error}</span>
                                </div>
                            )}

                            <button disabled={loading} className="btn-primary" style={{ width: '100%', height: '54px', borderRadius: '50px', gap: '1rem' }}>
                                {loading ? 'SYNCING...' : 'ESTABLISH_UPLINK'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '3rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2.2rem' }}>
                     <div>
                        <span style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>NET_LATENCY</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <Network size={14} color={systemPulse ? 'var(--primary)' : '#444'} />
                             <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>12.4ms</span>
                        </div>
                    </div>
                    <div>
                        <span style={{ display: 'block', fontSize: '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>SYSTEM_CORE</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>OPERATIONAL</span>
                    </div>
                </div>
            </div>

            {/* Visualizer Column */}
            <div style={{ flex: 1, background: '#050505', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #0a150e 0%, #050505 100%)' }} />
                
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', width: '600px', height: '600px', border: '1px solid rgba(74, 222, 128, 0.05)', borderRadius: '50%' }} />
                
                <motion.div animate={{ y: [0, -20, 0], rotateX: [-10, 10, -10] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} style={{ zIndex: 5, perspective: '1000px' }}>
                    <Triangle size={380} fill="rgba(74, 222, 128, 0.03)" color="rgba(74, 222, 128, 0.2)" strokeWidth={0.5} style={{ filter: 'drop-shadow(0 0 40px rgba(74, 222, 128, 0.1))' }} />
                </motion.div>
            </div>
        </div>
    );
};

export default LoginPage;
