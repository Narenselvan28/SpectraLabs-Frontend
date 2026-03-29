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
                is_admin: false
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
            {/* Visual Overlays */}
            <div className="scanline" />
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'radial-gradient(circle at 70% 30%, rgba(74, 222, 128, 0.05) 0%, transparent 60%)',
                pointerEvents: 'none',
                zIndex: 2
            }} />

            {/* Left Column: Intelligence Form */}
            <div style={{ flex: 1, padding: '4rem 6rem', display: 'flex', flexDirection: 'column', zIndex: 10, background: 'linear-gradient(90deg, #040d08 80%, transparent)' }}>
                
                {/* Branding */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: 'auto' }}
                >
                    <div style={{ position: 'relative' }}>
                        <img src={logo} alt="SL" style={{ width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--primary)' }} />
                        <motion.div 
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ position: 'absolute', inset: '-4px', border: '1px solid var(--primary)', borderRadius: '14px', opacity: 0.5 }} 
                        />
                    </div>
                    <div>
                        <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '4px', color: 'var(--primary)', display: 'block' }}>SPECTRALABS</span>
                        <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '2px', color: 'rgba(255,255,255,0.3)' }}>DEEP_SPACE_NETWORK</span>
                    </div>
                </motion.div>

                {/* Main Hero Section */}
                <div style={{ maxWidth: '600px', marginBottom: 'auto' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 style={{ fontSize: '5rem', fontWeight: '900', lineHeight: '0.9', marginBottom: '2rem', letterSpacing: '-3px' }}>
                            Pattern<br />Discovery<br /><span style={{ color: 'var(--primary)', opacity: 0.8 }}>Interface</span>
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '16px', maxWidth: '450px', lineHeight: '1.6', marginBottom: '3rem' }}>
                            Initialize your secure uplink to begin global reverse engineering evaluation. All data packets are encrypted via SpectraGuard protocols.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="terminal-card"
                        style={{ padding: '3rem', borderRadius: '24px', position: 'relative' }}
                    >
                        {/* Status Light */}
                        <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? 'var(--error)' : 'var(--primary)', boxShadow: `0 0 10px ${error ? 'var(--error)' : 'var(--primary)'}` }} />
                            <span style={{ fontSize: '9px', fontWeight: '900', color: error ? 'var(--error)' : 'var(--primary)', letterSpacing: '1px' }}>
                                {loading ? 'SYNCING...' : error ? 'ACCESS_BLOCK' : 'UPLINK_READY'}
                            </span>
                        </div>

                        <form onSubmit={handleEnter}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label className="text-label" style={{ marginBottom: '1rem', display: 'block' }}>NODE_IDENTITY</label>
                                <div style={{ position: 'relative' }}>
                                    <Cpu size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'rgba(255,255,255,0.2)' }} />
                                    <input 
                                        type="text" 
                                        placeholder="Enter Team Name" 
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '3rem' }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '2rem' }}>
                                <label className="text-label" style={{ marginBottom: '1rem', display: 'block' }}>SECURE_PHRASE</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '1.1rem', color: 'rgba(255,255,255,0.2)' }} />
                                    <input 
                                        type="password" 
                                        placeholder="••••••••"
                                        value={teamCode}
                                        onChange={(e) => setTeamCode(e.target.value)}
                                        style={{ width: '100%', paddingLeft: '3rem', letterSpacing: teamCode ? '6px' : '0' }}
                                        required
                                    />
                                </div>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--error)', background: 'rgba(248, 71, 71, 0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(248, 71, 71, 0.2)' }}
                                    >
                                        <ShieldAlert size={16} />
                                        <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px' }}>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button 
                                disabled={loading}
                                className="btn-primary" 
                                style={{ width: '100%', padding: '1.2rem', borderRadius: '50px', gap: '1rem' }}
                            >
                                {loading ? 'SYNCHRONIZING...' : 'ESTABLISH_UPLINK'}
                                {!loading && <ArrowRight size={18} />}
                            </button>
                        </form>
                    </motion.div>
                </div>

                {/* System Metrics Footer */}
                <div style={{ display: 'flex', gap: '3rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Network size={20} color={systemPulse ? 'var(--primary)' : 'rgba(255,255,255,0.2)'} style={{ transition: 'all 0.5s' }} />
                        <div>
                            <span style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.3)' }}>LATENCY</span>
                            <span style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>14.2ms</span>
                        </div>
                    </div>
                    <div style={{ height: '30px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                    <div>
                        <span style={{ display: 'block', fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.3)' }}>SYSTEM_STATUS</span>
                        <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>NOMINAL</span>
                    </div>
                </div>
            </div>

            {/* Right Column: Visualizer */}
            <div style={{ flex: 1.1, background: '#050505', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                
                {/* Visualizer Background */}
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, #0a150e 0%, #050505 100%)' }} />
                
                {/* 3D-ish Triangle Grid */}
                <div style={{ position: 'relative', width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                        style={{ position: 'absolute', width: '700px', height: '700px', border: '1px solid rgba(74, 222, 128, 0.03)', borderRadius: '50%' }} 
                    />
                    
                    <motion.div
                        animate={{ 
                            y: [0, -20, 0],
                            rotateX: [-5, 5, -5],
                            rotateY: [-5, 5, -5],
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        style={{ perspective: '1000px', zIndex: 5 }}
                    >
                        <Triangle size={420} fill="rgba(74, 222, 128, 0.02)" color="rgba(74, 222, 128, 0.15)" strokeWidth={0.5} style={{ filter: 'drop-shadow(0 0 30px rgba(74, 222, 128, 0.1))' }} />
                        
                        {/* Data Flow Lines */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', gap: '30px' }}>
                            {[...Array(5)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    animate={{ 
                                        height: [100, 250, 100],
                                        opacity: [0.1, 0.3, 0.1],
                                        y: [0, -20 * i, 0]
                                    }}
                                    transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ width: '1px', background: `linear-gradient(to bottom, transparent, var(--primary), transparent)` }} 
                                />
                            ))}
                        </div>
                    </motion.div>

                    {/* Matrix Rain Decoration (Subtle) */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, pointerEvents: 'none' }}>
                         {/* This would ideally be a Canvas element for performance, but using CSS/Divs for MVP polish */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
