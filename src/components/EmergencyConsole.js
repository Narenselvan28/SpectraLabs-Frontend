import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldAlert, Play, Pause, Zap, ZapOff, Trash2 } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const EmergencyConsole = ({ onSync }) => {
    const [status, setStatus] = useState({ submissionsPaused: false, throttleExecution: false });
    const [isLoading, setIsLoading] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/admin/system-metrics`);
            setStatus(res.data.flags || { submissionsPaused: false, throttleExecution: false });
        } catch (e) {}
    };

    useEffect(() => { fetchStatus(); }, []);

    const handleAction = async (action) => {
        if (!window.confirm("Confirm emergency override?")) return;
        setIsLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/api/admin/emergency/${action}`);
            await fetchStatus();
            if (onSync) onSync();
        } catch (err) { alert("Action failed: " + err.message); }
        setIsLoading(false);
    };

    return (
        <div className="glass" style={{ padding: '1.5rem', borderRadius: '18px', border: '1px solid rgba(255, 50, 50, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <ShieldAlert className="text-error" style={{ filter: 'drop-shadow(0 0 10px rgba(255, 50, 50, 0.5))' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '2px', color: 'var(--primary)' }}>EMERGENCY_OVERRIDE_CONSOLE</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <button onClick={() => handleAction(status.submissionsPaused ? 'resume' : 'pause')} disabled={isLoading} className="glass-button" style={{ background: status.submissionsPaused ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 50, 50, 0.05)', padding: '1rem', borderRadius: '12px' }}>
                    {status.submissionsPaused ? <Play size={18} /> : <Pause size={18} />} {status.submissionsPaused ? 'RESUME_ARENA' : 'PAUSE_SUBMISSIONS'}
                </button>
                <button onClick={() => handleAction('throttle')} disabled={isLoading} className="glass-button" style={{ background: status.throttleExecution ? 'rgba(255, 166, 0, 0.1)' : 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                    {status.throttleExecution ? <ZapOff size={18} /> : <Zap size={18} />} {status.throttleExecution ? 'DISABLE_THROTTLE' : 'ENABLE_THROTTLE'}
                </button>
            </div>
        </div>
    );
};
export default EmergencyConsole;
