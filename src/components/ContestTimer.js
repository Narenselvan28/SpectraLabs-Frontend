import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const ContestTimer = ({ startTime, durationMinutes, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!startTime || !durationMinutes) return;

        const startMs = typeof startTime === 'string' && !isNaN(startTime) ? parseInt(startTime) : new Date(startTime).getTime();
        const endTime = startMs + (durationMinutes * 60 * 1000);
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = endTime - now;
            if (diff <= 0) {
                setTimeLeft(0);
                if (onExpire) onExpire();
                return false;
            }
            setTimeLeft(diff);
            return true;
        };

        updateTimer();
        const interval = setInterval(() => {
            if (!updateTimer()) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, durationMinutes, onExpire]);

    if (timeLeft === null) return (
        <div className="glass" style={{ padding: '0.6rem 1.5rem', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 'bold' }}>
            SCANNING_CLOCK...
        </div>
    );

    const minutes = Math.floor((timeLeft / 1000) / 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);
    const isCritical = minutes < 5;

    return (
        <div className="glass" style={{ 
            padding: '0.5rem 1.2rem', 
            minWidth: '130px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            border: isCritical ? '1px solid var(--error)' : '1px solid var(--glass-border)',
            background: isCritical ? 'rgba(248, 113, 113, 0.05)' : 'var(--glass-bg)',
            transition: 'var(--transition)'
        }}>
            <Clock size={16} color={isCritical ? 'var(--error)' : 'var(--text-muted)'} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: '600', 
                    fontFamily: 'var(--font-mono)',
                    color: isCritical ? 'var(--error)' : 'var(--text-main)',
                    letterSpacing: '1px'
                }}>
                    {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </span>
            </div>
        </div>
    );
};
