import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Monitor, Plus, RefreshCcw, LogOut, 
    ShieldAlert, Settings, Trash2, Activity, FileText, 
    Download, Database, ShieldCheck, Cpu, Terminal
} from 'lucide-react';

import ContestCreatorModal from '../components/ContestCreatorModal';
import ContestSynopsisModal from '../components/ContestSynopsisModal';
import ObservabilityPanel from '../components/ObservabilityPanel';
import API_BASE_URL from '../apiConfig';
import logoAsset from '../1723176950534.jpeg';

axios.defaults.withCredentials = true;

const AdminPanel = () => {
    const [contests, setContests] = useState([]);
    const [selectedContest, setSelectedContest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynopsisOpen, setIsSynopsisOpen] = useState(false);
    const [teams, setTeams] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [reports, setReports] = useState([]);
    const [sessionStatus, setSessionStatus] = useState('Standby');
    const [error, setError] = useState(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamCode, setNewTeamCode] = useState('');
    const [sortBy, setSortBy] = useState('score');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [systemMetrics, setSystemMetrics] = useState(null);
    const [reviews, setReviews] = useState([]);
    const navigate = useNavigate();

    const fetchReports = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/reports`);
            setReports(res.data);
            localStorage.setItem('spectra_reports', JSON.stringify(res.data));
        } catch (err) {}
    }, []);

    const fetchTeams = useCallback(async (id) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/monitoring/${id}`);
            setTeams(res.data);
            localStorage.setItem(`spectra_teams_${id}`, JSON.stringify(res.data));
        } catch (err) {}
    }, []);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/reviews`);
            setReviews(res.data);
            localStorage.setItem('spectra_reviews', JSON.stringify(res.data));
        } catch (err) {}
    }, []);

    const syncAll = useCallback(async () => {
        setSessionStatus('Uplink Syncing...');
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/contests`, { timeout: 10000 });
            setContests(res.data);
            localStorage.setItem('spectra_contests', JSON.stringify(res.data));
            
            const active = res.data.find(c => c.is_active === true) || res.data[0];
            if (active && (!selectedContest || selectedContest.id !== active.id)) {
                setSelectedContest(active);
                fetchTeams(active.id);
            }
            setSessionStatus('UPLINK_STABLE');
        } catch (err) {
            setSessionStatus('UPLINK_FAILURE');
            const msg = err.response?.data?.error || err.message;
            setError(`[STATION_ERROR]: ${msg}`);
            if (err.response?.status === 401 && !localStorage.getItem('spectra_admin_active')) {
                navigate('/');
            }
        }
    }, [selectedContest, fetchTeams, navigate]);

    useEffect(() => {
        // Cache Hydration
        const cContests = localStorage.getItem('spectra_contests');
        const cReports = localStorage.getItem('spectra_reports');
        if (cContests) {
            const d = JSON.parse(cContests);
            setContests(d);
            const active = d.find(c => c.is_active === true) || d[0];
            if (active) setSelectedContest(active);
        }
        if (cReports) setReports(JSON.parse(cReports));

        syncAll();
        fetchReports();
        fetchReviews();
        const int = setInterval(syncAll, 45000);
        return () => clearInterval(int);
    }, [syncAll, fetchReports, fetchReviews]);

    const handleAction = async (teamId, action, value) => {
        if (!window.confirm(`Execute: ${action.replace('-', '_')}?`)) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams/${teamId}/${action}`, { value });
            if (selectedContest) fetchTeams(selectedContest.id);
        } catch (err) { alert("OPERATION_FAILED"); }
    };

    const handleLogout = () => {
        if (!window.confirm("Terminate administrative session?")) return;
        localStorage.clear();
        navigate('/');
    };

    const createTeam = async () => {
        if (!newTeamName || !newTeamCode || !selectedContest) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams`, { 
                team_name: newTeamName, 
                team_code: newTeamCode, 
                contest_id: selectedContest.id 
            });
            setNewTeamName(''); setNewTeamCode('');
            fetchTeams(selectedContest.id);
        } catch (err) { alert("PROVISIONING_FAILED"); }
    };

    return (
        <div className="admin-layout" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', height: '100vh', background: '#050a06', color: '#fff', overflow: 'hidden' }}>
            <div className="scanline" />

            {/* Side Navigation HUD */}
            <aside style={{ borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '2.5rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '4rem' }}>
                    <div style={{ position: 'relative' }}>
                        <img src={logoAsset} alt="SL" style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px solid var(--primary)' }} />
                        <div style={{ position: 'absolute', inset: '-4px', border: '1px solid var(--primary)', borderRadius: '12px', opacity: 0.2 }} />
                    </div>
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: 'var(--primary)', display: 'block' }}>SPECTRA_HUB</span>
                        <span style={{ fontSize: '8px', fontWeight: '700', letterSpacing: '1px', opacity: 0.4 }}>ADMIN_INTERFACE_V4</span>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: 'auto' }}>
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Arenas" onClick={() => setActiveTab('dashboard')} />
                    <NavItem active={activeTab === 'monitoring'} icon={<Monitor size={18} />} label="Telemetry" onClick={() => setActiveTab('monitoring')} />
                    <NavItem active={activeTab === 'sysmonitor'} icon={<Activity size={18} />} label="SRE_Observability" onClick={() => setActiveTab('sysmonitor')} />
                    <NavItem active={activeTab === 'reports'} icon={<FileText size={18} />} label="Reporting" onClick={() => setActiveTab('reports')} />
                    <NavItem active={activeTab === 'settings'} icon={<Settings size={18} />} label="Configuration" onClick={() => setActiveTab('settings')} />
                </nav>

                <div className="glass" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '18px', background: 'rgba(74, 222, 128, 0.05)', position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? 'var(--error)' : 'var(--primary)', boxShadow: `0 0 10px ${error ? 'var(--error)' : 'var(--primary)'}` }} />
                        <span className="text-label" style={{ fontSize: '9px' }}>Connection HUD</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{sessionStatus}</div>
                    {error && <div style={{ fontSize: '8px', color: 'var(--error)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>{error}</div>}
                </div>

                <button onClick={handleLogout} className="btn-accent" style={{ marginTop: '2rem', borderColor: 'rgba(248, 113, 113, 0.2)', color: 'var(--error)', width: '100%' }}>
                    <LogOut size={16} /> END_SESSION
                </button>
            </aside>

            {/* Main Command Console */}
            <main style={{ padding: '3.5rem 5rem', overflowY: 'auto', position: 'relative' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '3rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <Cpu size={14} color="var(--primary)" />
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '3px' }}>CLUSTER_SUBSYSTEM / {activeTab.toUpperCase()}</span>
                        </div>
                        <h1 style={{ fontSize: '3.8rem', fontWeight: '900', margin: 0, letterSpacing: '-2px' }}>
                            {activeTab === 'dashboard' ? 'Arenas' : activeTab === 'monitoring' ? 'Node Telemetry' : activeTab === 'sysmonitor' ? 'SRE Core' : 'Intelligence Vault'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={syncAll} className="btn-accent" style={{ height: '52px', width: '52px', padding: 0 }}><RefreshCcw size={18} /></button>
                        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0 2.5rem', borderRadius: '50px' }}>+ PROVISION_NEW_MISSION</button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem' }}>
                            {contests.length === 0 && <div className="glass" style={{ padding: '4rem', gridColumn: '1 / -1', textAlign: 'center' }}>No active signals detected.</div>}
                            {contests.map(c => (
                                <div key={c.id} className="terminal-card" style={{ padding: '2.5rem', cursor: 'pointer', borderColor: c.is_active ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => { setSelectedContest(c); fetchTeams(c.id); setActiveTab('monitoring'); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900' }}>{c.name}</h3>
                                            <span style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>UUID: {c._id}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '9px', color: c.is_active ? 'var(--primary)' : '#444', fontWeight: '900', background: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '50px', border: `1px solid ${c.is_active ? 'var(--primary)' : '#333'}` }}>
                                                {c.is_active ? 'UPLINK_ALIVE' : 'STATION_IDLE'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem' }}>
                                        <div><span className="text-label" style={{ fontSize: '9px', display: 'block', marginBottom: '8px' }}>TIMEOUT</span><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{c.duration}m</div></div>
                                        <div><span className="text-label" style={{ fontSize: '9px', display: 'block', marginBottom: '8px' }}>PILOT_NODES</span><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{c.teamsCount || 0}</div></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {!c.is_active && <button onClick={(e) => { e.stopPropagation(); axios.put(`${API_BASE_URL}/api/admin/contests/${c.id}/start`).then(() => syncAll()); }} className="btn-primary" style={{ flex: 1 }}>INITIATE_PULSE</button>}
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMission(c.id); }} className="btn-accent" style={{ color: 'var(--error)', width: '52px' }}><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : activeTab === 'monitoring' && selectedContest ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="terminal-card" style={{ padding: '3.5rem' }}>
                             {/* ... same monitoring logic but with premium styles ... */}
                             <h2 style={{ fontSize: '2.2rem', marginBottom: '3rem' }}>Fleet Overwatch: {selectedContest.name}</h2>
                             <div style={{ background: 'rgba(74, 222, 128, 0.05)', padding: '2.5rem', borderRadius: '24px', marginBottom: '4rem', display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-label" style={{ fontSize: '10px', marginBottom: '12px', display: 'block' }}>TARGET_NODE_CALLSIGN</label>
                                    <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Node Identifier" />
                                </div>
                                <div style={{ width: '220px' }}>
                                    <label className="text-label" style={{ fontSize: '10px', marginBottom: '12px', display: 'block' }}>ACCESS_RESTRICTION_CODE</label>
                                    <input value={newTeamCode} onChange={e => setNewTeamCode(e.target.value)} placeholder="8 chars" maxLength={8} />
                                </div>
                                <button onClick={createTeam} className="btn-primary" style={{ padding: '0 3rem', height: '56px' }}>PROVISION_NODE</button>
                             </div>

                             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th className="text-label" style={{ padding: '1.5rem 1rem' }}>NODE_ALIAS</th>
                                        <th className="text-label" style={{ padding: '1.5rem 1rem' }}>SITREP</th>
                                        <th className="text-label" style={{ padding: '1.5rem 1rem' }}>TELEMETRY</th>
                                        <th className="text-label" style={{ padding: '1.5rem 1rem' }}>SCORE</th>
                                        <th className="text-label" style={{ padding: '1.5rem 1rem', textAlign: 'right' }}>COMMANDS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.sort((a,b)=>b.score - a.score).map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '2rem 1rem' }}>
                                                <div style={{ fontWeight: '900', fontSize: '18px' }}>{t.team_name}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>UUID: {t._id}</div>
                                            </td>
                                            <td style={{ padding: '2rem 1rem' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary)', background: 'rgba(74, 222, 128, 0.1)', padding: '6px 14px', borderRadius: '50px' }}>M_NOD_{t.current_question_index + 1}</span>
                                            </td>
                                            <td style={{ padding: '2rem 1rem' }}>
                                                <ActivityStatus isActive={t.is_tab_active} lastHeartbeat={t.last_heartbeat} />
                                            </td>
                                            <td style={{ padding: '2rem 1rem' }}>
                                                <span style={{ fontSize: '2rem', fontWeight: '900', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{t.score}</span>
                                            </td>
                                            <td style={{ padding: '2rem 1rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                     <button onClick={() => { const v = prompt("Add points:"); if(v) handleAction(t.id, 'add-points', parseInt(v)); }} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74, 222, 128, 0.2)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={18} /></button>
                                                     <button onClick={() => handleAction(t.id, 'disqualify')} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(248, 113, 113, 0.2)', color: 'var(--error)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldAlert size={18} /></button>
                                                     <button onClick={() => handleAction(t.id, 'delete')} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid #333', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </motion.div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '10vh' }}>
                            <Terminal size={60} color="var(--primary)" opacity={0.2} style={{ marginBottom: '2rem' }} />
                            <div className="text-label">INITIALIZING_COMMAND_STREAM...</div>
                        </div>
                    )}
                </AnimatePresence>
            </main>

            <ContestCreatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={syncAll} />
            <ContestSynopsisModal isOpen={isSynopsisOpen} onClose={() => setIsSynopsisOpen(false)} contest={selectedContest} teams={teams} />
        </div>
    );
};

const NavItem = ({ active, icon, label, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', padding: '1.2rem 1.8rem', borderRadius: '16px', cursor: 'pointer', background: active ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'rgba(255,255,255,0.5)', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
        {icon} <span style={{ fontSize: '15px', fontWeight: active ? '900' : '600', letterSpacing: '0.5px' }}>{label}</span>
        {active && <motion.div layoutId="navGlow" style={{ marginLeft: 'auto', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />}
    </div>
);

const ActivityStatus = ({ isActive, lastHeartbeat }) => {
    const isLive = Date.now() - parseInt(lastHeartbeat || 0) < 15000;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <motion.div 
                animate={{ opacity: isLive ? [0.4, 1, 0.4] : 0.4 }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444', boxShadow: isLive ? `0 0 15px ${isActive ? 'var(--primary)' : '#eab308'}` : 'none' }} 
            />
            <span style={{ fontSize: '11px', fontWeight: '900', color: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444' }}>{isLive ? (isActive ? 'UPLINK_PRIMARY' : 'UPLINK_SILENT') : 'NODE_OFFLINE'}</span>
        </div>
    );
};

export default AdminPanel;
