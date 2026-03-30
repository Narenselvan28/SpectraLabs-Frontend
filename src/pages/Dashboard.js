import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorPanel } from '../components/EditorPanel';
import { ContestTimer } from '../components/ContestTimer';
import RatingModal from '../components/RatingModal';
import { ViolationModal } from '../components/ViolationModal';
import { 
    RefreshCw, Trophy, LogOut, User, 
    ShieldCheck, LayoutGrid, Zap, HelpCircle 
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import logo from '../1723176950534.jpeg';

axios.defaults.withCredentials = true;

const Dashboard = () => {
    const [currentQuestionData, setCurrentQuestionData] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [contest, setContest] = useState(null);
    const [logs, setLogs] = useState([
        { time: new Date().toLocaleTimeString(), msg: "SYSTEM_BOOT: SpectraLabs Dashboard Initialized." },
        { time: new Date().toLocaleTimeString(), msg: "SECURITY: Encrypted uplink established." }
    ]);
    const [violationInfo, setViolationInfo] = useState({ isOpen: false, type: '', count: 0 });
    const heartbeatTimer = useRef(null);

    const addLog = (msg) => {
        setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 10));
    };

    const handleLogout = async () => {
        if (!window.confirm("Disconnect session and exit SpectraLabs?")) return;
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, { role: 'team' });
            localStorage.clear();
            navigate('/');
        } catch (err) {}
    };

    const fetchCurrentQuestion = useCallback(async () => {
        try {
            addLog("QUERYING: Fetching current mission data...");
            const res = await axios.get(`${API_BASE_URL}/api/challenges/current`);
            if (res.data.completed) {
                setIsCompleted(true);
                setCurrentQuestionData(null);
                addLog("STATUS: All missions completed.");
            } else {
                setCurrentQuestionData(res.data);
                setIsCompleted(false);
                addLog(`MISSION_READY: Node ${res.data.index + 1} locked.`);
            }
            const teamRes = await axios.get(`${API_BASE_URL}/api/auth/me`);
            if (teamRes.data) {
                setTeam(teamRes.data);
                localStorage.setItem('team', JSON.stringify(teamRes.data));
            }
        } catch (err) {
            addLog("ERROR: Mission synchronization failed.");
        }
    }, [navigate]);

    const initializeSystem = useCallback(async () => {
        const cachedTeam = localStorage.getItem('team');
        const cachedContest = localStorage.getItem('contest_state');
        
        if (cachedTeam) setTeam(JSON.parse(cachedTeam));
        if (cachedContest) setContest(JSON.parse(cachedContest));

        try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/status`, { timeout: 10000 });
            if (statusRes.data.roundActive) {
                setContest(statusRes.data);
                localStorage.setItem('contest_state', JSON.stringify(statusRes.data));
                fetchCurrentQuestion();
            }
            
            const teamRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { timeout: 10000 });
            if (teamRes.data) {
                setTeam(teamRes.data);
                localStorage.setItem('team', JSON.stringify(teamRes.data));
            }
        } catch (err) {
            if (!localStorage.getItem('team')) navigate('/');
        }
    }, [fetchCurrentQuestion, navigate]);

    useEffect(() => {
        initializeSystem();
        const poll = setInterval(() => { if (!currentQuestionData) initializeSystem(); }, 60000);

        const handleVisibility = () => { 
            const isTabActive = !document.hidden;
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive }).catch(()=>{});
        };

        const heartbeatFired = () => {
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive: !document.hidden }).catch(()=>{});
        };

        document.addEventListener("visibilitychange", handleVisibility);
        heartbeatTimer.current = setInterval(heartbeatFired, 10000);

        return () => {
            clearInterval(poll);
            document.removeEventListener("visibilitychange", handleVisibility);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        };
    }, [initializeSystem, currentQuestionData]);

    if (!contest || !team) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a06' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                    <div className="text-label" style={{ color: 'var(--primary)', marginBottom: '1.5rem', letterSpacing: '8px' }}>BOOT_SEQUENCE_INIT</div>
                    <RefreshCw className="animate-spin" size={32} color="var(--primary)" style={{ marginBottom: '2rem' }} />
                    <button onClick={initializeSystem} className="btn-accent" style={{ fontSize: '11px' }}>RETRY_STATION_SYNC</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ 
            display: 'flex', 
            width: '100vw', 
            height: '100vh', 
            background: '#050a06', 
            color: '#fff', 
            overflow: 'hidden',
            fontFamily: 'var(--font-main)'
        }}>
            <div className="scanline" />

            {/* Sidebar FIXED width to prevent any main-content overlap */}
            <nav style={{ 
                width: '320px', 
                flexShrink: 0,
                borderRight: '1px solid var(--glass-border)', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '2.5rem', 
                background: 'rgba(0,0,0,0.6)', 
                backdropFilter: 'blur(35px)', 
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
                    <img src={logo} alt="SL" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--primary)' }} />
                    <span style={{ fontWeight: '900', letterSpacing: '3px', fontSize: '13px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>SPECTRA_OPS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: 'auto' }}>
                    <span className="text-label" style={{ marginBottom: '0.5rem', opacity: 0.4 }}>COMM_CHANNEL</span>
                    <button className="btn-accent" style={{ background: 'rgba(74, 222, 128, 0.1)', borderColor: 'rgba(74, 222, 128, 0.2)', color: 'var(--primary)', display: 'flex', gap: '1.2rem', justifyContent: 'flex-start', padding: '1.2rem', borderRadius: '12px' }}>
                        <LayoutGrid size={18} /> Missions
                    </button>
                    <button onClick={() => window.open('/leaderboard', '_blank')} className="btn-accent" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'flex-start', padding: '1.2rem', borderRadius: '12px' }}>
                        <Trophy size={18} /> Leaderboard
                    </button>
                    <button className="btn-accent" style={{ display: 'flex', gap: '1.2rem', justifyContent: 'flex-start', padding: '1.2rem', borderRadius: '12px' }}>
                        <HelpCircle size={18} /> Support
                    </button>
                </div>

                <div style={{ marginTop: '2.5rem' }}>
                    <span className="text-label" style={{ marginBottom: '1.2rem', opacity: 0.4, display: 'block' }}>MISSION_DEBRIEFING</span>
                    <div className="glass" style={{ padding: '1.2rem', fontSize: '10px', fontFamily: 'var(--font-mono)', minHeight: '140px', background: 'rgba(0,0,0,0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.02)' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '12px', color: log.msg.includes('ERROR') ? 'var(--error)' : 'var(--text-muted)', lineHeight: '1.5' }}>
                                <span style={{ opacity: 0.3, fontWeight: '700' }}>{log.time}</span> <span style={{ marginLeft: '10px' }}>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-accent" style={{ marginTop: '2rem', borderColor: 'rgba(248, 113, 113, 0.2)', color: 'var(--error)', width: '100%', fontSize: '12px' }}>
                    <LogOut size={16} /> END_MISSION
                </button>
            </nav>

            {/* Main Content Area filling remaining space */}
            <main style={{ 
                flex: 1, 
                minWidth: 0,
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                overflow: 'hidden', 
                background: 'rgba(0,0,0,0.1)'
            }}>
                
                {/* Global Status HUD */}
                <header style={{ padding: '1.5rem 4rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(15px)' }}>
                    <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                            <span style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase' }}>{contest.name}</span>
                        </div>
                        <div style={{ height: '24px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <ContestTimer startTime={contest.startTime} durationMinutes={contest.duration} />
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                         <div className="glass" style={{ padding: '0.6rem 1.4rem', display: 'flex', alignItems: 'center', gap: '1rem', borderRadius: '50px', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
                            <Zap size={16} color="var(--primary)" />
                            <span style={{ fontWeight: '900', fontSize: '18px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{team.score || 0} <span style={{ fontSize: '10px', opacity: 0.6 }}>EXP</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>{team.team_name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: '900', letterSpacing: '1px' }}>UPLINK_STABLE</div>
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={20} color="var(--primary)" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mission Deployment Zone */}
                <div style={{ flex: 1, padding: '3rem 4rem', overflowY: 'auto' }}>
                    {isCompleted ? (
                        <div style={{ textAlign: 'center', padding: '12vh 0' }}>
                             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ maxWidth: '650px', margin: '0 auto', padding: '4rem', border: '1px solid var(--primary)' }}>
                                <ShieldCheck size={80} color="var(--primary)" style={{ marginBottom: '2.5rem', filter: 'drop-shadow(0 0 15px rgba(74, 222, 128, 0.4))' }} />
                                <h1 style={{ fontSize: '2.8rem', fontWeight: '900', marginBottom: '1.5rem', letterSpacing: '-1px' }}>Mission Successful</h1>
                                <p className="text-muted" style={{ fontSize: '16px', marginBottom: '3rem', lineHeight: '1.8' }}>Uplink verification complete. Your scores have been synchronized with the main cluster. Retain operational standby status for future directives.</p>
                                <button onClick={() => window.open('/leaderboard', '_blank')} className="btn-primary" style={{ padding: '1rem 3rem' }}>VIEW_GLOBAL_RANKINGS</button>
                             </motion.div>
                        </div>
                    ) : currentQuestionData && currentQuestionData.question ? (
                        <EditorPanel 
                            key={currentQuestionData.question.id} 
                            question={currentQuestionData.question} 
                            index={currentQuestionData.index}
                            total={currentQuestionData.total}
                            onRefresh={fetchCurrentQuestion} 
                            onComplete={() => setIsRatingOpen(true)}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '25vh', opacity: 0.3 }}>
                            <RefreshCw size={48} className="animate-spin" color="var(--primary)" />
                            <div className="text-label" style={{ marginTop: '2rem', letterSpacing: '4px' }}>SYNCHRONIZING_WAVEFORM...</div>
                        </div>
                    )}
                </div>
            </main>

            <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} />
            <ViolationModal isOpen={violationInfo.isOpen} type={violationInfo.type} count={violationInfo.count} onClose={() => setViolationInfo({ ...violationInfo, isOpen: false })} />
        </div>
    );
};

export default Dashboard;
