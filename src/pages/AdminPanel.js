import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Monitor, Plus, RefreshCcw, LogOut, 
    ShieldAlert, Settings, Trash2, Activity, FileText, 
    PlusCircle, Cpu, Terminal
} from 'lucide-react';

import ContestCreatorModal from '../components/ContestCreatorModal';
import ContestSynopsisModal from '../components/ContestSynopsisModal';
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
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamCode, setNewTeamCode] = useState('');
    const navigate = useNavigate();

    const fetchTeams = useCallback(async (id) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/monitoring/${id}`);
            setTeams(res.data);
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
            setSessionStatus('UPLINK_STABLE');
        } catch (err) {
            setSessionStatus('UPLINK_FAILURE');
            const msg = err.response?.data?.error || err.message;
            setError(`[STATION_ERROR]: ${msg}`);
            if (err.response?.status === 401) navigate('/');
        }
    }, [selectedContest, fetchTeams, navigate]);

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
        if (!window.confirm("AUTHORIZED_DELETION: Proceed with caution.")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/contests/${id}`);
            syncAll();
        } catch (err) { alert("DELETION_REFUSED"); }
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
            <aside style={{ borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', padding: '2.5rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '4rem' }}>
                    <img src={logoAsset} alt="SL" style={{ width: '42px', height: '42px', borderRadius: '10px', border: '1px solid var(--primary)' }} />
                    <div>
                        <span style={{ fontSize: '12px', fontWeight: '900', letterSpacing: '3px', color: 'var(--primary)', display: 'block' }}>SPECTRA_HUB</span>
                        <span style={{ fontSize: '8px', fontWeight: '700', letterSpacing: '1px', opacity: 0.4 }}>ADMIN_STATION</span>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: 'auto' }}>
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Arenas" onClick={() => setActiveTab('dashboard')} />
                    <NavItem active={activeTab === 'monitoring'} icon={<Monitor size={18} />} label="Telemetry" onClick={() => setActiveTab('monitoring')} />
                    <NavItem active={activeTab} icon={<Activity size={18} />} label="Observability" onClick={() => setActiveTab('monitoring')} />
                    <NavItem active={activeTab} icon={<Settings size={18} />} label="Config" onClick={() => setActiveTab('dashboard')} />
                </nav>

                <div className="glass" style={{ marginTop: '2rem', padding: '1.5rem', borderRadius: '18px', background: 'rgba(74, 222, 128, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? 'var(--error)' : 'var(--primary)', boxShadow: `0 0 10px ${error ? 'var(--error)' : 'var(--primary)'}` }} />
                        <span style={{ fontSize: '9px', fontWeight: '900' }}>UPLINK_HUD</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{sessionStatus}</div>
                    {error && <div style={{ fontSize: '8px', color: 'var(--error)', marginTop: '8px' }}>{error}</div>}
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
                            {activeTab === 'dashboard' ? 'Arenas' : 'Node Telemetry'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={syncAll} className="btn-accent" style={{ height: '52px', width: '52px', padding: 0 }}><RefreshCcw size={18} /></button>
                        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0 2.5rem', borderRadius: '50px' }}>+ PROVISION_NODE</button>
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' ? (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '2.5rem' }}>
                            {contests.map(c => (
                                <div key={c.id} className="terminal-card" style={{ padding: '2.5rem', cursor: 'pointer', borderColor: c.is_active ? 'var(--primary)' : 'rgba(255,255,255,0.05)' }} onClick={() => { setSelectedContest(c); fetchTeams(c.id); setActiveTab('monitoring'); }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900' }}>{c.name}</h3>
                                            <span style={{ fontSize: '9px', opacity: 0.4, fontFamily: 'var(--font-mono)' }}>UUID: {c._id}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '9px', color: c.is_active ? 'var(--primary)' : '#444', fontWeight: '900', background: 'rgba(0,0,0,0.3)', padding: '5px 12px', borderRadius: '50px', border: `1px solid ${c.is_active ? 'var(--primary)' : '#333'}` }}>
                                                {c.is_active ? 'ONLINE' : 'IDLE'}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '3rem', marginBottom: '3rem' }}>
                                        <div><span style={{ fontSize: '9px', display: 'block', opacity: 0.4 }}>DURATION</span><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{c.duration}m</div></div>
                                        <div><span style={{ fontSize: '9px', display: 'block', opacity: 0.4 }}>NODES</span><div style={{ fontSize: '20px', fontWeight: 'bold' }}>{c.teamsCount || 0}</div></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {!c.is_active && <button onClick={(e) => { e.stopPropagation(); axios.put(`${API_BASE_URL}/api/admin/contests/${c.id}/start`).then(() => syncAll()); }} className="btn-primary" style={{ flex: 1 }}>INITIATE</button>}
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMission(c.id); }} className="btn-accent" style={{ color: 'var(--error)', width: '52px' }}><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="terminal-card" style={{ padding: '3.5rem' }}>
                             <h2 style={{ fontSize: '2.2rem', marginBottom: '3rem' }}>Fleet Monitor: {selectedContest?.name}</h2>
                             <div style={{ background: 'rgba(74, 222, 128, 0.05)', padding: '2.5rem', borderRadius: '24px', marginBottom: '4rem', display: 'flex', gap: '2rem', alignItems: 'flex-end' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, display: 'block', marginBottom: '10px' }}>NODE_ALIAS</label>
                                    <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Target Name" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '8px' }} />
                                </div>
                                <div style={{ width: '220px' }}>
                                    <label style={{ fontSize: '10px', opacity: 0.4, display: 'block', marginBottom: '10px' }}>ACCESS_CODE</label>
                                    <input value={newTeamCode} onChange={e => setNewTeamCode(e.target.value)} placeholder="8 chars" maxLength={8} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '8px' }} />
                                </div>
                                <button onClick={createTeam} className="btn-primary" style={{ height: '52px', padding: '0 2rem' }}>PROVISION</button>
                             </div>

                             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '1.5rem', opacity: 0.4 }}>CALLSIGN</th>
                                        <th style={{ padding: '1.5rem', opacity: 0.4 }}>SITREP</th>
                                        <th style={{ padding: '1.5rem', opacity: 0.4 }}>STATUS</th>
                                        <th style={{ padding: '1.5rem', opacity: 0.4 }}>SCORE</th>
                                        <th style={{ padding: '1.5rem', opacity: 0.4, textAlign: 'right' }}>COMMANDS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map(t => (
                                        <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <td style={{ padding: '2rem 1.5rem' }}>
                                                <div style={{ fontWeight: '900' }}>{t.team_name}</div>
                                                <div style={{ fontSize: '10px', opacity: 0.4 }}>UUID: {t._id}</div>
                                            </td>
                                            <td style={{ padding: '2rem 1.5rem' }}><span style={{ color: 'var(--primary)' }}>STAGE_{t.current_question_index + 1}</span></td>
                                            <td style={{ padding: '2rem 1.5rem' }}>
                                                <ActivityStatus isActive={t.is_tab_active} lastHeartbeat={t.last_heartbeat} />
                                            </td>
                                            <td style={{ padding: '2rem 1.5rem' }}>{t.score}</td>
                                            <td style={{ padding: '2rem 1.5rem', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                                     <button onClick={() => handleAction(t.id, 'disqualify')} style={{ color: 'var(--error)', background: 'none', border: 'none', cursor: 'pointer' }}><ShieldAlert size={18} /></button>
                                                     <button onClick={() => handleAction(t.id, 'delete')} style={{ opacity: 0.3, background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                             </table>
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {!contests.length && activeTab === 'dashboard' && (
                    <div style={{ textAlign: 'center', marginTop: '10vh', opacity: 0.2 }}>
                        <Terminal size={80} style={{ marginBottom: '2rem' }} />
                        <div style={{ fontWeight: '900', letterSpacing: '4px' }}>NO_MISSIONS_COMMISSIONED</div>
                    </div>
                )}
            </main>

            <ContestCreatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={syncAll} />
            <ContestSynopsisModal isOpen={isSynopsisOpen} onClose={() => setIsSynopsisOpen(false)} contest={selectedContest} teams={teams} />
        </div>
    );
};

const NavItem = ({ active, icon, label, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', padding: '1.2rem 1.8rem', borderRadius: '16px', cursor: 'pointer', background: active ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'rgba(255,255,255,0.5)', transition: 'all 0.3s' }}>
        {icon} <span style={{ fontSize: '15px', fontWeight: active ? '900' : '600' }}>{label}</span>
    </div>
);

const ActivityStatus = ({ isActive, lastHeartbeat }) => {
    const isLive = Date.now() - parseInt(lastHeartbeat || 0) < 15000;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444' }} />
            <span style={{ fontSize: '10px', fontWeight: '900', color: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444' }}>{isLive ? (isActive ? 'CONNECTED' : 'BG_TASK') : 'LOST'}</span>
        </div>
    );
};

export default AdminPanel;
