import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, Monitor, RefreshCcw, LogOut, 
    ShieldAlert, Trash2, Activity, Cpu, Shield, AlertTriangle, Edit3, RotateCcw, ChevronDown, Database
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
    const [sessionStatus, setSessionStatus] = useState('Ready');
    const [error, setError] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamCode, setNewTeamCode] = useState('');
    const [editingTeamId, setEditingTeamId] = useState(null);
    const [editNameValue, setEditNameValue] = useState('');
    const [sortKey, setSortKey] = useState('score'); // 'score', 'name', 'progress'
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
        setSessionStatus('Refreshing...');
        setError(null);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/contests`, { timeout: 10000 });
            setContests(res.data);
            
            const active = res.data.find(c => c.is_active === true) || res.data[0];
            if (active && (!selectedContest || selectedContest.id !== active.id)) {
                setSelectedContest(active);
                fetchTeams(active.id);
            } else if (selectedContest) {
                fetchTeams(selectedContest.id);
            }
            fetchMetrics();
            setSessionStatus('Connected');
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.clear();
                return navigate('/');
            }
            setSessionStatus('Offline');
            setError("Connection Error");
        }
    }, [selectedContest, fetchTeams, fetchMetrics, navigate]);

    useEffect(() => {
        syncAll();
        const int = setInterval(syncAll, 30000); // 30 sec poll for live updates
        return () => clearInterval(int);
    }, [syncAll]);

    const handleAction = async (teamId, action, value) => {
        if (!window.confirm(`Execute ${action.replace('-', ' ')}?`)) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams/${teamId}/${action}`, { value });
            syncAll();
        } catch (err) { alert("Action Failed"); }
    };

    const handleResetProgress = async (id) => {
        if (!window.confirm("RESET PROGRESS: This deletes all submissions and makes the hacker start from scratch. Proceed?")) return;
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams/${id}/reset-progress`);
            syncAll();
        } catch (err) { alert("Reset Failed"); }
    };

    const startEditingName = (team) => {
        setEditingTeamId(team.id);
        setEditNameValue(team.team_name);
    };

    const saveName = async (id) => {
        if (!editNameValue) return setEditingTeamId(null);
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams/${id}/update-name`, { value: editNameValue });
            setEditingTeamId(null);
            syncAll();
        } catch (err) { alert("Update Failed"); }
    };

    const sortedTeams = useMemo(() => {
        return [...teams].sort((a, b) => {
            if (sortKey === 'score') return b.score - a.score;
            if (sortKey === 'progress') return b.current_question_index - a.current_question_index;
            if (sortKey === 'name') return a.team_name.localeCompare(b.team_name);
            return 0;
        });
    }, [teams, sortKey]);

    const handleDeleteMission = async (id) => {
        const pass = window.prompt("To delete, enter password: 2809");
        if (pass !== '2809') return alert("Wrong password");
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/contests/${id}`, { data: { password: pass } });
            syncAll();
        } catch (err) { alert("Delete failed"); }
    };

    const handleGlobalReset = async () => {
        const pass = window.prompt("This will DELETE ALL DATA. Enter password: 2809");
        if (pass !== '2809') return alert("Wrong password");
        try {
            await axios.post(`${API_BASE_URL}/api/admin/reset-db`, { password: pass });
            syncAll();
            alert("System Wiped Successfully");
        } catch (err) { alert("Wipe Failed"); }
    };

    const handleLogout = () => {
        if (!window.confirm("Logout from admin?")) return;
        localStorage.clear();
        navigate('/');
    };

    const createTeam = async () => {
        if (!newTeamName || !newTeamCode || !selectedContest) return alert("MISSING_DATA: Name, Password, and Contest selection required.");
        try {
            await axios.post(`${API_BASE_URL}/api/admin/teams`, { 
                team_name: newTeamName, 
                team_code: newTeamCode, 
                contest_id: selectedContest.id 
            });
            setNewTeamName(''); setNewTeamCode('');
            syncAll();
        } catch (err) { alert("Add Hacker Failed"); }
    };

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#050a06', color: '#fff', overflow: 'hidden', fontFamily: 'var(--font-main)' }}>
            <aside style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '2rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(35px)', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3.5rem' }}>
                    <img src={logoAsset} alt="SL" style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--primary)' }} />
                    <div>
                        <span style={{ fontSize: '14px', fontWeight: '900', color: 'var(--primary)', display: 'block' }}>HACKER_ADMIN</span>
                        <span style={{ fontSize: '10px', opacity: 0.4 }}>Control Center</span>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 'auto' }}>
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Contests" onClick={() => setActiveTab('dashboard')} />
                    <NavItem active={activeTab === 'monitoring'} icon={<Monitor size={18} />} label="Hacker Progress" onClick={() => setActiveTab('monitoring')} />
                    <NavItem active={activeTab === 'observability'} icon={<Activity size={18} />} label="Live Stats" onClick={() => setActiveTab('observability')} />
                    <NavItem active={activeTab === 'config'} icon={<Shield size={18} />} label="Reset System" onClick={() => setActiveTab('config')} />
                </nav>

                <div className="glass" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '14px', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: error ? 'var(--error)' : 'var(--primary)' }} />
                        <span style={{ fontSize: '10px', fontWeight: '900' }}>{sessionStatus.toUpperCase()}</span>
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-accent" style={{ marginTop: '1.5rem', color: 'var(--error)', width: '100%', fontSize: '12px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <LogOut size={16} /> Logout
                </button>
            </aside>

            <main style={{ flex: 1, minWidth: 0, padding: '3rem 4rem', overflowY: 'auto', overflowX: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0, color: '#fff' }}>
                            {activeTab === 'dashboard' ? 'Manage Contests' : activeTab === 'observability' ? 'System Health' : activeTab === 'config' ? 'Critical Settings' : 'Hacker Progress Monitor'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={syncAll} className="btn-accent" style={{ height: '40px', width: '40px', padding: 0 }}><RefreshCcw size={18} /></button>
                        {activeTab === 'dashboard' && <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0 1.5rem', borderRadius: '50px', height: '40px', fontSize: '12px' }}>+ New Contest</button>}
                    </div>
                </header>

                <AnimatePresence mode="wait">
                    {activeTab === 'dashboard' && (
                        <motion.div key="arenas" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '2rem' }}>
                            {contests.map(c => (
                                <div key={c.id} className="glass-card" style={{ padding: '2rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <div onClick={() => { setSelectedContest(c); fetchTeams(c.id); setActiveTab('monitoring'); }} style={{ cursor: 'pointer' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '900' }}>{c.name}</h3>
                                            <span style={{ fontSize: '10px', opacity: 0.3 }}>ID: {c._id}</span>
                                        </div>
                                        <div style={{ fontSize: '9px', color: c.is_active ? 'var(--primary)' : '#666', border: `1px solid ${c.is_active ? 'var(--primary)' : '#333'}`, padding: '4px 10px', borderRadius: '50px' }}>
                                            {c.is_active ? 'STARTED' : 'IDLE'}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                                        <div><span style={{ fontSize: '10px', opacity: 0.4 }}>TIME</span><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{c.duration}m</div></div>
                                        <div><span style={{ fontSize: '10px', opacity: 0.4 }}>HACKERS</span><div style={{ fontSize: '16px', fontWeight: 'bold' }}>{c.teamsCount || 0}</div></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {!c.is_active && <button onClick={(e) => { e.stopPropagation(); axios.put(`${API_BASE_URL}/api/admin/contests/${c.id}/start`).then(() => syncAll()); }} className="btn-primary" style={{ flex: 1, height: '38px', fontSize: '11px' }}>Start Contest</button>}
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMission(c.id); }} className="btn-accent" style={{ color: 'var(--error)', width: '38px', height: '38px', padding: 0 }}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {activeTab === 'monitoring' && (
                        <motion.div key="telemetry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '2.5rem' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Progress for: {selectedContest?.name}</h2>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', opacity: 0.4 }}>Sort by:</span>
                                    <div style={{ position: 'relative' }}>
                                        <select value={sortKey} onChange={e => setSortKey(e.target.value)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', padding: '5px 25px 5px 10px', color: '#fff', fontSize: '12px', appearance: 'none', cursor: 'pointer', outline: 'none' }}>
                                            <option value="score">Top Score</option>
                                            <option value="name">Name (A-Z)</option>
                                            <option value="progress">Completion</option>
                                        </select>
                                        <ChevronDown size={12} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                             </div>

                             <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '18px', marginBottom: '3rem', display: 'flex', gap: '1.5rem', alignItems: 'flex-end', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>HACKER NAME</label>
                                    <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Type Name..." style={{ height: '42px', width: '100%', fontSize: '13px' }} />
                                </div>
                                <div style={{ width: '200px' }}>
                                    <label style={{ fontSize: '10px', display: 'block', marginBottom: '8px' }}>PASSWORD (Code)</label>
                                    <input value={newTeamCode} onChange={e => setNewTeamCode(e.target.value)} placeholder="0000" style={{ height: '42px', width: '100%', fontSize: '13px' }} />
                                </div>
                                <button onClick={createTeam} className="btn-primary" style={{ height: '42px', padding: '0 1.5rem', fontSize: '11px' }}>Add Hacker</button>
                             </div>

                             <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '950px' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px' }}>NAME</th>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px' }}>CODE</th>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px' }}>PROGRESS</th>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px' }}>STATUS</th>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px' }}>TAB SWITCHES</th>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px' }}>SCORE</th>
                                            <th style={{ padding: '1rem', opacity: 0.4, fontSize: '11px', textAlign: 'right' }}>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedTeams.map(t => (
                                            <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                                <td style={{ padding: '1.4rem 1rem' }}>
                                                    {editingTeamId === t.id ? (
                                                        <input 
                                                            autoFocus 
                                                            value={editNameValue} 
                                                            onChange={e => setEditNameValue(e.target.value)} 
                                                            onBlur={() => saveName(t.id)}
                                                            onKeyDown={e => e.key === 'Enter' && saveName(t.id)}
                                                            style={{ height: '30px', width: '140px', fontSize: '12px', padding: '0 8px' }}
                                                        />
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <div style={{ fontWeight: '900' }}>{t.team_name}</div>
                                                            <Edit3 size={12} className="text-primary" onClick={() => startEditingName(t)} style={{ cursor: 'pointer', opacity: 0.4 }} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ padding: '1.4rem 1rem' }}>
                                                    <code style={{ background: 'rgba(255,255,255,0.03)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>{t.code}</code>
                                                </td>
                                                <td style={{ padding: '1.4rem 1rem' }}><span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '12px' }}>Question {t.current_question_index + 1}</span></td>
                                                <td style={{ padding: '1.4rem 1rem' }}>
                                                    <ActivityStatus isActive={t.is_tab_active} lastHeartbeat={t.last_heartbeat} />
                                                </td>
                                                <td style={{ padding: '1.4rem 1rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: (t.violations || 0) > 0 ? 'var(--error)' : 'var(--success)' }}>
                                                        <AlertTriangle size={12} />
                                                        <span style={{ fontWeight: '900', fontSize: '13px' }}>{t.violations || 0}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.4rem 1rem', fontWeight: 'bold' }}>{t.score} PTS</td>
                                                <td style={{ padding: '1.4rem 1rem', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                                                        <button title="Reset Hacker Progress" onClick={() => handleResetProgress(t.id)} style={{ color: 'var(--primary)', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.1)', padding: '6px', borderRadius: '5px' }}><RotateCcw size={14} /></button>
                                                        <button title="Disqualify" onClick={() => handleAction(t.id, 'disqualify')} style={{ color: 'var(--error)', background: 'rgba(248, 71, 71, 0.05)', border: '1px solid rgba(248, 71, 71, 0.1)', padding: '6px', borderRadius: '5px' }}><ShieldAlert size={14} /></button>
                                                        <button title="Delete" onClick={() => handleAction(t.id, 'delete')} style={{ opacity: 0.3, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '5px', color: '#fff' }}><Trash2 size={14} /></button>
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
                        <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card" style={{ padding: '3rem', maxWidth: '700px', margin: '0 auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
                                <Shield size={24} color="var(--error)" />
                                <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Dangerous Controls</h2>
                            </div>

                            <div style={{ padding: '2rem', background: 'rgba(248, 113, 113, 0.03)', borderRadius: '15px', border: '1px solid rgba(248, 113, 113, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
                                    <Database size={18} color="var(--error)" />
                                    <h3 style={{ margin: 0, color: 'var(--error)', fontSize: '13px' }}>TOTAL SYSTEM WIPE</h3>
                                </div>
                                <p style={{ fontSize: '12px', marginBottom: '1.5rem', opacity: 0.6 }}>Deleting will remove ALL hackers, contests, hidden logic and scores permanently.</p>
                                <button onClick={handleGlobalReset} className="btn-accent" style={{ background: 'rgba(248, 113, 113, 0.15)', border: '1px solid var(--error)', color: 'var(--error)', fontWeight: '900' }}>
                                    EXECUTE SYSTEM WIPE
                                </button>
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
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderRadius: '10px', cursor: 'pointer', background: active ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'rgba(255,255,255,0.4)', transition: 'all 0.3s' }}>
        {icon} <span style={{ fontSize: '13px', fontWeight: active ? '900' : '650' }}>{label}</span>
    </div>
);

const ActivityStatus = ({ isActive, lastHeartbeat }) => {
    const isLive = Date.now() - parseInt(lastHeartbeat || 0) < 20000;
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444' }} />
            <span style={{ fontSize: '10px', fontWeight: '900', color: isLive ? (isActive ? 'var(--primary)' : '#eab308') : '#444' }}>{isLive ? (isActive ? 'ACTIVE' : 'AWAY') : 'OFFLINE'}</span>
        </div>
    );
};

export default AdminPanel;
