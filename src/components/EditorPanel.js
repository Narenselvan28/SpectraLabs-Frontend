import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Send, Zap, AlertTriangle, ShieldCheck, Activity, FastForward, Clock, Database } from 'lucide-react';
import logo from '../1723176950534.jpeg';
import API_BASE_URL from '../apiConfig';

export const EditorPanel = ({ question, index, total, onRefresh, onComplete }) => {
    const getTemplate = (lang) => {
        switch(lang) {
            case 'python': return "def solution(input):\n    # Your logic here\n    return input";
            case 'java': return "public class Solution {\n    public static Object solution(Object input) {\n        // Your logic here\n        return input;\n    }\n}";
            case 'c': return "#include <stdio.h>\n#include <stdlib.h>\n\nint* solution(int* input, int size) {\n    // Your logic here\n    return input;\n}";
            case 'cpp': return "#include <iostream>\n#include <vector>\n\nusing namespace std;\n\nvector<int> solution(vector<int> input) {\n    // Your logic here\n    return input;\n}";
            default: return "function solution(input) {\n    // Your logic here\n    return input;\n}";
        }
    };

    const [selectedLanguage, setSelectedLanguage] = useState(() => {
        const qId = question.id || question._id;
        return localStorage.getItem(`spectra_lang_${qId}`) || question.language || 'javascript';
    });
    
    const [code, setCode] = useState(() => {
        const qId = question.id || question._id;
        return localStorage.getItem(`spectra_code_${qId}`) || getTemplate(question.language || 'javascript');
    });

    const handleLanguageChange = (lang) => {
        setSelectedLanguage(lang);
        const qId = question.id || question._id;
        localStorage.setItem(`spectra_lang_${qId}`, lang);
        const templ = getTemplate(lang);
        setCode(templ);
        localStorage.setItem(`spectra_code_${qId}`, templ);
    };

    const handleCodeChange = (val) => {
        setCode(val);
        const qId = question.id || question._id;
        localStorage.setItem(`spectra_code_${qId}`, val);
    };

    const handleBbInputChange = (val) => {
        setBbInput(val);
        const qId = question.id || question._id;
        localStorage.setItem(`spectra_bb_${qId}`, val);
    };
    
    // Timer State
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);

    // Custom Test State
    const [bbInput, setBbInput] = useState(() => {
        const qId = question.id || question._id;
        return localStorage.getItem(`spectra_bb_${qId}`) || '';
    });

    // State persistence handled by event handlers now (Fix #User-Request)
    const [bbOutput, setBbOutput] = useState(null);
    const [bbRunning, setBbRunning] = useState(false);
    const [testRunning, setTestRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [skipping, setSkipping] = useState(false);
    const [feedback, setFeedback] = useState(null);

    // Initialize/Sync Timer on question change
    useEffect(() => {
        const initMission = async () => {
            try {
                const qId = question.id || question._id;
                const res = await axios.post(`${API_BASE_URL}/api/challenges/start-question`, {
                    question_id: qId
                });
                if (res.data.success) {
                    setStartTime(Number(res.data.startTime));
                }
            } catch (err) {
                console.error("Failed to sync mission clock.");
            }
        };

        setFeedback(null);
        setBbOutput(null);
        initMission();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [question.id, question._id, question.language, onRefresh]);

    // Stopwatch logic with Drift Correction
    useEffect(() => {
        if (startTime) {
            // Calculate drift: difference between server start time and current client time
            // since we just fetched startTime, we assume it's "now" on server.
            // But startTime is the ORIGINAL start time. So we need the server's CURRENT time too.
            // Simplified: we'll just track the elapsed time from the moment we received it.
            if (timerRef.current) clearInterval(timerRef.current);
            
            const initialElapsed = Date.now() - startTime;
            setElapsedTime(initialElapsed > 0 ? initialElapsed : 0);

            timerRef.current = setInterval(() => {
                const now = Date.now();
                const currentElapsed = now - startTime;
                setElapsedTime(currentElapsed > 0 ? currentElapsed : 0);
            }, 1000);
        }
    }, [startTime]);

    // Fix #4: IGNORE ESC DURING CONTEST
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                console.log("[SpectraLabs] ESC suppressed during active mission.");
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Fix #7: Submit Debounce logic
    const [lastSubmitTime, setLastSubmitTime] = useState(0);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const validateInputInternal = (inputStr) => {
        const expectedType = question.input_type?.toLowerCase() || 'array';
        let parsed;
        let isValid = false;

        try {
            // STEP 1: Attempt JSON Parse for structured data (Arrays, Objects, Matrix)
            const trimmed = inputStr.trim();
            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || 
                (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (!isNaN(trimmed) && trimmed.length > 0)) {
                parsed = JSON.parse(trimmed);
            } else if (expectedType === 'string') {
                // If expected type is string and it's not bracketed, treat as raw string
                parsed = inputStr;
                isValid = true;
            } else {
                // Force parse for other types to keep consistency
                parsed = JSON.parse(inputStr);
            }
        } catch (e) {
            // STEP 2: Fallback for RAW STRINGS if type permits
            if (expectedType === 'string') {
                parsed = inputStr;
                isValid = true;
            } else {
                return { error: "Invalid JSON format. Check brackets and quotes for " + expectedType.toUpperCase() + " type." };
            }
        }

        if (!isValid) {
            switch(expectedType) {
                case "array": isValid = Array.isArray(parsed); break;
                case "number": isValid = typeof parsed === "number"; break;
                case "string": isValid = typeof parsed === "string"; break;
                case "matrix": isValid = Array.isArray(parsed) && (parsed.length === 0 || Array.isArray(parsed[0])); break;
                case "object": isValid = typeof parsed === "object" && !Array.isArray(parsed) && parsed !== null; break;
                default: isValid = true;
            }
        }

        if (!isValid) return { error: `Type Mismatch: Expected ${expectedType.toUpperCase()}` };
        return { success: true, parsed };
    };

    const runCustomTest = async () => {
        if (!bbInput) return;
        const validation = validateInputInternal(bbInput);
        if (validation.error) {
            setBbOutput(`Error: ${validation.error}`);
            return;
        }

        setBbRunning(true);
        try {
            const qId = question.id || question._id;
            const res = await axios.post(`${API_BASE_URL}/api/challenges/run`, {
                question_id: qId,
                input: bbInput
            });
            if (res.data.success) {
                setBbOutput(res.data.output);
            } else {
                setBbOutput(`Error: ${res.data.error}${res.data.hint ? `\nHint: ${res.data.hint}` : ''}`);
            }
        } catch (err) {
            const serverErr = err.response?.data;
            setBbOutput(serverErr?.error ? `Error: ${serverErr.error}${serverErr.hint ? `\nHint: ${serverErr.hint}` : ''}` : "Evaluation Error");
        } finally {
            setBbRunning(false);
        }
    };

    const runMyTest = async () => {
        if (!bbInput) return;
        const validation = validateInputInternal(bbInput);
        if (validation.error) {
            setBbOutput(`Error: ${validation.error}`);
            return;
        }

        setTestRunning(true);
        try {
            const qId = question.id || question._id;
            const res = await axios.post(`${API_BASE_URL}/api/challenges/test-code`, {
                question_id: qId,
                code: code,
                input: bbInput,
                language: selectedLanguage
            });
            if (res.data.success) {
                setBbOutput(res.data.output);
            } else {
                setBbOutput(`Error: ${res.data.error}${res.data.hint ? `\nHint: ${res.data.hint}` : ''}`);
            }
        } catch (err) {
            const serverErr = err.response?.data;
            setBbOutput(serverErr?.error ? `Error: ${serverErr.error}${serverErr.hint ? `\nHint: ${serverErr.hint}` : ''}` : "Evaluation Error");
        } finally {
            setTestRunning(false);
        }
    };

    const submitSolution = async () => {
        const now = Date.now();
        if (submitting || (now - lastSubmitTime < 2000)) return; // Fix #7: 2s debounce
        
        setLastSubmitTime(now);
        setSubmitting(true);
        setFeedback(null);

        const qId = question.id || question._id;
        const payload = {
            question_id: qId,
            code: code,
            language: selectedLanguage
        };

        const attemptSubmit = async (retryCount = 0) => {
            try {
                const res = await axios.post(`${API_BASE_URL}/api/challenges/submit`, payload, {
                    timeout: 15000 // 15-second timeout for slow networks
                });
                setFeedback({
                    success: res.data.success,
                    score: res.data.score,
                    error: res.data.error,
                    expected: res.data.expected,
                    received: res.data.received
                });
                
                if (res.data.success) {
                    const qId = question.id || question._id;
                    if (timerRef.current) clearInterval(timerRef.current);
                    localStorage.removeItem(`spectra_code_${qId}`);
                    localStorage.removeItem(`spectra_lang_${qId}`);
                    localStorage.removeItem(`spectra_bb_${qId}`);
                    // Success! No longer "uploading"
                    setSubmitting(false);
                    
                    if (index + 1 === total) {
                        setTimeout(() => onComplete(), 1000);
                    }
                    setTimeout(() => onRefresh(), 2000);
                } else {
                    setSubmitting(false);
                }
            } catch (err) {
                // Retry once on network timeout/error (backend is idempotent)
                if (retryCount === 0 && (!err.response || err.code === 'ECONNABORTED')) {
                    console.warn('[SpectraLabs] Network error, retrying submission...');
                    return attemptSubmit(1);
                }
                setFeedback({ success: false, error: err.response?.data?.error || "Network Error — Submission failed. Try again." });
                setSubmitting(false);
            }
        };

        await attemptSubmit();
    };

    const skipQuestion = async () => {
        if (!window.confirm("Are you sure? Skipping locks this data node securely. You cannot return.")) return;
        setSkipping(true);
        try {
            const qId = question.id || question._id;
            await axios.post(`${API_BASE_URL}/api/challenges/skip`, { question_id: qId });
            localStorage.removeItem(`spectra_code_${qId}`);
            localStorage.removeItem(`spectra_lang_${qId}`);
            localStorage.removeItem(`spectra_bb_${qId}`);
            onRefresh();
        } catch (err) {
            setSkipping(false);
        }
    };

    const formatOutput = (val) => {
        if (val === null || val === undefined) return "N/A";
        if (typeof val === 'object') return JSON.stringify(val, null, 2);
        try {
            // If it's a string, try to parse it. If it's valid JSON, pretty-print it.
            const parsed = JSON.parse(val);
            if (typeof parsed === 'object') return JSON.stringify(parsed, null, 2);
            return String(val);
        } catch (e) {
            return String(val);
        }
    };

    return (
        <div className="editor-layout">
            
            {/* Left Column: Problem & Custom Test */}
            <div className="left-pane">
                
                {/* Branding Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                    <img src={logo} alt="SL" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                    <span className="text-label" style={{ fontWeight: '800', fontSize: '12px', color: 'var(--primary)', letterSpacing: '2px' }}>SPECTRALABS MISSION</span>
                </div>

                {/* 1. Problem Description */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <div>
                            <span className="text-label" style={{ display: 'block', marginBottom: '4px' }}>
                                Mission {index + 1} of {total}
                            </span>
                            <h2 className="heading-title">{question.title}</h2>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                            <div className="glass-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px', color: 'var(--primary)' }}>
                                <Clock size={12} />
                                {formatTime(elapsedTime)}
                            </div>
                            <span style={{ 
                                fontSize: '11px', 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                background: 'var(--bg-elevated)',
                                color: question.difficulty === 'Easy' ? 'var(--success)' : question.difficulty === 'Medium' ? '#ffcc00' : 'var(--error)',
                                border: '1px solid currentColor',
                                fontWeight: '600'
                            }}>
                                {question.difficulty}
                            </span>
                        </div>
                    </div>
                    
                    <p className="text-body text-muted" style={{ marginBottom: '1.5rem', fontSize: '14px' }}>
                        Deduce the hidden pattern by utilizing the SpectraLabs Sandbox below. Construct the precise algorithm when ready.
                    </p>

                    {/* Mission Data Specification */}
                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(0, 245, 255, 0.15)', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                <Database size={14} color="var(--primary)" />
                                <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px' }}>MISSION_DATA_SPECIFICATION</h4>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>INPUT_TYPE</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{question.input_type?.toUpperCase() || 'ARRAY'}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>CONSTRAINTS</span>
                                    <span style={{ fontSize: '11px', color: 'var(--text-main)', fontWeight: '600' }}>{question.constraints || 'N/A'}</span>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>INPUT_FORMAT</span>
                                <div style={{ fontSize: '12px', lineHeight: '1.4', color: 'var(--text-main)' }}>{question.input_format || 'Deduce from provided data samples.'}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>EXAMPLE_INPUT</span>
                                    <div style={{ background: '#000', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--primary)', boxShadow: 'inset 0 0 5px rgba(0, 245, 255, 0.1)' }}>
                                        {question.example_input || 'N/A'}
                                    </div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>EXAMPLE_OUTPUT</span>
                                    <div style={{ background: '#000', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--success)' }}>
                                        {question.example_output || 'N/A'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Legacy Examples Fallback - Show only if explicitly needed or as secondary data */}
                        {JSON.parse(question.examples || "[]").length > 0 && (
                            <div style={{ padding: '0 1rem' }}>
                                <h5 style={{ fontSize: '9px', color: 'var(--muted)', marginBottom: '0.5rem' }}>ADDITIONAL_PROBES</h5>
                                {JSON.parse(question.examples || "[]").map((ex, i) => (
                                    <div key={i} style={{ marginBottom: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>
                                        <span className="text-muted">In: {JSON.stringify(ex.input)}</span> | <span className="text-success">Out: {JSON.stringify(ex.output)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Custom Test Panel */}
                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                        <Zap size={16} color="var(--accent)" />
                        <h3 className="heading-section">SpectraLabs Sandbox</h3>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '11px' }}>PROBE INPUT</label>
                        <textarea 
                            value={bbInput}
                            onChange={(e) => handleBbInputChange(e.target.value)}
                            placeholder="Input JSON data structure here..."
                            style={{ width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '13px' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button 
                            onClick={runCustomTest}
                            disabled={bbRunning || testRunning || submitting || skipping}
                            className="btn-accent"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', fontSize: '13px' }}
                        >
                            {bbRunning ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />}
                            Hidden Logic
                        </button>
                        
                        <button 
                            onClick={runMyTest}
                            disabled={bbRunning || testRunning || submitting || skipping}
                            className="btn-primary"
                            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.8rem', fontSize: '13px' }}
                        >
                            {testRunning ? <Activity className="animate-spin" size={16} /> : <Play size={16} />}
                            Test Code
                        </button>
                    </div>

                    {bbOutput !== null && (
                        <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <label className="text-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '11px' }}>SYSTEM OUTPUT</label>
                            <pre style={{ 
                                fontFamily: 'var(--font-mono)', 
                                color: String(bbOutput).startsWith('Error:') ? 'var(--error)' : 'var(--primary)', 
                                wordBreak: 'break-all',
                                whiteSpace: 'pre-wrap',
                                fontSize: '12px',
                                margin: 0
                            }}>
                                {typeof bbOutput === 'object' ? JSON.stringify(bbOutput, null, 2) : String(bbOutput)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Code Editor */}
            <div className="right-pane">
                <div className="glass solution-editor-card">
                    <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="heading-section" style={{ fontSize: '14px' }}>Solution Editor</span>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <select 
                                value={selectedLanguage}
                                onChange={(e) => handleLanguageChange(e.target.value)}
                                style={{
                                    background: 'var(--bg-main)',
                                    color: 'var(--primary)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="javascript">JAVASCRIPT</option>
                                <option value="python">PYTHON</option>
                                <option value="java">JAVA</option>
                                <option value="cpp">C++</option>
                                <option value="c">C</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <Editor
                            height="100%"
                            language={selectedLanguage}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => handleCodeChange(val)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: 'var(--font-mono)',
                                padding: { top: 20 },
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                backgroundColor: 'transparent',
                                borderRadius: '8px'
                            }}
                        />
                    </div>
                </div>

                {/* Feedback Panel */}
                {feedback && (
                    <div className="glass animate-fade-in" style={{ 
                        padding: '1.2rem', 
                        borderLeft: `4px solid ${feedback.success ? 'var(--success)' : 'var(--error)'}`,
                        background: feedback.success ? 'rgba(52, 211, 153, 0.05)' : 'rgba(248, 113, 113, 0.05)',
                        borderRadius: '8px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ color: feedback.success ? 'var(--success)' : 'var(--error)', fontSize: '14px', fontWeight: '600' }}>
                                {feedback.success ? 'MISSION SUCCESS' : 'SYSTEM MALFUNCTION: TEST FAILED'}
                            </h4>
                            {feedback.success && <span style={{ fontWeight: 'bold', color: 'var(--success)', fontSize: '14px' }}>+{feedback.score} XP</span>}
                        </div>
                        {feedback.error && (
                            <div style={{ marginTop: '1rem', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                                <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>DIAGNOSTICS: {feedback.error}</div>
                                {feedback.received !== undefined && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>EXPECTED</span>
                                            <pre style={{ background: '#000', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--success)', color: 'var(--success)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                                                {formatOutput(feedback.expected)}
                                            </pre>
                                        </div>
                                        <div>
                                            <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block' }}>RECEIVED</span>
                                            <pre style={{ background: '#000', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--error)', color: 'var(--error)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto' }}>
                                                {formatOutput(feedback.received)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Action Row - Strict Linear Flow */}
                <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                    <button 
                        onClick={skipQuestion}
                        disabled={submitting || skipping || feedback?.success}
                        className="btn-accent"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', fontSize: '14px' }}
                    >
                        {skipping ? <Activity className="animate-spin" size={18} /> : <FastForward size={18} />}
                        Skip Mission
                    </button>

                    <button 
                        onClick={submitSolution}
                        disabled={submitting || skipping || feedback?.success}
                        className="btn-primary"
                        style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', padding: '1rem', fontSize: '14px' }}
                    >
                        {submitting ? <Activity className="animate-spin" size={18} /> : <Send size={18} />}
                        {submitting ? "UPLOADING DATA..." : "Finalize Mission"}
                    </button>
                </div>
            </div>
            
        </div>
    );
};
