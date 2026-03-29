import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

export const ViolationModal = ({ isOpen, type, count, onClose }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="modal-overlay" style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000,
                backdropFilter: 'blur(10px)'
            }}>
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="glass" 
                    style={{
                        width: '500px',
                        padding: '4rem',
                        textAlign: 'center',
                        border: '2px solid var(--error)',
                        boxShadow: '0 0 80px rgba(255, 77, 77, 0.2)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '90px', 
                            height: '90px', 
                            background: 'rgba(255, 77, 77, 0.1)', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '1px solid var(--error)',
                            boxShadow: 'inset 0 0 20px rgba(255, 77, 77, 0.2)'
                        }}>
                             <ShieldAlert size={48} color="var(--error)" className="animate-pulse" />
                        </div>
                    </div>

                    <h2 className="glow-text" style={{ color: 'var(--error)', marginBottom: '1.5rem', fontSize: '2.4rem', fontWeight: '900', letterSpacing: '2px' }}>SECURITY_BREACH</h2>
                    
                    <div style={{ marginBottom: '3rem' }}>
                        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem', letterSpacing: '2px', fontWeight: 'bold' }}>
                            UNAUTHORIZED_ACTIVITY_DETECTED:
                        </p>
                        <div className="glass" style={{ 
                            background: 'rgba(255, 77, 77, 0.05)', 
                            padding: '1.2rem 2.5rem', 
                            borderRadius: '12px', 
                            fontFamily: 'monospace',
                            color: 'var(--error)',
                            display: 'inline-block',
                            marginBottom: '1.5rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            letterSpacing: '4px',
                            border: '1px solid rgba(255, 77, 77, 0.2)'
                        }}>
                            {type.toUpperCase().replace('_', ' ')}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '1rem' }}>
                            {[...Array(3)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ scale: 0.8 }}
                                    animate={{ scale: i < count ? 1.2 : 1 }}
                                    style={{ 
                                        width: '40px', 
                                        height: '10px', 
                                        borderRadius: '5px',
                                        background: i < count ? 'var(--error)' : 'rgba(255,255,255,0.05)',
                                        boxShadow: i < count ? '0 0 15px var(--error)' : 'none'
                                    }}
                                />
                            ))}
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2rem', fontWeight: 'bold' }}>
                            INTEGRITY_VIOLATIONS: {count} / 03
                        </p>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '3rem', textAlign: 'left', display: 'flex', gap: '1rem' }}>
                        <AlertTriangle size={32} color="var(--error)" style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: '1.6', fontWeight: '500' }}>
                            CRITICAL: Persistent violations will lead to permanent session lockout and zero-score finalization. Maintain arena focus to ensure system integrity.
                        </p>
                    </div>

                    <button 
                        onClick={onClose}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            background: 'var(--error)',
                            color: 'white',
                            padding: '1.5rem',
                            fontSize: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1rem'
                        }}
                    >
                        ACKNOWLEDGE_AND_RETURN
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
