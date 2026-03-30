import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EditorPanel } from '../components/EditorPanel';
import { ContestTimer } from '../components/ContestTimer';
import RatingModal from '../components/RatingModal';
import { ViolationModal } from '../components/ViolationModal';
import { 
    RefreshCw, LogOut, User, 
    ShieldCheck, LayoutGrid, Zap, Maximize
} from 'lucide-react';
import API_BASE_URL from '../apiConfig';
import logo from '../1723176950534.jpeg';

axios.defaults.withCredentials = true;

const Dashboard = () => {
    const [currentQuestionData, setCurrentQuestionData] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [contest, setContest] = useState(null);
    const [violationInfo, setViolationInfo] = useState({ isOpen: false, type: '', count: 0 });
    const heartbeatTimer = useRef(null);

    const handleLogout = async () => {
        if (!window.confirm("Do you want to logout and end your session?")) return;
        try {
            await axios.post(`${API_BASE_URL}/api/auth/logout`, { role: 'team' });
            localStorage.clear();
            navigate('/');
        } catch (err) {}
    };

    const enterFullscreen = () => {
        const docElm = document.documentElement;
        if (docElm.requestFullscreen) docElm.requestFullscreen();
        else if (docElm.mozRequestFullScreen) docElm.mozRequestFullScreen();
        else if (docElm.webkitRequestFullScreen) docElm.webkitRequestFullScreen();
        else if (docElm.msRequestFullscreen) docElm.msRequestFullscreen();
        setIsFullscreen(true);
    };

    useEffect(() => {
        const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handleFSChange);
        return () => document.removeEventListener('fullscreenchange', handleFSChange);
    }, []);

    const fetchCurrentQuestion = useCallback(async () => {
        try {
            // First check if contest is still active
            const statusRes = await axios.get(`${API_BASE_URL}/api/status`, { timeout: 5000 });
            if (!statusRes.data.roundActive) {
                alert("The contest is not currently active.");
                navigate('/select-contest');
                return;
            }

            const res = await axios.get(`${API_BASE_URL}/api/challenges/current`);
            if (res.data.completed) {
                setIsCompleted(true);
                setCurrentQuestionData(null);
            } else {
                setCurrentQuestionData(res.data);
                setIsCompleted(false);
            }
            const teamRes = await axios.get(`${API_BASE_URL}/api/auth/me`);
            if (teamRes.data) {
                setTeam(teamRes.data);
                localStorage.setItem('team', JSON.stringify(teamRes.data));
            }
        } catch (err) {
            if (err.response?.status === 401) {
                 localStorage.clear();
                 navigate('/');
            }
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
            } else {
                // If not active and we're try to init, go back to selection
                navigate('/select-contest');
            }
            
            const teamRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { timeout: 10000 });
            if (teamRes.data) {
                setTeam(teamRes.data);
                localStorage.setItem('team', JSON.stringify(teamRes.data));
            }
        } catch (err) {
            if (err.response?.status === 401 || !localStorage.getItem('team')) {
                localStorage.clear();
                navigate('/');
            }
        }
    }, [fetchCurrentQuestion, navigate]);

    // Initial Load Only
    useEffect(() => {
        initializeSystem();
    }, [initializeSystem]);

    // Background Tasks
    useEffect(() => {
        const poll = setInterval(() => { 
            // Only poll if contest is NOT finished
            if (!isCompleted && !currentQuestionData) initializeSystem(); 
        }, 60000);

        const handleVisibility = () => { 
            if (isCompleted) return; // Stop violation tracking once finished
            const isTabActive = !document.hidden;
            if (!isTabActive) {
                axios.post(`${API_BASE_URL}/api/challenges/violation`, { type: 'TAB_SWITCH' })
                    .then(res => {
                        setViolationInfo({ isOpen: true, type: 'TAB_SWITCH', count: res.data.count });
                        setTeam(t => ({ ...t, violations: res.data.count }));
                    }).catch(()=>{});
            }
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive }).catch(()=>{});
        };

        const heartbeatFired = () => {
            if (isCompleted) return;
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive: !document.hidden }).catch(()=>{});
        };

        document.addEventListener("visibilitychange", handleVisibility);
        heartbeatTimer.current = setInterval(heartbeatFired, 10000);

        return () => {
            clearInterval(poll);
            document.removeEventListener("visibilitychange", handleVisibility);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        };
    }, [isCompleted, currentQuestionData, initializeSystem]);

    if (!contest || !team) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050a06' }}>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                    <div className="text-label" style={{ color: 'var(--primary)', marginBottom: '1.5rem', letterSpacing: '4px' }}>LOGGING IN...</div>
                    <RefreshCw className="animate-spin" size={32} color="var(--primary)" style={{ marginBottom: '2rem' }} />
                    <button onClick={initializeSystem} className="btn-accent">RETRY CONNECTION</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', width: '100vw', height: '100vh', background: '#050a06', color: '#fff', overflow: 'hidden', fontFamily: 'var(--font-main)' }}>
            <div className="scanline" />

            <nav style={{ width: '300px', flexShrink: 0, borderRight: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', padding: '2rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(35px)', zIndex: 100 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '3.5rem' }}>
                    <img src={logo} alt="SL" style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid var(--primary)' }} />
                    <span style={{ fontWeight: '900', letterSpacing: '2px', fontSize: '12px', color: 'var(--primary)' }}>SPECTRA_OPS</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: 'auto' }}>
                    <span className="text-label" style={{ marginBottom: '0.5rem', opacity: 0.4, fontSize: '9px' }}>CHANNELS</span>
                    <button className="btn-primary" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start', padding: '1rem', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.15)', borderColor: 'var(--primary)', fontSize: '13px' }}>
                        <LayoutGrid size={16} /> Current Contest
                    </button>
                    
                    {!isFullscreen && !isCompleted && (
                        <button onClick={enterFullscreen} className="btn-accent" style={{ display: 'flex', gap: '1rem', color: 'var(--accent)', borderColor: 'var(--accent)', justifyContent: 'flex-start', padding: '1rem', borderRadius: '10px', marginTop: '1rem', fontSize: '13px' }}>
                            <Maximize size={16} /> Enter Fullscreen
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '2rem' }}>
                    {!isCompleted && (
                        <button onClick={() => fetchCurrentQuestion()} className="btn-accent" style={{ width: '100%', fontSize: '12px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <RefreshCw size={14} /> Refresh Contest
                        </button>
                    )}
                    <button onClick={handleLogout} className="btn-accent" style={{ borderColor: 'rgba(248, 113, 113, 0.2)', color: 'var(--error)', width: '100%', fontSize: '12px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <LogOut size={14} /> Logout
                    </button>
                </div>
            </nav>

            <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'rgba(0,0,0,0.1)' }}>
                <header style={{ padding: '1.2rem 3rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(15px)' }}>
                    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)' }} />
                            <span style={{ fontSize: '13px', fontWeight: '900', textTransform: 'uppercase' }}>{contest.name}</span>
                        </div>
                        <div style={{ height: '20px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                        <ContestTimer startTime={contest.startTime} durationMinutes={contest.duration} onExpire={() => setIsCompleted(true)} />
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                         <div className="glass" style={{ padding: '0.5rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem', borderRadius: '50px', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.15)' }}>
                            <Zap size={14} color="var(--primary)" />
                            <span style={{ fontWeight: '900', fontSize: '16px', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{team.score || 0} <span style={{ fontSize: '10px', opacity: 0.6 }}>PTS</span></span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Hacker: {team.team_name}</div>
                                <div style={{ fontSize: '9px', color: (team.violations || 0) > 0 ? 'var(--error)' : 'var(--primary)', fontWeight: '900' }}>
                                    {(team.violations || 0) > 0 ? `Tab Switches: ${team.violations}` : 'Status: Online'}
                                </div>
                            </div>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={18} color="var(--primary)" />
                            </div>
                        </div>
                    </div>
                </header>

                <div style={{ flex: 1, padding: '2rem 3rem', overflowY: 'auto' }}>
                    {isCompleted ? (
                        <div style={{ textAlign: 'center', padding: '10vh 0' }}>
                             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3.5rem', border: '1px solid var(--primary)' }}>
                                <ShieldCheck size={72} color="var(--primary)" style={{ marginBottom: '2rem' }} />
                                <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginBottom: '1.2rem' }}>Contest Finished</h1>
                                <p className="text-muted" style={{ fontSize: '15px', marginBottom: '2.5rem', lineHeight: '1.6' }}>You have successfully finished this contest. Your progress has been saved. You can now close this tab or logout below.</p>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                     <button onClick={handleLogout} className="btn-primary" style={{ padding: '0.8rem 2.5rem' }}>Logout From Contest</button>
                                </div>
                             </motion.div>
                        </div>
                    ) : (
                        currentQuestionData && currentQuestionData.question ? (
                            <EditorPanel 
                                key={currentQuestionData.question.id} 
                                question={currentQuestionData.question} 
                                index={currentQuestionData.index}
                                total={currentQuestionData.total}
                                onRefresh={fetchCurrentQuestion} 
                                onComplete={() => setIsRatingOpen(true)}
                            />
                        ) : (
                            <div style={{ textAlign: 'center', marginTop: '20vh', opacity: 0.3 }}>
                                <RefreshCw size={42} className="animate-spin" color="var(--primary)" />
                                <div className="text-label" style={{ marginTop: '1.5rem', letterSpacing: '2px' }}>LOADING CONTEST...</div>
                            </div>
                        )
                    )}
                </div>
            </main>

            <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} />
            <ViolationModal isOpen={violationInfo.isOpen} type={violationInfo.type} count={violationInfo.count} onClose={() => setViolationInfo({ ...violationInfo, isOpen: false })} />
        </div>
    );
};

export default Dashboard;
