import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, ShieldCheck, X } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../apiConfig';

const RatingModal = ({ isOpen, onClose }) => {
    const [ratings, setRatings] = useState({ ui: 0, perf: 0, overall: 0 });
    const [feedback, setFeedback] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Fix #4: PREVENT CLOSURE UNTIL SUBMITTED
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && isOpen && submitted && !loading) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, loading, submitted, onClose]);

    const handleSubmit = async () => {
        if (!ratings.ui || !ratings.perf || !ratings.overall) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/challenges/rate`, {
                ui_rating: ratings.ui,
                performance_rating: ratings.perf,
                overall_rating: ratings.overall,
                feedback
            });
            setSubmitted(true);
        } catch (e) {
            console.error("CERTIFICATION_FAILURE");
        } finally {
            setLoading(false);
        }
    };

    const StarRating = ({ value, onChange, label }) => (
        <div style={{ marginBottom: '1rem', flex: 1 }}>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginBottom: '0.5rem', letterSpacing: '1px' }}>{label.toUpperCase()}</label>
            <div style={{ display: 'flex', gap: '6px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                    <Star 
                        key={star}
                        size={20}
                        onClick={() => !submitted && onChange(star)}
                        fill={star <= value ? "var(--primary)" : "transparent"}
                        color={star <= value ? "var(--primary)" : "rgba(255,255,255,0.2)"}
                        style={{ cursor: submitted ? 'default' : 'pointer' }}
                    />
                ))}
            </div>
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '1rem' }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass"
                style={{ width: '100%', maxWidth: '500px', padding: '2rem', border: '1px solid var(--primary)', position: 'relative' }}
            >
                {/* Fix #4: REMOVE X-CLOSE BUTTON (WAIT until ratingSubmitted === true) */}

                {!submitted ? (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <ShieldCheck size={28} color="var(--primary)" />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', letterSpacing: '1px', margin: 0 }}>MISSION_DEBRIEFING</h2>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
                            <StarRating label="UI" value={ratings.ui} onChange={v => setRatings({...ratings, ui: v})} />
                            <StarRating label="Perf" value={ratings.perf} onChange={v => setRatings({...ratings, perf: v})} />
                            <StarRating label="Goal" value={ratings.overall} onChange={v => setRatings({...ratings, overall: v})} />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '10px', color: 'var(--muted)', marginBottom: '0.4rem' }}>OPTIONAL_ANOMALIES_LOG</label>
                            <textarea value={feedback} onChange={e => setFeedback(e.target.value)} disabled={loading} style={{ width: '100%', minHeight: '80px', fontSize: '12px', background: 'rgba(0,0,0,0.3)' }} />
                        </div>

                        <button 
                            onClick={handleSubmit} 
                            disabled={loading || !ratings.ui} 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}
                        >
                            <Send size={16} /> {loading ? "TRANSMITTING..." : "SUBMIT"}
                        </button>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ width: '50px', height: '50px', background: 'rgba(0, 245, 255, 0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Star size={24} color="var(--primary)" fill="var(--primary)" />
                        </div>
                        <h2 style={{ color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '1rem' }}>PROTOCOL_SYNCHRONIZED</h2>
                        <button onClick={onClose} className="btn-primary" style={{ width: '100%' }}>CLOSE_DEBRIEFING</button>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default RatingModal;
