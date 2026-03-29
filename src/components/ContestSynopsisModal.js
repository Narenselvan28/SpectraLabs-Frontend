import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ClipboardList, Info, ShieldCheck, Download, Activity, FileText } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const ContestSynopsisModal = ({ isOpen, onClose, contest, teams, questions = [] }) => {
    const [generating, setGenerating] = useState(false);

    if (!isOpen || !contest) return null;

    const handleDownloadReport = async () => {
        setGenerating(true);
        try {
            // 1. Generate the report via backend service
            const res = await axios.post(`${API_BASE_URL}/api/admin/reports/generate`, { 
                contest_id: contest.id || contest._id 
            }, { withCredentials: true });

            if (res.data.success && res.data.report) {
                // 2. Trigger the download via the generated report ID
                const reportId = res.data.report._id;
                window.open(`${API_BASE_URL}/api/admin/reports/${reportId}/download`, '_blank');
            } else {
                alert("REPORT_GENERATION_FAILED: DATA_INCONSISTENCY");
            }
        } catch (err) {
            console.error("Report Download Error:", err);
            alert("SYSTEM_LINK_FAILURE: GENERATION_ABORTED");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem' }}>
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="glass" 
                    style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '3.5rem', position: 'relative', border: '1px solid var(--accent)' }}
                >
                    <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}>
                        <X size={20} />
                    </button>

                    <header style={{ marginBottom: '3.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: 'var(--accent)' }}>
                            <ClipboardList size={24} />
                            <span style={{ fontSize: '0.8rem', fontWeight: '900', letterSpacing: '2px' }}>MISSION_SYNOPSIS_BETA_V1</span>
                        </div>
                        <h2 className="glow-text" style={{ fontSize: '2.5rem', fontWeight: '900', letterSpacing: '2px' }}>{contest.name.toUpperCase()}</h2>
                        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            <span>IDENTIFIER: {contest.id}</span>
                            <span>WINDOW_DURATION: {contest.duration}M</span>
                            <span style={{ color: contest.is_active ? 'var(--success)' : 'var(--error)' }}>
                                {contest.is_active ? 'STATUS: ACTIVE' : 'STATUS: STANDBY'}
                            </span>
                        </div>
                    </header>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                <Users size={18} color="var(--primary)" />
                                <h4 style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase' }}>Provisioned Units ({teams.length})</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {teams.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No operator units assigned yet.</p>}
                                {teams.map(t => (
                                    <div key={t.id} className="glass" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <span style={{ fontWeight: '800', fontSize: '1rem' }}>{t.team_name.toUpperCase()}</span>
                                        <code style={{ color: 'var(--primary)', background: 'rgba(0, 245, 255, 0.1)', padding: '2px 10px', borderRadius: '4px', letterSpacing: '2px' }}>{t.code}</code>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                <ShieldCheck size={18} color="var(--success)" />
                                <h4 style={{ color: 'var(--success)', fontWeight: '800', fontSize: '1rem', textTransform: 'uppercase' }}>Security Protocols</h4>
                            </div>
                            <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(0, 255, 136, 0.02)', border: '1px solid rgba(0, 255, 136, 0.1)' }}>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <li style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--success)' }}>●</span>
                                        <span>Tab-switching is monitored and reported.</span>
                                    </li>
                                    <li style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--success)' }}>●</span>
                                        <span>Fullscreen exit is flagged as security alert.</span>
                                    </li>
                                    <li style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--success)' }}>●</span>
                                        <span>Automatic DQ after 3 integrity violations.</span>
                                    </li>
                                </ul>
                            </div>

                            <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                <Info size={24} color="var(--primary)" style={{ flexShrink: 0 }} />
                                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: '1.6' }}>
                                    LOGIC_VALIDATION: All solutions are processed via the Judge Engine. Pattern discovery via Blackbox is primary interaction method.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '3.5rem', display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={handleDownloadReport} 
                            disabled={generating}
                            className="btn-accent" 
                            style={{ 
                                flex: 1, 
                                padding: '1.2rem', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                gap: '0.8rem',
                                fontSize: '1rem',
                                fontWeight: '800',
                                border: '1px solid var(--accent)',
                                color: 'var(--accent)'
                            }}
                        >
                            {generating ? <Activity size={20} className="animate-spin" /> : <Download size={20} />}
                            {generating ? "GENERATING_DATA..." : "Download Mission Report"}
                        </button>
                        
                        <button 
                            onClick={onClose} 
                            className="btn-primary" 
                            style={{ flex: 1, padding: '1.2rem', fontSize: '1rem', fontWeight: '800' }}
                        >
                            DEACTIVATE_SYNOPSIS_DISPLAY
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ContestSynopsisModal;
