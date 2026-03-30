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
        <div style={{ 
            padding: '5rem 2rem', 
            minHeight: '100vh', 
            background: '#040d08', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            position: 'relative',
            overflowX: 'hidden',
            fontFamily: 'var(--font-main)'
        }}>
            <div className="scanline" />
            
            <header style={{ textAlign: 'center', marginBottom: '3.5rem', zIndex: 10 }}>
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '1.2rem', background: 'rgba(74, 222, 128, 0.05)', padding: '0.5rem 1.2rem', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
                    <Cpu size={14} color="var(--primary)" />
                    <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--primary)' }}>SYSTEM: READY</span>
                </motion.div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-1px', marginBottom: '0.8rem' }}>Choose Your Contest</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', maxWidth: '400px', lineHeight: '1.5' }}>Please select an available contest from the list below to start your evaluation.</p>
            </header>

            <button onClick={fetchContests} className="btn-accent" style={{ padding: '0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '3.5rem', borderRadius: '50px', zIndex: 10, fontSize: '12px' }}>
                <RefreshCw size={16} className={scanning ? "animate-spin" : ""} />
                {scanning ? "Searching..." : "Refresh Contests"}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', maxWidth: '1100px', width: '100%', margin: '0 auto', zIndex: 10 }}>
                {contests.length === 0 && !scanning && (
                    <div className="glass-card" style={{ padding: '3rem', gridColumn: '1 / -1', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                        <Terminal size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                        <div style={{ fontSize: '12px', fontWeight: '900' }}>No Contests Found</div>
                    </div>
                )}

                {contests.map((c, idx) => (
                    <motion.div key={c.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} whileHover={{ y: -4, borderColor: 'var(--primary)', boxShadow: '0 8px 30px rgba(74, 222, 128, 0.1)' }} onClick={() => selectContest(c)} className="glass-card" style={{ padding: '2rem', cursor: 'pointer', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '1.8rem', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: '900', margin: 0 }}>{c.name}</h2>
                                <div style={{ fontSize: '9px', padding: '3px 10px', borderRadius: '50px', background: 'rgba(0,0,0,0.3)', border: `1px solid ${c.is_active ? 'var(--primary)' : '#444'}`, color: c.is_active ? 'var(--primary)' : '#444', fontWeight: '900' }}>
                                    {c.is_active ? 'START' : 'WAITING'}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'rgba(255,255,255,0.3)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                                <span>Time: {c.duration} mins</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: '900', fontSize: '12px', paddingTop: '1.2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <span>START CONTEST</span>
                            <ArrowRight size={16} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ContestSelection;
