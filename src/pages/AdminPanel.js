import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Monitor, Plus, RefreshCcw, LogOut, 
    ShieldAlert, Settings, Trash2, Activity, FileText, 
    PlusCircle, Cpu, Terminal, Database, Shield
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
    const [sessionStatus, setSessionStatus] = useState('Standby');
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamCode, setNewTeamCode] = useState('');
    const navigate = useNavigate();

    const fetchTeams = useCallback(async (id) => {
        if (!id) return;
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/monitoring/${id}`);
            setTeams(res.data);
        } catch (err) {}
    }, []);

    const fetchMetrics = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/system-metrics`);
            setMetrics(res.data);
        } catch (err) {}
    }, []);

    const syncAll = useCallback(async () => {
        setSessionStatus('Uplink Syncing...');
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/contests`, { timeout: 10000 });
            setContests(res.data);
            
            const active = res.data.find(c => c.is_active === true) || res.data[0];
            if (active && (!selectedContest || selectedContest.id !== active.id)) {
                setSelectedContest(active);
                fetchTeams(active.id);
            }
            fetchMetrics();
            setSessionStatus('UPLINK_STABLE');
        } catch (err) {
            setSessionStatus('UPLINK_FAILURE');
            const msg = err.response?.data?.error || err.message;
            setError(`[STATION_ERROR]: ${msg}`);
            if (err.response?.status === 401) navigate('/');
        }
    }, [selectedContest, fetchTeams, fetchMetrics, navigate]);

    useEffect(() => {
        syncAll();
        const int = setInterval(syncAll, 45000);
        return () => clearInterval(int);
    }, [syncAll]);

    const handleAction = async (teamId, action, value) => {
        if (!window.confirm(`Execute: ${action.replace('-', '_')}?`)) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams/${teamId}/${action}`, { value });
            if (selectedContest) fetchTeams(selectedContest.id);
        } catch (err) { alert("OPERATION_FAILED"); }
    };

    const handleDeleteMission = async (id) => {
        const pass = window.prompt("AUTHORIZED_DELETION: Enter Master Key (Pass: 2809)");
        if (pass !== '2809') return alert("ACCESS_DENIED");
        
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/contests/${id}`, { data: { password: pass } });
            syncAll();
        } catch (err) { alert("DELETION_REFUSED: System integrity lock active."); }
    };

    const handleGlobalReset = async () => {
        const pass = window.prompt("DANGER: This will WIPE ALL DATA. Enter Master Key (Pass: 2809)");
        if (pass !== '2809') return alert("ACCESS_DENIED");
        
        try {
            await axios.post(`${API_BASE_URL}/api/admin/reset-db`, { password: pass });
            syncAll();
            alert("GLOBAL_SYSTEM_WIPE_COMPLETE");
        } catch (err) { alert("WIPE_FAILURE"); }
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
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#050a06', color: '#fff', overflow: 'hidden', fontFamily: 'var(--font-main)' }}>
            <div className="scanline" />

            {/* Sidebar FIXED width */}
            <aside style={{ width: '340px', flexShrink: 0, borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '2.5rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(40px)', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '4rem' }}>
                    <img src={logoAsset} alt="SL" style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px solid var(--primary)' }} />
                    <div style={{ minWidth: 0 }}>
                        <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: 'var(--primary)', display: 'block' }}>SPECTRA_HUB</span>
                        <span style={{ fontSize: '9px', fontWeight: '700', letterSpacing: '1px', opacity: 0.4 }}>ADMIN_STATION</span>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: 'auto' }}>
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Arenas" onClick={() => setActiveTab('dashboard')} />
                    <NavItem active={activeTab === 'monitoring'} icon={<Monitor size={18} />} label="Telemetry" onClick={() => setActiveTab('monitoring')} />
                    <NavItem active={activeTab === 'observability'} icon={<Activity size={18} />} label="Observability" onClick={() => setActiveTab('observability')} />
                    <NavItem active={activeTab === 'config'} icon={<Settings size={18} />} label="Config" onClick={() => setActiveTab('config')} />
                </nav>

                <div className="glass" style={{ marginTop: '2rem', padding: '1.2rem', borderRadius: '18px', background: 'rgba(74, 222, 128, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? 'var(--error)' : 'var(--primary)', boxShadow: `0 0 10px ${error ? 'var(--error)' : 'var(--primary)'}` }} />
                        <span style={{ fontSize: '9px', fontWeight: '900', color: 'var(--primary)' }}>UPLINK_HUD</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'var(--font-mono)', color: '#fff' }}>{sessionStatus}</div>
                </div>

                <button onClick={handleLogout} className="btn-accent" style={{ marginTop: '2rem', borderColor: 'rgba(248, 113, 113, 0.2)', color: 'var(--error)', width: '100%', fontSize: '12px' }}>
                    <LogOut size={16} /> END_SESSION
                </button>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, minWidth: 0, padding: '3.5rem 5rem', overflowY: 'auto', overflowX: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                            <Cpu size={14} color="var(--primary)" />
                            <span className="text-label" style={{ color: 'var(--text-muted)' }}>CLUSTER_SUBSYSTEM / {activeTab.toUpperCase()}</span>
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: 0, letterSpacing: '-0.5px', color: '#fff' }}>
                            {activeTab === 'dashboard' ? 'Arenas' : activeTab === 'observability' ? 'System Observability' : activeTab === 'config' ? 'Cluster Configuration' : 'Node Telemetry'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={syncAll} className="btn-accent" style={{ height: '48px', width: '48px', padding: 0 }}><RefreshCcw size={18} /></button>
                        {activeTab === 'dashboard' && <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0 2rem', borderRadius: '50px', height: '48px', fontSize: '12px' }}>+ PROVISION_NODES</button>}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div key="arenas" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2.5rem' }}>
                            {contests.map(c => (
                                <div key={c.id} className="glass-card" style={{ padding: '2.5rem', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                        <div onClick={() => { setSelectedContest(c); fetchTeams(c.id); setActiveTab('monitoring'); }} style={{ cursor: 'pointer' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{c.name}</h3>
                                            <span style={{ fontSize: '10px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>UUID: {c._id}</span>
                                        </div>
                                        <div style={{ fontSize: '9px', height: 'fit-content', color: c.is_active ? 'var(--primary)' : '#666', fontWeight: '900', border: `1px solid ${c.is_active ? 'var(--primary)' : '#333'}`, padding: '4px 12px', borderRadius: '50px' }}>
                                            {c.is_active ? 'ONLINE' : 'IDLE'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem' }}>
                                        <div><span className="text-label" style={{ opacity: 0.4 }}>DURATION</span><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.duration}m</div></div>
                                        <div><span className="text-label" style={{ opacity: 0.4 }}>NODES</span><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.teamsCount || 0}</div></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {!c.is_active && <button onClick={(e) => { e.stopPropagation(); axios.put(`${API_BASE_URL}/api/admin/contests/${c.id}/start`).then(() => syncAll()); }} className="btn-primary" style={{ flex: 1, height: '42px', fontSize: '11px' }}>TERMINAL_INIT</button>}
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMission(c.id); }} className="btn-accent" style={{ color: 'var(--error)', width: '42px', height: '42px', padding: 0 }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'monitoring' && (
                        <motion.div key="telemetry" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="glass-card" style={{ padding: '3.5rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3.5rem' }}>
                                <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Fleet Monitor: {selectedContest?.name}</h2>
                                <span className="text-label" style={{ color: 'var(--primary)' }}>UPLINK_SYNCHRONIZED</span>
                             </div>

                             <div style={{ background: 'rgba(74, 222, 128, 0.03)', padding: '2.5rem', borderRadius: '24px', marginBottom: '4rem', display: 'flex', gap: '2rem', alignItems: 'flex-end', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                                <div style={{ flex: 1 }}>
                                    <label className="text-label" style={{ display: 'block', marginBottom: '10px' }}>NODE_ALIAS</label>
                                    <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Node Callsign" style={{ height: '48px', width: '100%', fontSize: '13px' }} />
                                </div>
                                <div style={{ width: '220px' }}>
                                    <label className="text-label" style={{ display: 'block', marginBottom: '10px' }}>ACCESS_KEY</label>
                                    <input value={newTeamCode} onChange={e => setNewTeamCode(e.target.value)} placeholder="00000000" maxLength={8} style={{ height: '48px', width: '100%', fontSize: '13px' }} />
                                </div>
                                <button onClick={createTeam} className="btn-primary" style={{ height: '48px', padding: '0 2rem', fontSize: '11px' }}>PROVISION_NODE</button>
                             </div>

                             <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <th className="text-label" style={{ padding: '1.5rem', opacity: 0.4 }}>CALLSIGN</th>
                                            <th className="text-label" style={{ padding: '1.5rem', opacity: 0.4 }}>LOCATION</th>
                                            <th className="text-label" style={{ padding: '1.5rem', opacity: 0.4 }}>UPLINK</th>
                                            <th className="text-label" style={{ padding: '1.5rem', opacity: 0.4 }}>METRICS</th>
                                            <th className="text-label" style={{ padding: '1.5rem', opacity: 0.4, textAlign: 'right' }}>COMMANDS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teams.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '2rem 1.5rem' }}>
                                                    <div style={{ fontWeight: '900', color: '#fff' }}>{t.team_name}</div>
                                                    <div style={{ fontSize: '9px', opacity: 0.3, fontFamily: 'var(--font-mono)' }}>UUID_{t._id.slice(-6).toUpperCase()}</div>
                                                </td>
                                                <td style={{ padding: '2rem 1.5rem' }}><span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>STAGE_{t.current_question_index + 1}</span></td>
                                                <td style={{ padding: '2rem 1.5rem' }}>
                                                    <ActivityStatus isActive={t.is_tab_active} lastHeartbeat={t.last_heartbeat} />
                                                </td>
                                                <td style={{ padding: '2rem 1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{t.score} EXP</td>
                                                <td style={{ padding: '2rem 1.5rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                        <button onClick={() => handleAction(t.id, 'disqualify')} style={{ color: 'var(--error)', background: 'rgba(248, 71, 71, 0.05)', border: '1px solid rgba(248, 71, 71, 0.1)', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}><ShieldAlert size={14} /></button>
                                                        <button onClick={() => handleAction(t.id, 'delete')} style={{ opacity: 0.3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#fff' }}><Trash2 size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                             </div>
                        </motion.div>
                    )}

                    {activeTab === 'observability' && (
                        <motion.div key="obs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <ObservabilityPanel metrics={metrics} onSync={syncAll} />
                        </motion.div>
                    )}

                    {activeTab === 'config' && (
                        <motion.div key="config" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ padding: '4rem', maxWidth: '800px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2rem' }}>
                                <Shield size={32} color="var(--primary)" />
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.8rem' }}>SECURITY_OVERRIDE_CENTER</h2>
                                    <p className="text-muted" style={{ fontSize: '12px', margin: 0 }}>Administrative control for destructive global protocols.</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <div style={{ padding: '2rem', background: 'rgba(248, 113, 113, 0.03)', borderRadius: '18px', border: '1px solid rgba(248, 113, 113, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <Database size={20} color="var(--error)" />
                                        <h3 style={{ margin: 0, color: 'var(--error)', fontSize: '14px', fontWeight: '900' }}>GLOBAL_CORE_RESET</h3>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '12px', marginBottom: '2rem' }}>This action will permanently purge all missions, teams, and submissions from the cluster database. This cannot be undone.</p>
                                    <button onClick={handleGlobalReset} className="btn-accent" style={{ background: 'rgba(248, 113, 113, 0.2)', border: '1px solid var(--error)', color: 'var(--error)', fontWeight: '900', padding: '1rem 2rem' }}>
                                        INITIATE_WIPE_PROTOCOL
                                    </button>
                                </div>

                                <div style={{ padding: '2rem', background: 'rgba(74, 222, 128, 0.03)', borderRadius: '18px', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <Settings size={20} color="var(--primary)" />
                                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900' }}>SYSTEM_MAINTENANCE</h3>
                                    </div>
                                    <p className="text-muted" style={{ fontSize: '12px', marginBottom: '2.5rem' }}>Current system uptime is {metrics?.uptime || '0s'}. Database storage and network tunnels are nominal.</p>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="btn-accent" style={{ fontSize: '11px' }}>REBOOT_WAVETUNNEL</button>
                                        <button className="btn-accent" style={{ fontSize: '11px' }}>FLUSH_CACHE_BUFFERS</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <ContestCreatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={syncAll} />
            <ContestSynopsisModal isOpen={isSynopsisOpen} onClose={() => setIsSynopsisOpen(false)} contest={selectedContest} teams={teams} />
        </div>
    );
};

const NavItem = ({ active, icon, label, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.1rem 1.8rem', borderRadius: '14px', cursor: 'pointer', background: active ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s', border: active ? '1px solid rgba(74, 222, 128, 0.1)' : '1px solid transparent' }}>
        {icon} <span style={{ fontSize: '14px', fontWeight: active ? '900' : '650' }}>{label}</span>
    </div>
);

const ActivityStatus = ({ isActive, lastHeartbeat }) => {
    const isLive = Date.now() - parseInt(lastHeartbeat || 0) < 15000;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444', boxShadow: isLive ? `0 0 10px ${isActive ? 'var(--primary)' : '#eab308'}` : 'none' }} />
            <span style={{ fontSize: '10px', fontWeight: '900', color: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444', fontFamily: 'var(--font-mono)' }}>{isLive ? (isActive ? 'UPLINK_LIVE' : 'IDLE_STATE') : 'STATION_LOST'}</span>
        </div>
    );
};

export default AdminPanel;
