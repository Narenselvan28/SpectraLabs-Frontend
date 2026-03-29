import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Activity, ShieldAlert, Zap, Database, History, RefreshCw, ShieldCheck } from 'lucide-react';
import EmergencyConsole from './EmergencyConsole';

import API_BASE_URL from '../apiConfig';

const ObservabilityPanel = ({ metrics, onSync }) => {
    const [history, setHistory] = useState([]);
    const [health, setHealth] = useState({ db: null, sys: null });
    const [dbStats, setDbStats] = useState(null);
    const [networkStats, setNetworkStats] = useState(null);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        setHistory(prev => {
            const now = new Date().toLocaleTimeString().split(' ')[0];
            return [...prev, { 
                time: now, 
                latency: metrics?.responseTime?.p95 || 0, 
                rps: metrics?.currentRPS || 0,
                activeUsers: metrics?.activeUsers || 0 
            }].slice(-30);
        });
    }, [metrics]);

    const fetchData = async () => {
        try {
            const [db, sys, dbMetric, netMetric, feedMetric] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/admin/health/db`),
                axios.get(`${API_BASE_URL}/api/admin/health/system`),
                axios.get(`${API_BASE_URL}/api/admin/analytics/db`),
                axios.get(`${API_BASE_URL}/api/admin/analytics/network`),
                axios.get(`${API_BASE_URL}/api/admin/analytics/feedback`)
            ]);
            setHealth({ db: db.data, sys: sys.data });
            setDbStats(dbMetric.data);
            setNetworkStats(netMetric.data);
            setFeedback(feedMetric.data);
        } catch (e) {
            console.error("Analytics Poll Failure");
        }
    };

    useEffect(() => { 
        fetchData(); 
        const int = setInterval(fetchData, 3000);
        return () => clearInterval(int);
    }, []);

    const alertLevel = useMemo(() => {
        if (!metrics) return 'safe';
        if (metrics.responseTime?.p95 > 5000 || metrics.errorRate > 10) return 'critical';
        if (metrics.responseTime?.p95 > 2000 || metrics.errorRate > 5) return 'warning';
        return 'safe';
    }, [metrics]);

    const networkCondition = useMemo(() => {
        if (!networkStats) return { label: 'STABLE', color: 'var(--success)' };
        const slowPct = (networkStats.distribution.slow / networkStats.totalTracked) * 100;
        if (slowPct > 30) return { label: 'UNSTABLE', color: 'var(--error)' };
        if (slowPct > 10) return { label: 'FLUCTUATING', color: 'var(--accent)' };
        return { label: 'STABLE', color: 'var(--success)' };
    }, [networkStats]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '1rem' }}>
            
            {/* Top Stat Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                <div className={"glass alert-card-" + alertLevel} style={{ padding: '1.5rem', borderRadius: '22px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1.5rem', background: alertLevel === 'critical' ? 'rgba(255,50,50,0.1)' : 'transparent' }}>
                    <ShieldAlert size={40} color={alertLevel === 'critical' ? 'red' : alertLevel === 'warning' ? 'orange' : 'var(--primary)'} />
                    <div>
                        <p className="text-label" style={{ margin: 0 }}>PLATFORM_STABILITY</p>
                        <h2 style={{ margin: 0, color: alertLevel === 'critical' ? 'red' : 'inherit' }}>{alertLevel.toUpperCase()}</h2>
                        <p style={{ margin: 0, fontSize: '10px' }}>ERROR_RATE: {metrics?.errorRate}%</p>
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '22px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Activity size={32} color={networkCondition.color} />
                    <div>
                        <p className="text-label" style={{ margin: 0 }}>NETWORK_CONDITION</p>
                        <h2 style={{ margin: 0, color: networkCondition.color }}>{networkCondition.label}</h2>
                        <p style={{ margin: 0, fontSize: '10px' }}>AVG_LATENCY: {networkStats?.avgLatency}ms</p>
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '22px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Database className="text-primary" size={32} />
                    <div>
                        <p className="text-label" style={{ margin: 0 }}>DB_STORAGE</p>
                        <h2 style={{ margin: 0 }}>{dbStats?.dataSize} MB</h2>
                        <p style={{ margin: 0, fontSize: '10px' }}>OBJECTS: {dbStats?.objects}</p>
                    </div>
                </div>

                <div className="glass" style={{ padding: '1.5rem', borderRadius: '22px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <RefreshCw className={health.sys?.isColdStart ? 'animate-spin' : ''} size={32} />
                    <div><p className="text-label" style={{ margin: 0 }}>INSTANCE</p><h2 style={{ margin: 0 }}>{health.sys?.instanceId || 'Spectra-01'}</h2><p style={{ margin: 0, fontSize: '10px' }}>UPTIME: {health.sys?.uptime}</p></div>
                </div>
            </div>

            <EmergencyConsole onSync={onSync} />

            {/* Network & Trends Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: '22px', height: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0 }}><Zap size={18} color="var(--accent)" /> LIVE_ACTIVITY_ACTIVITY</h4>
                        <div style={{ display: 'flex', gap: '15px', fontSize: '10px' }}>
                            <span style={{ color: 'var(--primary)' }}>● SUBMISSIONS</span>
                            <span style={{ color: '#00d2ff' }}>● ACTIVE_PLAYERS</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={history}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="time" hide />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid var(--primary)' }} />
                            <Area type="monotone" dataKey="rps" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} strokeWidth={2} />
                            <Area type="monotone" dataKey="activeUsers" stroke="#00d2ff" fill="#00d2ff" fillOpacity={0.05} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass" style={{ padding: '2rem', borderRadius: '22px', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ marginBottom: '1.5rem' }}><RefreshCw size={18} /> USER_NETWORK_OVERVIEW</h4>
                    {networkStats?.slowUsers?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {networkStats.slowUsers.map((u, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.8rem', background: 'rgba(255,50,50,0.05)', borderRadius: '12px', borderLeft: '3px solid red' }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>{u.team_name}</p>
                                        <p style={{ margin: 0, fontSize: '10px', opacity: 0.5 }}>LATENCY: CRITICAL</p>
                                    </div>
                                    <span style={{ color: 'red', fontWeight: '900', fontSize: '14px' }}>{u.latency}ms</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: 0.3 }}>
                            <ShieldAlert size={48} />
                            <p style={{ fontSize: '12px', marginTop: '1rem' }}>NO_NETWORK_ANOMALIES</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback & Insights Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="glass" style={{ padding: '2rem', borderRadius: '22px' }}>
                    <h4 style={{ marginBottom: '1.5rem' }}><History size={18} /> SRE_INSIGHT_ENGINE</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {metrics?.errorRate > 0 && <p style={{ margin: 0, color: 'var(--error)', fontSize: '13px' }}>⚠️ {metrics.errorRate}% error rate detected. Check worker thread logs.</p>}
                        {networkStats?.distribution.slow > 0 && <p style={{ margin: 0, color: 'var(--accent)', fontSize: '13px' }}>⚡ {networkStats.distribution.slow} users experiencing network degradation (&gt;300ms).</p>}
                        {dbStats?.submissionsCount > 1000 && <p style={{ margin: 0, color: 'var(--primary)', fontSize: '13px' }}>📦 Submission buffer growing. Database storage healthy at {dbStats.dataSize}MB.</p>}
                        {metrics?.responseTime.p95 > 1000 && <p style={{ margin: 0, color: 'var(--error)', fontSize: '13px' }}>🚦 Latency spike detected. P95 has crossed 1s threshold.</p>}
                        <p style={{ margin: 0, color: 'var(--primary)', fontSize: '13px', opacity: 0.5 }}>✓ All system heartbeats operational.</p>
                    </div>
                </div>

                <div className="glass" style={{ padding: '2rem', borderRadius: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0 }}><ShieldCheck size={18} color="var(--success)" /> USER_FEEDBACK_SUMMARY</h4>
                        <span style={{ fontSize: '10px', color: 'var(--muted)' }}>TOTAL: {feedback?.summary?.totalFeedback || 0}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '9px', color: 'var(--muted)', margin: 0 }}>UI_EXP</p>
                            <h3 style={{ margin: '5px 0', color: 'var(--primary)' }}>{feedback?.summary?.avgUI?.toFixed(1) || '0.0'}</h3>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '9px', color: 'var(--muted)', margin: 0 }}>PERF</p>
                            <h3 style={{ margin: '5px 0', color: 'var(--primary)' }}>{feedback?.summary?.avgPerf?.toFixed(1) || '0.0'}</h3>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                            <p style={{ fontSize: '9px', color: 'var(--muted)', margin: 0 }}>OVERALL</p>
                            <h3 style={{ margin: '5px 0', color: 'var(--primary)' }}>{feedback?.summary?.avgOverall?.toFixed(1) || '0.0'}</h3>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '120px', overflowY: 'auto' }}>
                        {feedback?.recentFeedback?.map((f, i) => (
                            <div key={i} style={{ fontSize: '11px', padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: 'var(--primary)' }}>"</span>{f.feedback || 'No comment provided'}<span style={{ color: 'var(--primary)' }}>"</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ObservabilityPanel;
