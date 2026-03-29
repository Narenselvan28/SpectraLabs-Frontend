import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { getSocket } from '../hooks/useSocket';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';

import API_BASE_URL from '../apiConfig';

import logo from '../1723176950534.jpeg';

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    const [role, setRole] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/auth/me`);
                if (res.data.teamUser) setRole('team');
                else if (res.data.adminUser) setRole('admin');
            } catch (err) {
                window.location.href = '/'; 
            }
        };
        checkAuth();

        const socket = getSocket(API_BASE_URL);
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));
        socket.on('leaderboardUpdate', (data) => {
            setLeaderboard(data);
        });
        socket.emit('requestLeaderboard');

        // HTTP polling fallback for slow/unreliable networks
        const pollInterval = setInterval(async () => {
            if (!socket.connected) {
                try {
                    const res = await axios.get(`${API_BASE_URL}/api/leaderboard`, { timeout: 5000 });
                    if (res.data && Array.isArray(res.data)) {
                        setLeaderboard(res.data);
                    }
                } catch (e) {} // Silently fail — socket will recover
            }
        }, 8000);

        return () => {
            socket.off('leaderboardUpdate');
            clearInterval(pollInterval);
        };
    }, []);

    if (role === 'team') {
        return (
            <div className="leaderboard-page" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                <header style={{ marginBottom: '5rem' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(248, 113, 113, 0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}></div>
                        <img src={logo} alt="SpectraLabs" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--error)', position: 'relative' }} />
                    </div>
                    <h1 className="heading-title" style={{ fontSize: '3.5rem', color: 'var(--error)', marginTop: '2rem' }}>RESTRICTED_PROTOCOL</h1>
                    <p className="text-body" style={{ color: 'var(--muted)', marginTop: '1rem', letterSpacing: '2px' }}>RANKINGS_LOCKED_DURING_MISSION</p>
                </header>
                <div className="glass-card" style={{ padding: '4rem 2rem', color: 'var(--muted)' }}>
                    Unauthorized access to live rankings detected. Protocol suggests immediate extraction to mission data center.
                </div>
            </div>
        );
    }

    return (
        <div className="leaderboard-page" style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto', background: 'transparent', minHeight: '100vh', color: 'var(--text-main)' }}>
            
            <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
                <motion.div 
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}
                >
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(74, 222, 128, 0.15) 0%, transparent 70%)', filter: 'blur(20px)' }}></div>
                        <img src={logo} alt="SpectraLabs" style={{ width: '100px', height: '100px', borderRadius: '50%', border: '2px solid var(--primary)', position: 'relative', boxShadow: '0 0 20px rgba(74, 222, 128, 0.3)' }} />
                    </div>
                    <h1 className="heading-title" style={{ fontSize: '3.5rem', letterSpacing: '-0.03em', color: 'var(--primary)', marginTop: '1rem' }}>SpectraLabs Rankings</h1>
                </motion.div>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className="glass" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Activity size={14} color={isConnected ? 'var(--success)' : 'var(--error)'} />
                        <span className="text-label" style={{ color: isConnected ? 'var(--success)' : 'var(--error)' }}>
                            {isConnected ? "Live Analytics Synchronized" : "Connection Disrupted"}
                        </span>
                    </div>
                </div>
            </header>

            <div className="glass-card" style={{ overflow: 'hidden', borderRadius: '20px', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'rgba(15, 42, 26, 0.4)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th className="text-label" style={{ padding: '1.5rem 2.5rem' }}>Rank</th>
                            <th className="text-label" style={{ padding: '1.5rem 2.5rem' }}>Participant</th>
                            <th className="text-label" style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>Score</th>
                            <th className="text-label" style={{ padding: '1.5rem 2.5rem' }}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((team, i) => {
                            const isTopThree = i < 3;
                            
                            return (
                                <motion.tr 
                                    key={team.team_name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ 
                                        borderBottom: '1px solid var(--glass-border)',
                                        background: team.is_disqualified 
                                            ? 'rgba(248, 113, 113, 0.03)' 
                                            : isTopThree 
                                                ? 'rgba(74, 222, 128, 0.03)' 
                                                : 'transparent'
                                    }}
                                >
                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                        <div style={{ 
                                            width: '40px', 
                                            height: '40px', 
                                            borderRadius: '12px', 
                                            background: isTopThree ? `rgba(74, 222, 128, 0.1)` : 'var(--bg-elevated)',
                                            border: `1px solid ${isTopThree ? 'var(--primary)' : 'var(--glass-border)'}`,
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            color: isTopThree ? 'var(--primary)' : 'var(--text-muted)',
                                            fontWeight: '800',
                                            fontSize: '15px',
                                            fontFamily: 'var(--font-mono)'
                                        }}>
                                            {i + 1}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                        <div style={{ fontWeight: '700', fontSize: '1.1rem', color: isTopThree ? 'var(--text-main)' : 'var(--text-main)' }}>
                                            {team.team_name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '1px' }}>
                                            UID: {team.id}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2.5rem', textAlign: 'right' }}>
                                        <div style={{ color: 'var(--success)', fontSize: '1.5rem', fontWeight: '800', fontFamily: 'var(--font-mono)' }}>
                                            {team.score}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1.5rem 2.5rem' }}>
                                        {team.is_disqualified ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--error)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>
                                                <AlertTriangle size={14} /> Voided
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: '700', fontSize: '12px', textTransform: 'uppercase' }}>
                                                <ShieldCheck size={14} /> Authorized
                                            </div>
                                        )}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Leaderboard;
