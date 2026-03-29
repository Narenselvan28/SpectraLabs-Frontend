import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Terminal, Cpu, ArrowRight, RefreshCw } from 'lucide-react';

import API_BASE_URL from '../apiConfig';

const ContestSelection = () => {
    const [contests, setContests] = useState([]);
    const [scanning, setScanning] = useState(false);
    const navigate = useNavigate();

    const fetchContests = async () => {
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
    };

    useEffect(() => {
        fetchContests();
    }, []);

    const selectContest = (contest) => {
        localStorage.setItem('contest_state', JSON.stringify(contest));
        navigate('/dashboard');
    };

    return (
        <div className="contest-selection-page" style={{ padding: '6rem 2rem', minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <div className="animate-fade-in" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem', background: 'rgba(74, 222, 128, 0.05)', padding: '0.6rem 1.5rem', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
                    <Cpu size={18} color="var(--primary)" />
                    <span className="text-label" style={{ color: 'var(--primary)' }}>Available Arenas</span>
                </div>
                <h1 className="heading-title" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>Select Your Mission</h1>
                <p className="text-muted" style={{ marginTop: '0.5rem' }}>Synchronize with an active arena to begin the evaluation.</p>
            </header>

            <button 
                onClick={fetchContests} 
                className="btn-accent" 
                style={{ padding: '1rem 2.5rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}
            >
                <RefreshCw size={18} className={scanning ? "animate-spin" : ""} />
                {scanning ? "Scanning Uplinks..." : "Refresh Arenas"}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '2.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                {contests.length === 0 && !scanning && (
                    <div className="glass" style={{ padding: '4rem', gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No active arenas are currently broadcasting.
                    </div>
                )}

                {contests.map(c => (
                    <motion.div
                        key={c.id}
                        whileHover={{ y: -5, borderColor: 'var(--primary)' }}
                        onClick={() => selectContest(c)}
                        className="glass-card"
                        style={{ padding: '2.5rem', cursor: 'pointer', borderTop: '4px solid var(--primary-soft)' }}
                    >
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 className="heading-section" style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>{c.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <Terminal size={14} />
                                <span style={{ fontFamily: 'var(--font-mono)' }}>ID: {c.id}</span>
                                <span>&bull;</span>
                                <span>{c.duration} mins</span>
                            </div>
                        </div>

                        <div className="glass" style={{ 
                            background: 'rgba(15, 42, 26, 0.2)', 
                            padding: '1rem', 
                            borderRadius: '10px', 
                            marginBottom: '2rem',
                            fontSize: '13px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span className="text-label" style={{ fontSize: '10px' }}>Status:</span>
                            <span style={{ color: c.is_active ? 'var(--success)' : '#eab308', fontWeight: '700' }}>
                                {c.is_active ? 'Online' : 'Standby'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--primary)', fontWeight: '700', fontSize: '14px' }}>
                            Initialize Connection <ArrowRight size={18} />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default ContestSelection;
