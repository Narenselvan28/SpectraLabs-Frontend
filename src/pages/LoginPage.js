import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowRight, Triangle } from 'lucide-react';
import logo from '../1723176950534.jpeg';

import API_BASE_URL from '../apiConfig';

axios.defaults.withCredentials = true;

const LoginPage = () => {
    const [teamName, setTeamName] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleEnter = async (e) => {
        e.preventDefault();
        setLoading(true);
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
            alert(err.response?.data?.error || "Access denied. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page" style={{
            height: '100vh',
            width: '100vw',
            background: '#050505',
            color: '#fff',
            display: 'flex',
            overflow: 'hidden',
            fontFamily: 'var(--font-main)',
            position: 'relative'
        }}>
            {/* Atmospheric Background Animation */}
            <motion.div
                animate={{ 
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                style={{ 
                    position: 'absolute', 
                    top: '-10%', 
                    left: '-10%', 
                    width: '60vw', 
                    height: '60vw', 
                    background: 'radial-gradient(circle, rgba(74, 222, 128, 0.03) 0%, transparent 70%)',
                    filter: 'blur(80px)',
                    zIndex: 1
                }}
            />
            <motion.div
                animate={{ 
                    scale: [1.2, 1, 1.2],
                    x: [0, -40, 0],
                    y: [0, 60, 0],
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                style={{ 
                    position: 'absolute', 
                    bottom: '-10%', 
                    right: '-10%', 
                    width: '50vw', 
                    height: '50vw', 
                    background: 'radial-gradient(circle, rgba(74, 222, 128, 0.02) 0%, transparent 70%)',
                    filter: 'blur(100px)',
                    zIndex: 1
                }}
            />

            {/* Scanline Overlay */}
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))',
                backgroundSize: '100% 4px, 3px 100%',
                pointerEvents: 'none',
                zIndex: 100,
                opacity: 0.1
            }} />

            {/* Left Side: Content & Form */}
            <div style={{ flex: 1.2, padding: '4rem 6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                
                {/* Header Logo */}
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}
                >
                    <img src={logo} alt="SL" style={{ width: '28px', height: '28px', borderRadius: '4px' }} />
                    <span style={{ fontSize: '10px', fontWeight: '900', letterSpacing: '4px', color: '#fff' }}>SPECTRALABS</span>
                </motion.div>

                <div style={{ maxWidth: '500px' }}>
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.2 }
                            }
                        }}
                    >
                        <motion.h1 
                            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                            style={{ fontSize: '4.5rem', fontWeight: '800', lineHeight: '1', marginBottom: '1.5rem', letterSpacing: '-2px' }}
                        >
                            Engineering<br />Intelligence
                        </motion.h1>
                        <motion.p 
                            variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0 } }}
                            style={{ color: '#888', fontSize: '15px', fontWeight: '500', marginBottom: '3rem' }}
                        >
                            The premier environment for competitive technical orchestration.
                        </motion.p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
                        style={{ 
                            background: 'rgba(10, 10, 10, 0.8)', 
                            backdropFilter: 'blur(20px)',
                            padding: '2.5rem', 
                            borderRadius: '32px', 
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Box Inner Glow */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(74, 222, 128, 0.2), transparent)' }} />
                        
                        <form onSubmit={handleEnter}>
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                style={{ marginBottom: '1.8rem' }}
                            >
                                <label style={{ display: 'block', fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '0.8rem' }}>MISSION IDENTITY</label>
                                <input 
                                    type="text" 
                                    placeholder="Team Name" 
                                    className="login-input"
                                    value={teamName}
                                    onChange={(e) => setTeamName(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        background: 'rgba(5, 5, 5, 0.6)', 
                                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                                        borderRadius: '14px', 
                                        padding: '1.1rem',
                                        color: '#fff',
                                        fontSize: '14px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    required
                                />
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                style={{ marginBottom: '2.5rem' }}
                            >
                                <label style={{ display: 'block', fontSize: '9px', color: '#444', fontWeight: '900', letterSpacing: '2px', marginBottom: '0.8rem' }}>ACCESS CODE</label>
                                <input 
                                    type="password" 
                                    placeholder="Secure Passphrase"
                                    className="login-input"
                                    value={teamCode}
                                    onChange={(e) => setTeamCode(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        background: 'rgba(5, 5, 5, 0.6)', 
                                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                                        borderRadius: '14px', 
                                        padding: '1.1rem',
                                        color: '#fff',
                                        fontSize: '14px',
                                        letterSpacing: teamCode ? '4px' : 'normal',
                                        transition: 'all 0.3s ease'
                                    }}
                                    required
                                />
                            </motion.div>

                            <motion.button 
                                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,255,255,0.15)' }}
                                whileTap={{ scale: 0.98 }}
                                disabled={loading}
                                style={{ 
                                    width: '100%', 
                                    background: '#fff', 
                                    color: '#000', 
                                    border: 'none', 
                                    borderRadius: '50px', 
                                    padding: '1.2rem',
                                    fontWeight: '900',
                                    fontSize: '11px',
                                    letterSpacing: '2px',
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    gap: '1rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                }}
                            >
                                {loading ? 'UPLOADING...' : 'INITIATE SESSION'}
                                {!loading && <ArrowRight size={16} />}
                            </motion.button>
                        </form>
                    </motion.div>
                </div>

            </div>

            {/* Right Side: Graphic Decoration */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #0a150e 0%, #050505 80%)', overflow: 'hidden' }}>
                
                {/* Large Background Graphic */}
                <div style={{ position: 'relative', width: '80%', height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    
                    {/* Concentric Circles With Counter-Rotation */}
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                        style={{ position: 'absolute', width: '600px', height: '600px', border: '1px solid rgba(255,255,255,0.02)', borderRadius: '50%' }} 
                    />
                    <motion.div 
                        animate={{ rotate: -360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        style={{ position: 'absolute', width: '450px', height: '450px', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '50%' }} 
                    />
                    
                    {/* Shadow / Glow With Pulse */}
                    <motion.div 
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        style={{ 
                            position: 'absolute', 
                            width: '300px', 
                            height: '300px', 
                            background: 'radial-gradient(circle, rgba(74, 222, 128, 0.12) 0%, transparent 70%)',
                            filter: 'blur(60px)'
                        }}
                    />

                    {/* Central Triangle Graphic */}
                    <motion.div
                        animate={{ 
                            y: [0, -15, 0],
                            rotateX: [0, 5, 0],
                            rotateY: [0, 5, 0],
                        }}
                        transition={{ 
                            duration: 5, 
                            repeat: Infinity, 
                            ease: "easeInOut" 
                        }}
                        style={{ position: 'relative', zIndex: 5, perspective: '1000px' }}
                    >
                        <Triangle size={320} fill="rgba(74, 222, 128, 0.05)" color="rgba(74, 222, 128, 0.25)" strokeWidth={0.3} />
                        
                        {/* Vertical Lines Decoration With Cascading Motion */}
                        <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px' }}>
                            {[1, 2, 3].map((i) => (
                                <motion.div 
                                    key={i}
                                    animate={{ height: [80 * i, 120 * i, 80 * i], opacity: [0.2, 0.5, 0.2] }}
                                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut" }}
                                    style={{ width: '1px', background: 'linear-gradient(to bottom, rgba(74, 222, 128, 0.4), transparent)' }} 
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
            
            <style>{`
                .login-input:focus {
                    background: rgba(10, 20, 15, 0.6) !important;
                    border-color: rgba(74, 222, 128, 0.3) !important;
                    box-shadow: 0 0 30px rgba(74, 222, 128, 0.05) !important;
                    outline: none !important;
                }
                .login-input::placeholder {
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
