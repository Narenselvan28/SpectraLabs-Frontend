import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('spectra_cookie_consent');
        if (!consent) {
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('spectra_cookie_consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                    style={{
                        position: 'fixed',
                        bottom: '2rem',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        width: 'calc(100% - 4rem)',
                        maxWidth: '800px',
                        pointerEvents: 'auto'
                    }}
                >
                    <div className="glass" style={{
                        padding: '1.5rem 2rem',
                        borderRadius: '24px',
                        border: '1px solid var(--primary)',
                        background: 'rgba(5, 15, 10, 0.95)',
                        backdropFilter: 'blur(20px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '2rem',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(74, 222, 128, 0.1)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ 
                                width: '48px', 
                                height: '48px', 
                                borderRadius: '12px', 
                                background: 'rgba(74, 222, 128, 0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: '1px solid var(--primary)'
                            }}>
                                <ShieldCheck size={24} color="var(--primary)" />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '1px', color: 'var(--primary)' }}>SESSION SECURITY</h4>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7, maxWidth: '500px', lineHeight: '1.4' }}>
                                    We use secure cookies to keep you logged in and save your contest progress correctly.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button 
                                onClick={() => setIsVisible(false)}
                                className="btn-accent" 
                                style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}
                                title="Dismiss"
                            >
                                <X size={18} />
                            </button>
                            <button 
                                onClick={handleAccept}
                                className="btn-primary" 
                                style={{ 
                                    padding: '1rem 2rem', 
                                    borderRadius: '50px', 
                                    fontSize: '12px', 
                                    fontWeight: '900',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.8rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                I UNDERSTAND <ArrowRight size={16} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CookieConsent;
