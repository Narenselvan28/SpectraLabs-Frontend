import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ShieldCheck } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const SecretAdminLogin = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const authorize = async () => {
            try {
                console.warn("[ADMIN_AUTH] INITIATING_OVERRIDE: Establishing mission control credentials...");
                // Trigger the backend to set the admin session
                const res = await axios.get(`${API_BASE_URL}/api/auth/secret-admin-login`, { withCredentials: true });
                console.log("[ADMIN_AUTH] UPLINK_SUCCESS:", res.data);
                
                // Clear any residual team session data to prevent cross-contamination
                localStorage.clear();
                
                // Cache admin state to prevent redirect-on-refresh in AdminPanel
                localStorage.setItem('spectra_admin_active', 'true');
                
                // Add a small delay for session commitment and visual feedback
                setTimeout(() => {
                    console.log("[ADMIN_AUTH] AUTHORIZATION_CONFIRMED. DIVERTING_TO_CONTROL_CENTER.");
                    navigate('/adminatecespectrumofficial/admin');
                }, 2000);
            } catch (err) {
                console.error("[ADMIN_AUTH] OVERRIDE_FAILED:", err.response?.data || err.message);
                setTimeout(() => navigate('/'), 3000);
            }
        };
        authorize();
    }, [navigate]);

    return (
        <div style={{ 
            height: '100vh', 
            background: 'var(--bg-main)', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            color: 'var(--primary)',
            fontFamily: 'var(--font-mono)'
        }}>
            <ShieldCheck size={48} className="animate-pulse" style={{ marginBottom: '2rem' }} />
            <h2 style={{ letterSpacing: '4px', fontSize: '1.2rem' }}>AUTHORIZING_ADMIN_NODE...</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '1rem' }}>ENCRYPTED_TUNNEL_ESTABLISHED</p>
        </div>
    );
};

export default SecretAdminLogin;
