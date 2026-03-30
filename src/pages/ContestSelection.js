import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Terminal, Cpu, ArrowRight, RefreshCw } from 'lucide-react';

import API_BASE_URL from '../apiConfig';

const ContestSelection = () => {
    const [contests, setContests] = useState([]);
    const [scanning, setScanning] = useState(false);
    const navigate = useNavigate();

    const selectContest = (contest) => {
        localStorage.setItem('contest_state', JSON.stringify(contest));
        navigate('/dashboard');
    };

    const fetchContests = useCallback(async () => {
        setScanning(true);
        try {
            await axios.get(`${API_BASE_URL}/api/auth/me`);
            const res = await axios.get(`${API_BASE_URL}/api/contests`);
            setContests(res.data);
        } catch (err) {
            navigate('/'); 
        } finally {
            setTimeout(() => setScanning(false), 800);
        }
    }, [navigate]);

    useEffect(() => {
        fetchContests();
    }, [fetchContests]);

    return (
        <div className="contest-selection-page" style={{ 
            padding: '6rem 2rem', 
            minHeight: '100vh', 
            background: 'var(--bg-main)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative',
            overflowX: 'hidden'
        }}>
            <div className="scanline" />
            
            <header style={{ textAlign: 'center', marginBottom: '4rem', zIndex: 5 }}>
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.8rem', 
                        marginBottom: '1.5rem', 
                        background: 'rgba(74, 222, 128, 0.05)', 
                        padding: '0.6rem 1.5rem', 
                        borderRadius: '30px', 
                        border: '1px solid var(--glass-border)' 
                    }}
                >
                    <Cpu size={16} color="var(--primary)" />
                    <span className="text-label" style={{ color: 'var(--primary)' }}>OPERATIONAL_ARENAS</span>
                </motion.div>
                <h1 className="heading-title" style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-1.5px', marginBottom: '1rem' }}>Select Your Mission</h1>
                <p className="text-muted" style={{ fontSize: '16px', maxWidth: '500px', margin: '0 auto', lineHeight: '1.6' }}>Choose an available data node to begin the reverse-engineering evaluation.</p>
            </header>

            <button 
                onClick={fetchContests} 
                className="btn-accent" 
                style={{ 
                    padding: '1rem 2.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '4rem',
                    borderRadius: '50px',
                    zIndex: 5
                }}
            >
                <RefreshCw size={18} className={scanning ? "animate-spin" : ""} />
                {scanning ? "SCANNING_UPLINKS..." : "REFRESH_SYSTEM"}
            </button>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
                gap: '2rem', 
                maxWidth: '1200px', 
                width: '100%', 
                margin: '0 auto',
                zIndex: 5
            }}>
                {contests.length === 0 && !scanning && (
                    <div className="glass-card" style={{ padding: '4rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Terminal size={48} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
                        <div className="text-label">NO_ARENAS_DETECTED</div>
                    </div>
                )}

                {contests.map((c, idx) => (
                    <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ y: -5, borderColor: 'var(--primary)', boxShadow: '0 10px 30px rgba(74, 222, 128, 0.1)' }}
                        onClick={() => selectContest(c)}
                        className="glass-card"
                        style={{ padding: '2.5rem', cursor: 'pointer', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}
                    >
                        <div style={{ marginBottom: '2rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.6rem', fontWeight: '900', margin: 0 }}>{c.name}</h2>
                                <div style={{ 
                                    fontSize: '9px', 
                                    padding: '4px 10px', 
                                    borderRadius: '50px', 
                                    background: 'rgba(0,0,0,0.3)', 
                                    border: `1px solid ${c.is_active ? 'var(--primary)' : '#444'}`, 
                                    color: c.is_active ? 'var(--primary)' : '#444', 
                                    fontWeight: '900' 
                                }}>
                                    {c.is_active ? 'ONLINE' : 'STANDBY'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                <Terminal size={12} />
                                <span>ID: {c.id}</span>
                                <span>&bull;</span>
                                <span>{c.duration} MINS</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: '900', fontSize: '13px', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span>INITIALIZE_CONNECTION</span>
                            <ArrowRight size={18} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ContestSelection;
