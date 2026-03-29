import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EditorPanel } from '../components/EditorPanel';
import { ContestTimer } from '../components/ContestTimer';
import RatingModal from '../components/RatingModal';
import { ViolationModal } from '../components/ViolationModal';
import { RefreshCw, Trophy, LogOut, User, Activity } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

import logo from '../1723176950534.jpeg';

const Dashboard = () => {
    const [currentQuestionData, setCurrentQuestionData] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRatingOpen, setIsRatingOpen] = useState(false);
    const navigate = useNavigate();
    const [team, setTeam] = useState(null);
    const [contest, setContest] = useState(null);
    const [violationInfo, setViolationInfo] = useState({ isOpen: false, type: '', count: 0 });
    const heartbeatTimer = useRef(null);

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
            const res = await axios.get(`${API_BASE_URL}/api/challenges/current`);
            if (res.data.completed) {
                setIsCompleted(true);
                setCurrentQuestionData(null);
            } else {
                setCurrentQuestionData(res.data);
                setIsCompleted(false);
            }
            const teamRes = await axios.get(`${API_BASE_URL}/api/auth/me`);
            if (teamRes.data) setTeam(teamRes.data);
        } catch (err) {}
    }, []);

    const initializeSystem = useCallback(async () => {
        // HYDRATION: Seek local cache first to prevent UI flicker or Home redirect
        const cachedTeam = localStorage.getItem('team');
        const cachedContest = localStorage.getItem('contest_state');
        
        if (cachedTeam) setTeam(JSON.parse(cachedTeam));
        if (cachedContest) setContest(JSON.parse(cachedContest));

        try {
            const statusRes = await axios.get(`${API_BASE_URL}/api/status`, { timeout: 10000 });
            if (statusRes.data.roundActive) {
                setContest(statusRes.data);
                localStorage.setItem('contest_state', JSON.stringify(statusRes.data));
                fetchCurrentQuestion(statusRes.data.contestId);
            }
            
            const teamRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { timeout: 10000 });
            if (teamRes.data) {
                setTeam(teamRes.data);
                localStorage.setItem('team', JSON.stringify(teamRes.data));
            }
        } catch (err) {
            console.error("[SpectraLabs] SESSION_SYNC_ERROR: ", err.response?.status || err.message);
            // ONLY if team data is wiped we go to login
            if (!localStorage.getItem('team')) {
                navigate('/');
            }
        }
    }, [fetchCurrentQuestion, navigate]);

    // Minimize useEffect: Combined initialization and event listeners
    useEffect(() => {
        initializeSystem();
        
        // Remove aggressive polling that feels like a 'refresh'
        const poll = setInterval(() => {
            if (!currentQuestionData) initializeSystem();
        }, 15000); // Relaxed polling

        const handleVisibility = () => { 
            const isTabActive = !document.hidden;
            // Removed redundant reporting to save bandwidth/noise
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive }).catch(()=>{});
        };

        const handleBlur = () => axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive: false }).catch(()=>{});
        const handleFocus = () => axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive: true }).catch(()=>{});

        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("blur", handleBlur);
        window.addEventListener("focus", handleFocus);

        heartbeatTimer.current = setInterval(() => {
            axios.post(`${API_BASE_URL}/api/challenges/heartbeat`, { isTabActive: !document.hidden && document.hasFocus() }).catch(()=>{});
        }, 10000);

        return () => {
            clearInterval(poll);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("focus", handleFocus);
            if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
        };
    }, [initializeSystem]);

    const enterArena = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
        initializeSystem();
    };


    return (
        <div className="dashboard-container" style={{ padding: '2rem 4rem', minHeight: '100vh', background: 'transparent', color: 'var(--text-main)' }}>
            <AnimatePresence>
                {!contest && (
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="glass-card" 
                        style={{ padding: '5rem', textAlign: 'center', width: '600px', margin: '10vh auto', border: '1px solid var(--primary)', borderRadius: '32px' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2.5rem' }}>
                            <div style={{ width: '80px', height: '80px', background: 'rgba(0, 245, 255, 0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary)', boxShadow: '0 0 20px rgba(0, 245, 255, 0.1)' }}>
                                <img src={logo} alt="Logo" style={{ width: '50px', transform: 'scale(1.2)' }} />
                            </div>
                        </div>
                        <h1 className="glow-text" style={{ fontSize: '3.2rem', fontWeight: '900', marginBottom: '1rem', letterSpacing: '2px' }}>Initialize Session</h1>
                        <p className="text-muted" style={{ fontSize: '10px', letterSpacing: '3px', fontWeight: 'bold' }}>ESTABLISH SECURE CONNECTION TO SPECTRALABS</p>
                        
                        {!contest && (
                            <div style={{ marginTop: '3rem' }}>
                                <div className="animate-pulse" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1.5rem' }}>Awaiting Arena Signal...</div>
                                <button 
                                    onClick={initializeSystem} 
                                    className="btn-accent" 
                                    style={{ fontSize: '11px', padding: '1rem 2rem' }}
                                >
                                    <RefreshCw size={14} /> Force Re-Establish Link
                                </button>
                            </div>
                        )}

                        {contest && !currentQuestionData && (
                            <div style={{ marginTop: '3rem' }}>
                                <div className="animate-pulse" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '1.5rem' }}>Establishing Data Stream...</div>
                                <button 
                                    onClick={fetchCurrentQuestion} 
                                    className="btn-primary" 
                                    style={{ fontSize: '11px', padding: '1rem 2rem' }}
                                >
                                    <Activity size={14} /> Synchronize Mission
                                </button>
                            </div>
                        )}

                        {isCompleted && (
                            <div style={{ marginTop: '3rem' }}>
                                <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.4rem', marginBottom: '1rem' }}>MISSION_ACCOMPLISHED</div>
                                <p className="text-muted">Leaderboard Finalized. Disconnect Node when ready.</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {contest && team && (
                <div className="arena-interface animate-fade-in">
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginRight: '1rem' }}>
                                <img src={logo} alt="SL" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                                <span className="heading-section" style={{ fontSize: '18px', color: 'var(--primary)', letterSpacing: '1px' }}>SPECTRALABS</span>
                            </div>
                            <div className="glass" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <User size={16} color="var(--primary)" />
                                <span style={{ fontWeight: '600', fontSize: '14px' }}>{team.team_name}</span>
                            </div>
                            <ContestTimer startTime={contest.startTime} durationMinutes={contest.duration} onExpire={() => { console.log("[SpectraLabs] MISSION_WINDOW_CLOSED: Timer completed."); }} />
                            <div className="glass" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <Activity size={16} color="var(--success)" />
                                <span style={{ fontWeight: '700', fontSize: '18px', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{team.score || 0}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button onClick={() => fetchCurrentQuestion(contest.contestId || contest.id)} className="btn-accent" style={{ padding: '0.6rem' }} title="Resume/Sync"><RefreshCw size={18} /></button>
                            <button onClick={() => window.open('/leaderboard', '_blank')} className="btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Trophy size={16} /> Rankings</button>
                            <button onClick={handleLogout} className="btn-accent" style={{ borderColor: 'rgba(248, 113, 113, 0.2)', color: 'var(--error)' }}><LogOut size={16} /></button>
                        </div>
                    </header>

                    {isCompleted ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ textAlign: 'center', padding: '6rem 4rem', marginTop: '4rem' }}>
                            <Trophy size={64} color="var(--success)" style={{ marginBottom: '2rem' }} />
                            <h2 className="heading-title" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Mission Accomplished</h2>
                            <p className="text-muted" style={{ maxWidth: '600px', margin: '0 auto' }}>You have successfully navigated all missions in SpectraLabs. Your data has been finalized for the leaderboard ranking.</p>
                            <button onClick={() => window.open('/leaderboard', '_blank')} className="btn-primary" style={{ marginTop: '2.5rem' }}>View Rankings</button>
                        </motion.div>
                    ) : (
                        currentQuestionData && currentQuestionData.question && (
                            <div className="arena-core">
                                <EditorPanel 
                                    key={currentQuestionData.question.id} 
                                    question={currentQuestionData.question} 
                                    index={currentQuestionData.index}
                                    total={currentQuestionData.total}
                                    onRefresh={fetchCurrentQuestion} 
                                    onComplete={() => setIsRatingOpen(true)}
                                />
                            </div>
                        )
                    )}
                </div>
            )}

            <RatingModal isOpen={isRatingOpen} onClose={() => setIsRatingOpen(false)} />
            <ViolationModal isOpen={violationInfo.isOpen} type={violationInfo.type} count={violationInfo.count} onClose={() => setViolationInfo({ ...violationInfo, isOpen: false })} />
        </div>
    );
};

export default Dashboard;
