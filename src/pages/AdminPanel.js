import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import ContestCreatorModal from '../components/ContestCreatorModal';
import ContestSynopsisModal from '../components/ContestSynopsisModal';
import { getSocket } from '../hooks/useSocket';
import API_BASE_URL from '../apiConfig';
import { motion, AnimatePresence } from 'framer-motion';
import ObservabilityPanel from '../components/ObservabilityPanel';
import logoAsset from '../1723176950534.jpeg';
import { 
    LayoutDashboard, 
    Monitor, 
    Plus, 
    RefreshCcw, 
    LogOut, 
    ShieldAlert, 
    Settings,
    Trash2,
    Flag,
    PlusCircle,
    User,
    Lock,
    DatabaseZap,
    AlertTriangle,
    Activity,
    FileText,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    const [newTeamName, setNewTeamName] = useState('');
    const [newTeamCode, setNewTeamCode] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [sortBy, setSortBy] = useState('score');
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [systemMetrics, setSystemMetrics] = useState(null);
    const [reviews, setReviews] = useState([]);
    const syncInterval = useRef(null);
    const metricsInterval = useRef(null);
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

    const syncAll = useCallback(async (isInitial = false) => {
        setSessionStatus('Uplink Syncing...');
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/contests`);
            setContests(res.data);
            localStorage.setItem('spectra_contests', JSON.stringify(res.data));
            
            const active = res.data.find(c => c.is_active === true) || res.data[0];
            if (active && (!selectedContest || selectedContest.id !== active.id)) {
                setSelectedContest(active);
                fetchTeams(active.id);
            }
            setSessionStatus('Session Authenticated');
        } catch (err) {
            if (err.response?.status === 401) {
                // Only redirect if we don't have a cached override
                if (!localStorage.getItem('spectra_admin_active')) {
                    navigate('/');
                }
            }
        }
    }, [selectedContest, fetchTeams, navigate]);

    // PRE-MOUNT INITIALIZATION (Minimize useEffect chain)
    useEffect(() => {
        // Hydrate from cache immediately to prevent home-redirect on refresh
        const cContests = localStorage.getItem('spectra_contests');
        const cReports = localStorage.getItem('spectra_reports');
        const cReviews = localStorage.getItem('spectra_reviews');
        
        if (cContests) {
            const d = JSON.parse(cContests);
            setContests(d);
            const active = d.find(c => c.is_active === true) || d[0];
            if (active) {
                setSelectedContest(active);
                const cTeams = localStorage.getItem(`spectra_teams_${active.id}`);
                if (cTeams) setTeams(JSON.parse(cTeams));
            }
        }
        if (cReports) setReports(JSON.parse(cReports));
        if (cReviews) setReviews(JSON.parse(cReviews));

        syncAll(true);
        fetchReports();
        fetchReviews();

        // Reduce intervals or remove to solve 'refresh' behavior
        // const metricsInt = setInterval(fetchTelemetry, 10000); 
        // return () => clearInterval(metricsInt);
    }, []); // Only once on mount

    const handleAction = async (teamId, action, value) => {
        let msg = `Confirm action: ${action.replace('-', ' ')}?`;
        if (action === 'reset-score') msg = "CRITICAL: Are you absolutely sure you want to PERMANENTLY WIPE this participant's score?";
        if (!window.confirm(msg)) return;
        try {
            const url = `${API_BASE_URL}/api/admin/teams/${teamId}/${action}`;
            await axios.post(url, { value }, { withCredentials: true });
            if (selectedContest) fetchTeams(selectedContest.id);
        } catch (err) { alert("Operation failed."); }
    };

    const handleLogout = () => {
        if (!window.confirm("Disconnect from administrative interface?")) return;
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
            }, { withCredentials: true });
            setNewTeamName(''); setNewTeamCode('');
            fetchTeams(selectedContest.id);
        } catch (err) {}
    };

    // Removed redundant useEffect to prevent unnecessary polling-style refreshes

    const renameTeam = async (teamId, currentName) => {
        const newName = prompt("Enter new team name:", currentName);
        if (newName && newName !== currentName) {
            try {
                await axios.post(`${API_BASE_URL}/api/admin/teams/${teamId}/update-name`, { value: newName });
                if (selectedContest) fetchTeams(selectedContest.id);
            } catch (err) { alert("Rename failed."); }
        }
    };

    const sortedTeams = [...teams].sort((a, b) => {
        if (sortBy === 'score') return b.score - a.score;
        return a.team_name.localeCompare(b.team_name);
    });

    const handleDeleteMission = async (id) => {
        const pass = prompt("AUTHORIZED_USER_RESTRICTION_CODE:");
        if (!pass) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/admin/contests/${id}`, { data: { password: pass } });
            syncAll();
        } catch (err) {
            alert("DELETION_REFUSED: UNEXPECTED_CREDENTIALS");
        }
    };

    return (
        <div className="admin-container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '100vh', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
            {/* Sidebar */}
            <aside className="glass" style={{ margin: '1rem', borderRadius: '24px', padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2.5rem', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={logoAsset} alt="SL" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                    <div>
                        <h2 className="heading-title" style={{ fontSize: '18px', color: 'var(--primary)', letterSpacing: '2px' }}>SPECTRALABS</h2>
                        <p className="text-label" style={{ margin: 0, fontSize: '9px', opacity: 0.5 }}>MISSION_CONTROL_CENTER</p>
                    </div>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <NavItem active={activeTab === 'dashboard'} icon={<LayoutDashboard size={18} />} label="Missions" onClick={() => setActiveTab('dashboard')} />
                    <NavItem active={activeTab === 'monitoring'} icon={<Monitor size={18} />} label="Active Monitor" onClick={() => setActiveTab('monitoring')} />
                    <NavItem active={activeTab === 'sysmonitor'} icon={<Activity size={18} />} label="Observability" onClick={() => setActiveTab('sysmonitor')} />
                    <NavItem active={activeTab === 'reviews'} icon={<ShieldAlert size={18} />} label="Mission Insights" onClick={() => setActiveTab('reviews')} />
                    <NavItem active={activeTab === 'reports'} icon={<FileText size={18} />} label="Intelligence Reports" onClick={() => setActiveTab('reports')} />
                    <NavItem active={activeTab === 'settings'} icon={<Settings size={18} />} label="System Config" onClick={() => setActiveTab('settings')} />
                </nav>

                <div className="glass" style={{ marginTop: 'auto', padding: '1.2rem', borderRadius: '16px', background: 'rgba(74, 222, 128, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }} className="animate-pulse" />
                        <span className="text-label" style={{ fontSize: '10px' }}>Uplink Status</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800' }}>{sessionStatus}</div>
                </div>

                <button onClick={handleLogout} className="btn-accent" style={{ color: 'var(--error)', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: '1px solid rgba(248, 113, 113, 0.1)' }}>
                    <LogOut size={16} /> SIGN_OFF
                </button>
            </aside>

            {/* Main Area */}
            <main style={{ padding: '3rem 5rem', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '4rem' }}>
                    <div>
                        <div style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '900', letterSpacing: '4px', marginBottom: '0.8rem' }}>SYSTEM_SUBSYSTEM / {activeTab.toUpperCase()}</div>
                        <h1 className="heading-title" style={{ fontSize: '3rem', margin: 0 }}>
                            {activeTab === 'dashboard' ? 'Missions' : activeTab === 'monitoring' ? 'Mission Monitor' : activeTab === 'sysmonitor' ? 'SRE Observability' : activeTab === 'reports' ? 'Reporting Vault' : 'System Architecture'}
                        </h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={syncAll} className="btn-accent"><RefreshCcw size={18} /></button>
                        <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '0.8rem 1.8rem' }}>+ Provision New Mission</button>
                    </div>
                </header>

                {activeTab === 'reviews' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '3rem' }}>
                        <h2 style={{ marginBottom: '2rem' }}>Mission Insights: Participant Debriefings</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '2rem' }}>
                            {reviews.map((r, i) => (
                                <div key={i} className="glass" style={{ padding: '2rem', borderLeft: '4px solid var(--primary)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                        <div style={{ fontWeight: '900', fontSize: '18px' }}>{r.team_id?.team_name || 'Anonymous Node'}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.5 }}>{new Date(r.createdAt).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                        <div><label className="text-label" style={{ fontSize: '9px' }}>UI</label><div style={{ color: 'var(--primary)' }}>{r.ui_rating}/5</div></div>
                                        <div><label className="text-label" style={{ fontSize: '9px' }}>PERF</label><div style={{ color: 'var(--accent)' }}>{r.performance_rating}/5</div></div>
                                        <div><label className="text-label" style={{ fontSize: '9px' }}>GOAL</label><div style={{ color: 'var(--success)' }}>{r.overall_rating}/5</div></div>
                                    </div>
                                    <div>
                                        <label className="text-label" style={{ fontSize: '9px' }}>ANOMALY_LOG</label>
                                        <p style={{ fontSize: '13px', margin: '5px 0 0 0', opacity: 0.8, fontStyle: 'italic' }}>"{r.feedback || 'No entries in log.'}"</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeTab === 'reports' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <ReportingCenter 
                            contests={contests} 
                            reports={reports} 
                            onGenerate={async (id) => {
                                try {
                                    await axios.post(`${API_BASE_URL}/api/admin/reports/generate`, { contest_id: id });
                                    alert("REPORT_GENERATION_INITIATED");
                                    fetchReports();
                                } catch (e) { alert("HANDSHAKE_FAILED"); }
                            }} 
                            onDownload={(id) => window.open(`${API_BASE_URL}/api/admin/reports/${id}/download`)} 
                        />
                    </motion.div>
                )}

                {activeTab === 'dashboard' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                        {contests.map(c => (
                            <div key={c.id} className="glass-card" style={{ padding: '2rem', cursor: 'pointer', borderTop: `4px solid ${c.is_active ? 'var(--primary)' : 'transparent'}` }} onClick={() => { setSelectedContest(c); fetchTeams(c.id); setActiveTab('monitoring'); }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.4rem' }}>{c.name}</h3>
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>UUID: {c._id}</span>
                                    </div>
                                    <span style={{ fontSize: '10px', color: c.is_active ? 'var(--primary)' : '#555', fontWeight: '900', background: c.is_active ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: '20px', border: '1px solid currentColor' }}>
                                        {c.is_active ? 'ONLINE' : 'STANDBY'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '3rem', marginBottom: '2.5rem' }}>
                                    <div><label className="text-label" style={{ fontSize: '9px' }}>LIMIT</label><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.duration}m</div></div>
                                    <div><label className="text-label" style={{ fontSize: '9px' }}>FLEET</label><div style={{ fontSize: '18px', fontWeight: 'bold' }}>{c.teamsCount || 0} nodes</div></div>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    {!c.is_active && <button onClick={(e) => { e.stopPropagation(); axios.put(`${API_BASE_URL}/api/admin/contests/${c.id}/start`, {}, { withCredentials: true }).then(() => syncAll()); }} className="btn-primary" style={{ flex: 1 }}>INITIATE</button>}
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteMission(c.id); }} className="btn-accent" style={{ color: 'var(--error)' }}><Trash2 size={18} /></button>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'monitoring' && selectedContest && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px' }}>Fleet Overwatch: {selectedContest.name}</h2>
                                <p className="text-muted" style={{ fontSize: '13px' }}>Real-time telemetry from all connected participant nodes.</p>
                            </div>
                            <div className="glass" style={{ padding: '5px', display: 'flex', gap: '5px', borderRadius: '12px' }}>
                                <button onClick={() => setSortBy('score')} className={sortBy === 'score' ? 'btn-primary' : 'btn-accent'} style={{ fontSize: '11px', padding: '6px 14px' }}>Rank</button>
                                <button onClick={() => setSortBy('name')} className={sortBy === 'name' ? 'btn-primary' : 'btn-accent'} style={{ fontSize: '11px', padding: '6px 14px' }}>Alpha</button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3.5rem', background: 'rgba(74, 222, 128, 0.03)', padding: '2rem', borderRadius: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label className="text-label" style={{ fontSize: '9px', marginBottom: '10px', display: 'block' }}>IDENTITY_SEED</label>
                                <input value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="Team Designation" style={{ width: '100%' }} />
                            </div>
                            <div style={{ width: '180px' }}>
                                <label className="text-label" style={{ fontSize: '9px', marginBottom: '10px', display: 'block' }}>ACCESS_KEY</label>
                                <input value={newTeamCode} onChange={e => setNewTeamCode(e.target.value)} placeholder="8-Char Key" maxLength={8} style={{ width: '100%' }} />
                            </div>
                            <button onClick={createTeam} className="btn-primary" style={{ alignSelf: 'flex-end', height: '52px', padding: '0 2rem' }}><PlusCircle size={20} /> Provision Node</button>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                                    <th className="text-label" style={{ padding: '1.2rem' }}>Participant</th>
                                    <th className="text-label" style={{ padding: '1.2rem' }}>Progress</th>
                                    <th className="text-label" style={{ padding: '1.2rem' }}>Telemetry</th>
                                    <th className="text-label" style={{ padding: '1.2rem' }}>Integrity</th>
                                    <th className="text-label" style={{ padding: '1.2rem' }}>Score</th>
                                    <th className="text-label" style={{ padding: '1.2rem', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedTeams.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid var(--glass-border)', background: t.is_disqualified ? 'rgba(248, 113, 113, 0.03)' : 'transparent' }}>
                                        <td style={{ padding: '1.5rem 1.2rem' }}>
                                            <div onClick={() => renameTeam(t.id, t.team_name)} style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text-main)', cursor: 'pointer' }}>{t.team_name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ID: {t._id} &bull; CODE: {t.code}</div>
                                        </td>
                                        <td style={{ padding: '1.5rem 1.2rem' }}>
                                            <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--primary)', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 10px', borderRadius: '8px' }}>STAGE_{t.current_question_index + 1}</span>
                                        </td>
                                        <td style={{ padding: '1.5rem 1.2rem' }}>
                                            <ActivityStatus isActive={t.is_tab_active} lastHeartbeat={t.last_heartbeat} />
                                        </td>
                                        <td style={{ padding: '1.5rem 1.2rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {[...Array(3)].map((_, i) => (
                                                        <div key={i} style={{ width: '25px', height: '5px', borderRadius: '4px', background: i < t.violations ? 'var(--error)' : 'var(--glass-border)' }} />
                                                    ))}
                                                </div>
                                                <span style={{ fontSize: '11px', color: t.violations > 0 ? 'var(--error)' : 'var(--text-muted)' }}>[{t.violations}]</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.5rem 1.2rem' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{t.score}</span>
                                        </td>
                                        <td style={{ padding: '1.5rem 1.2rem', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
                                                <ActionButton icon={<Plus size={14} />} color="var(--primary)" tooltip="Add Points" onClick={() => { const v = prompt("Add points:"); if(v) handleAction(t.id, 'add-points', parseInt(v)); }} />
                                                <ActionButton icon={<RefreshCcw size={14} />} color="var(--accent)" tooltip="Reset Score" onClick={() => handleAction(t.id, 'reset-score')} />
                                                <ActionButton icon={<ShieldAlert size={14} />} color="var(--error)" tooltip="Disqualify" disabled={t.is_disqualified} onClick={() => handleAction(t.id, 'disqualify')} />
                                                <ActionButton icon={<Trash2 size={14} />} color="#666" tooltip="Delete Node" onClick={() => handleAction(t.id, 'delete')} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {activeTab === 'sysmonitor' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <ObservabilityPanel metrics={systemMetrics} onSync={syncAll} />
                    </motion.div>
                )}

                {activeTab === 'settings' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: '3rem' }}>
                        <h2 style={{ color: 'var(--error)', marginBottom: '1.5rem' }}>DANGER_LEVEL_RED: SYSTEM_PURGE</h2>
                        <p className="text-muted" style={{ marginBottom: '3rem' }}>These actions bypass standard safeguards. All database contents will be irreversibly destroyed.</p>
                        <button onClick={() => setIsResetModalOpen(true)} className="btn-primary" style={{ background: 'var(--error)', border: 'none', padding: '1rem 2rem' }}>
                            <DatabaseZap size={20} /> Execute Global Core Reset
                        </button>
                    </motion.div>
                )}
            </main>

            <AnimatePresence>
                {notifications.map(n => (
                    <motion.div key={n.id} initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }} className="glass" style={{ position: 'fixed', bottom: '2rem', right: '2rem', padding: '1.5rem', borderLeft: '5px solid var(--error)', width: '360px', zIndex: 10000 }}>
                        <h4 style={{ margin: 0, color: 'var(--error)', fontSize: '11px', fontWeight: '900', letterSpacing: '2px' }}>INTEGRITY_VIOLATION</h4>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', margin: '8px 0' }}>{n.team_name}</div>
                        <div style={{ fontSize: '13px', opacity: 0.7 }}>Anomaly Detected: {n.type} ({n.count}/3)</div>
                    </motion.div>
                ))}
            </AnimatePresence>

            <ContestCreatorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onRefresh={syncAll} />
            <ContestSynopsisModal isOpen={isSynopsisOpen} onClose={() => setIsSynopsisOpen(false)} contest={selectedContest} teams={teams} />
            <ResetDBModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} onReset={() => { setIsResetModalOpen(false); syncAll(); }} />
        </div>
    );
};

// ----- ATOMIC COMPONENTS -----

const NavItem = ({ active, icon, label, onClick }) => (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.2rem', borderRadius: '14px', cursor: 'pointer', background: active ? 'rgba(74, 222, 128, 0.1)' : 'transparent', color: active ? 'var(--primary)' : 'inherit', fontWeight: '700', transition: '0.3s' }}>
        {icon} <span style={{ fontSize: '15px' }}>{label}</span>
    </div>
);

const ActionButton = ({ icon, color, onClick, tooltip, disabled }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }} disabled={disabled} title={tooltip} style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${disabled ? '#333' : color}`, color: color, cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1, transition: '0.2s' }}>
        {icon}
    </button>
);

const ActivityStatus = ({ isActive, lastHeartbeat }) => {
    const [isLive, setIsLive] = useState(false);
    useEffect(() => {
        const check = () => setIsLive(Date.now() - parseInt(lastHeartbeat || 0) < 15000);
        check(); const int = setInterval(check, 5000); return () => clearInterval(int);
    }, [lastHeartbeat]);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isLive ? (isActive ? 'var(--primary)' : 'var(--accent)') : '#444', boxShadow: isLive ? `0 0 10px ${isActive ? 'var(--primary)' : 'var(--accent)'}` : 'none' }} />
            <span style={{ fontSize: '11px', fontWeight: '900', color: isLive ? (isActive ? 'var(--primary)' : 'var(--accent)') : '#444' }}>{isLive ? (isActive ? 'ACTIVE' : 'BKGROUND') : 'LOST'}</span>
        </div>
    );
};

const ResetDBModal = ({ isOpen, onClose, onReset }) => {
    const [password, setPassword] = useState('');
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div className="glass-card" style={{ padding: '3rem', width: '450px', textAlign: 'center' }}>
                <ShieldAlert size={60} color="var(--error)" style={{ marginBottom: '2rem' }} />
                <h2 style={{ color: 'var(--error)' }}>AUTHORIZED_ACCESS_ONLY</h2>
                <p className="text-muted" style={{ fontSize: '13px', marginBottom: '2rem' }}>Proceeding will initiate a complete system purge. Enter Master Restriction Code.</p>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Master Override Code" style={{ width: '100%', marginBottom: '2rem' }} />
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={onClose} className="btn-accent" style={{ flex: 1 }}>Abort</button>
                    <button onClick={() => axios.post(`${API_BASE_URL}/api/admin/reset-db`, { password }).then(() => onReset()).catch(() => alert("Access Denied"))} className="btn-primary" style={{ flex: 1, background: 'var(--error)', border: 'none' }}>Finalize Purge</button>
                </div>
            </div>
        </div>
    );
};

const ReportingCenter = ({ contests, reports, onGenerate, onDownload }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h3 className="glow" style={{ marginBottom: '2rem' }}>Mission Analytics Provisioning</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {contests.map(c => (
                    <div key={c.id} style={{ padding: '1.5rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)' }}>
                        <h4 style={{ margin: '0 0 10px 0' }}>{c.name}</h4>
                        <button onClick={() => onGenerate(c.id)} className="btn-primary" style={{ width: '100%', fontSize: '11px' }}>Generate Report</button>
                    </div>
                ))}
            </div>
        </div>
        <div className="glass-card" style={{ padding: '2.5rem' }}>
            <h3 className="glow" style={{ marginBottom: '2rem' }}>Intelligence Vault</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {reports.map((r, i) => (
                    <div key={i} className="glass" style={{ padding: '1.5rem', borderRadius: '16px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{r.contest_name}</div>
                        <div style={{ fontSize: '10px', opacity: 0.5, marginBottom: '20px' }}>{new Date(r.generated_at).toLocaleString()}</div>
                        <button onClick={() => onDownload(r._id)} className="btn-accent" style={{ width: '100%' }}><Download size={16} /> Secure Download</button>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export default AdminPanel;
