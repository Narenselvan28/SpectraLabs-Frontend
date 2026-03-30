import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ArrowRight, Triangle, ShieldAlert, Cpu, Network, Lock, Globe, Activity } from 'lucide-react';
import logo from '../1723176950534.jpeg';
import API_BASE_URL from '../apiConfig';

axios.defaults.withCredentials = true;

const LoginPage = () => {
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

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
            setError(err.response?.data?.error || "Login Failed: Check your Name/Password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: '#040d08',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            fontFamily: 'var(--font-main)',
            position: 'relative'
        }}>
            {/* Design Elements */}
            <div className="scanline" />
            <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)', filter: 'blur(80px)' }} />
                <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', filter: 'blur(100px)' }} />
            </div>

            {/* Grid Overlay */}
            <div style={{ 
                position: 'absolute', 
                inset: 0, 
                backgroundImage: 'linear-gradient(rgba(74, 222, 128, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 222, 128, 0.03) 1px, transparent 1px)', 
                backgroundSize: '50px 50px',
                pointerEvents: 'none'
            }} />

            {/* Subtle Floating Shapes for atmosphere */}
            <motion.div animate={{ y: [0, -20, 0], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity }} style={{ position: 'absolute', top: '15%', left: '10%' }}><Network size={60} color="var(--primary)" strokeWidth={0.5} /></motion.div>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', bottom: '15%', right: '10%', opacity: 0.05 }}><Triangle size={120} color="var(--accent)" strokeWidth={1} /></motion.div>
            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 7, repeat: Infinity }} style={{ position: 'absolute', top: '20%', right: '15%' }}><Globe size={80} color="var(--primary)" strokeWidth={0.5} /></motion.div>

            {/* Login Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                    width: '100%', 
                    maxWidth: '460px', 
                    padding: '3rem', 
                    background: 'rgba(5, 15, 10, 0.9)', 
                    backdropFilter: 'blur(30px)', 
                    borderRadius: '32px', 
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                    zIndex: 20
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <motion.img 
                        initial={{ scale: 0.8 }} 
                        animate={{ scale: 1 }}
                        src={logo} 
                        alt="Logo" 
                        style={{ width: '64px', height: '64px', borderRadius: '16px', border: '1px solid var(--primary)', marginBottom: '1.5rem' }} 
                    />
                    <h2 style={{ fontSize: '1.8rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '0.5rem' }}>Contest Login</h2>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontWeight: '500' }}>Please enter your credentials to begin</p>
                </div>

                <form onSubmit={handleEnter} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--primary)', fontWeight: '900', letterSpacing: '1px' }}>
                            <Cpu size={14} /> YOUR NAME
                        </label>
                        <input 
                            value={teamName} 
                            onChange={e => setTeamName(e.target.value)} 
                            placeholder="Full Name" 
                            style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px' }} 
                            required 
                        />
                    </div>

                    <div className="glass-card" style={{ padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <label style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--accent)', fontWeight: '900', letterSpacing: '1px' }}>
                            <Lock size={14} /> PASSWORD
                        </label>
                        <input 
                            type="password"
                            value={teamCode} 
                            onChange={e => setTeamCode(e.target.value)} 
                            placeholder="••••••••" 
                            style={{ width: '100%', height: '50px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px' }} 
                            required 
                        />
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ color: 'var(--error)', background: 'rgba(248, 113, 113, 0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(248, 113, 113, 0.1)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px' }}
                            >
                                <ShieldAlert size={14} />
                                <span style={{ fontWeight: '900' }}>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button disabled={loading} className="btn-primary" style={{ height: '60px', borderRadius: '50px', fontSize: '14px', fontWeight: '900', gap: '12px', marginTop: '1rem' }}>
                        {loading ? 'Please wait...' : 'Login Now'}
                        {!loading && <ArrowRight size={20} />}
                    </button>
                </form>
            </motion.div>

            {/* Simplified Footer */}
            <div style={{ position: 'absolute', bottom: '2rem', width: '100%', textAlign: 'center', opacity: 0.15 }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SpectraOps Contest Management System</span>
            </div>
        </div>
    );
};

export default LoginPage;
