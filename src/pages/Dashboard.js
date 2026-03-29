import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
            if (teamRes.data) setTeam(teamRes.data);
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

        document.addEventListener("visibilitychange", handleVisibility);
        heartbeatTimer.current = setInterval(() => {
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive: !document.hidden && document.hasFocus() }).catch(()=>{});
        }, 10000);

        return () => {
            clearInterval(poll);
            document.removeEventListener("visibilitychange", handleVisibility);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        };
    }, [initializeSystem, currentQuestionData]);

    if (!contest || !team) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a06' }}>
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                    <div className="text-label" style={{ color: 'var(--primary)', marginBottom: '1rem' }}>CONNECTING_TO_STATION...</div>
                    <button onClick={initializeSystem} className="btn-accent">RETRY_CONNECTION</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="dashboard-layout" style={{ display: 'flex', height: '100vh', background: '#050a06', overflow: 'hidden' }}>
            <div className="scanline" />

            <nav style={{ width: '280px', borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '2rem', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem' }}>
                    <img src={logo} alt="SL" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--primary)' }} />
                    <span style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '14px', color: 'var(--primary)' }}>SPECTRALABS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: 'auto' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', marginBottom: '0.5rem' }}>NAVIGATION</div>
                    <button className="btn-accent" style={{ background: 'rgba(74, 222, 128, 0.1)', borderColor: 'var(--primary)', display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
                        <LayoutGrid size={18} color="var(--primary)" /> Missions
                    </button>
                    <button onClick={() => window.open('/leaderboard', '_blank')} className="btn-accent" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
                        <Trophy size={18} /> Standings
                    </button>
                    <button className="btn-accent" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
                        <HelpCircle size={18} /> Support
                    </button>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '900', letterSpacing: '2px', marginBottom: '1rem' }}>MISSION_TERMINAL</div>
                    <div className="glass" style={{ padding: '1rem', fontSize: '11px', fontFamily: 'var(--font-mono)', minHeight: '150px', background: 'rgba(0,0,0,0.6)' }}>
                        {logs.map((log, i) => (
                            <div key={i} style={{ marginBottom: '8px', color: log.msg.includes('ERROR') ? 'var(--error)' : 'var(--text-muted)' }}>
                                <span style={{ opacity: 0.4 }}>[{log.time}]</span> {log.msg}
                            </div>
                        ))}
                    </div>
                </div>

                <button onClick={handleLogout} className="btn-accent" style={{ marginTop: '2rem', borderColor: 'var(--error)', color: 'var(--error)', width: '100%' }}>
                    <LogOut size={16} /> TERMINATE_SESSION
                </button>
            </nav>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
                <header style={{ padding: '1.5rem 3rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0.1,0,0.2)' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                            <span style={{ fontSize: '13px', fontWeight: '800' }}>{contest?.name}</span>
                        </div>
                        <ContestTimer startTime={contest?.startTime} durationMinutes={contest?.duration} />
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                         <div className="glass" style={{ padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderRadius: '50px' }}>
                            <Zap size={16} color="var(--primary)" />
                            <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{team?.score || 0}</span>
                        </div>
                        <div style={{ height: '24px', width: '1px', background: 'var(--glass-border)' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1px' }}>{team?.team_name}</div>
                                <div style={{ fontSize: '9px', color: 'var(--primary)', fontWeight: 'bold' }}>PILOT_ACTIVE</div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} color="var(--primary)" />
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
                    {isCompleted ? (
                        <div style={{ textAlign: 'center', padding: '10vh 0' }}>
                             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem' }}>
                                <ShieldCheck size={80} color="var(--primary)" style={{ marginBottom: '2rem' }} />
                                <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '1rem' }}>Mission Success</h1>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>Uplink complete. Your performance metrics have been stored.</p>
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
                        <div style={{ textAlign: 'center', marginTop: '20vh' }}>
                            <RefreshCw size={48} className="animate-spin" color="var(--primary)" />
                            <div className="text-label" style={{ marginTop: '2rem' }}>AWAITING_MISSION_STREAM...</div>
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
