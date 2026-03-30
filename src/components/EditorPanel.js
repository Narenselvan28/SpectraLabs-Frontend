import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { Play, Send, Zap, AlertTriangle, ShieldCheck, Activity, FastForward, Clock, Database } from 'lucide-react';
import logo from '../1723176950534.jpeg';
import API_BASE_URL from '../apiConfig';

export const EditorPanel = ({ question, index, total, onRefresh, onComplete }) => {
    const qId = question.id || question._id;

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
        return localStorage.getItem(`spectra_active_lang_${qId}`) || question.language || 'java';
    });
    
    const [code, setCode] = useState(() => {
        const lang = localStorage.getItem(`spectra_active_lang_${qId}`) || question.language || 'java';
        return localStorage.getItem(`spectra_code_${qId}_${lang}`) || getTemplate(lang);
    });

    const handleLanguageChange = (lang) => {
        setSelectedLanguage(lang);
        localStorage.setItem(`spectra_active_lang_${qId}`, lang);
        
        const cached = localStorage.getItem(`spectra_code_${qId}_${lang}`);
        if (cached) {
            setCode(cached);
        } else {
            const templ = getTemplate(lang);
            setCode(templ);
            localStorage.setItem(`spectra_code_${qId}_${lang}`, templ);
        }
    };

    const handleCodeChange = (val) => {
        setCode(val);
        localStorage.setItem(`spectra_code_${qId}_${selectedLanguage}`, val);
    };

    const handleBbInputChange = (val) => {
        setBbInput(val);
        localStorage.setItem(`spectra_bb_${qId}`, val);
    };
    
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);

    const [bbInput, setBbInput] = useState(() => {
        return localStorage.getItem(`spectra_bb_${qId}`) || '';
    });

    const [bbOutput, setBbOutput] = useState(null);
    const [bbRunning, setBbRunning] = useState(false);
    const [testRunning, setTestRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [skipping, setSkipping] = useState(false);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        const initMission = async () => {
            try {
                const res = await axios.post(`${API_BASE_URL}/api/challenges/start-question`, {
                    question_id: qId
                });
                if (res.data.success) {
                    setStartTime(Number(res.data.startTime));
                }
            } catch (err) {
                console.error("Failed to sync contest clock.");
            }
        };

        setFeedback(null);
        setBbOutput(null);
        initMission();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [qId]);

    useEffect(() => {
        if (startTime) {
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

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const runCustomTest = async () => {
        if (!bbInput) return;
        setBbRunning(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/challenges/run`, {
                question_id: qId,
                input: bbInput
            });
            if (res.data.success) {
                setBbOutput(res.data.output);
            } else {
                setBbOutput(`Error: ${res.data.error}`);
            }
        } catch (err) {
            setBbOutput("Evaluation Error");
        } finally {
            setBbRunning(false);
        }
    };

    const runMyTest = async () => {
        if (!bbInput) return;
        setTestRunning(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/challenges/test-code`, {
                question_id: qId,
                code: code,
                input: bbInput,
                language: selectedLanguage
            });
            if (res.data.success) {
                setBbOutput(res.data.output);
            } else {
                setBbOutput(`Error: ${res.data.error}`);
            }
        } catch (err) {
            setBbOutput("Evaluation Error");
        } finally {
            setTestRunning(false);
        }
    };

    const submitSolution = async () => {
        const now = Date.now();
        if (submitting) return;
        setSubmitting(true);
        setFeedback(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/challenges/submit`, {
                question_id: qId,
                code: code,
                language: selectedLanguage
            });
            setFeedback({
                success: res.data.success,
                score: res.data.score,
                error: res.data.error,
                expected: res.data.expected,
                received: res.data.received
            });
            if (res.data.success) {
                const langs = ['java', 'python', 'javascript', 'cpp', 'c'];
                langs.forEach(l => localStorage.removeItem(`spectra_code_${qId}_${l}`));
                localStorage.removeItem(`spectra_active_lang_${qId}`);
                localStorage.removeItem(`spectra_bb_${qId}`);
                setTimeout(() => onRefresh(), 2000);
            }
        } catch (err) {
            setFeedback({ success: false, error: "Submission failed. Try again." });
        } finally {
            setSubmitting(false);
        }
    };

    const skipQuestion = async () => {
        if (!window.confirm("Are you sure? This cannot be undone.")) return;
        setSkipping(true);
        try {
            await axios.post(`${API_BASE_URL}/api/challenges/skip`, { question_id: qId });
            onRefresh();
        } catch (err) {} finally { setSkipping(false); }
    };

    return (
        <div className="editor-layout">
            <div className="left-pane">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.5rem 0' }}>
                    <img src={logo} alt="SL" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                    <span className="text-label" style={{ fontWeight: '800', fontSize: '12px', color: 'var(--primary)', letterSpacing: '2px' }}>CONTEST SYSTEM</span>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div className="flex-between" style={{ marginBottom: '1rem' }}>
                        <div>
                            <span className="text-label" style={{ display: 'block', marginBottom: '4px' }}>{index + 1}</span>
                            <h2 className="heading-title">{question.title}</h2>
                        </div>
                        <div className="glass-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '4px 10px', color: 'var(--primary)' }}>
                            <Clock size={12} /> {formatTime(elapsedTime)}
                        </div>
                    </div>
                    
                    <p className="text-body text-muted" style={{ marginBottom: '1.5rem', fontSize: '14px' }}>
                        Solve the logic by using the Sandbox below. Click submit when your code is ready.
                    </p>

                    <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(0, 245, 255, 0.15)', background: 'rgba(0,0,0,0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                                <Database size={14} color="var(--primary)" />
                                <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'var(--primary)', letterSpacing: '2px' }}>QUESTION DETAILS</h4>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>TYPE</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{question.input_type?.toUpperCase() || 'ARRAY'}</span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>RULES</span>
                                    <span style={{ fontSize: '11px', fontWeight: '600' }}>{question.constraints || 'N/A'}</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>SAMPLE INPUT</span>
                                    <div style={{ background: '#000', padding: '0.6rem', borderRadius: '4px', fontSize: '11px', color: 'var(--primary)' }}>{question.example_input || 'N/A'}</div>
                                </div>
                                <div>
                                    <span style={{ fontSize: '9px', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>SAMPLE OUTPUT</span>
                                    <div style={{ background: '#000', padding: '0.6rem', borderRadius: '4px', fontSize: '11px', color: 'var(--success)' }}>{question.example_output || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.2rem' }}>
                        <Zap size={16} color="var(--accent)" />
                        <h3 className="heading-section">Sandbox</h3>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label className="text-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '11px' }}>TEST INPUT</label>
                        <textarea value={bbInput} onChange={(e) => handleBbInputChange(e.target.value)} placeholder="Type input here..." style={{ width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '13px' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                        <button onClick={runCustomTest} disabled={bbRunning} className="btn-accent" style={{ flex: 1, padding: '0.8rem', fontSize: '13px' }}>
                            {bbRunning ? "Running..." : "Test Patterns"}
                        </button>
                        <button onClick={runMyTest} disabled={testRunning} className="btn-primary" style={{ flex: 1, padding: '0.8rem', fontSize: '13px' }}>
                            {testRunning ? "Testing..." : "Test Code"}
                        </button>
                    </div>

                    {bbOutput !== null && (
                        <div style={{ marginTop: '1.2rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                            <label className="text-label" style={{ display: 'block', marginBottom: '0.5rem', fontSize: '11px' }}>RESULT</label>
                            <pre style={{ color: 'var(--primary)', fontSize: '12px', margin: 0 }}>{String(bbOutput)}</pre>
                        </div>
                    )}
                </div>
            </div>

            <div className="right-pane">
                <div className="glass solution-editor-card">
                    <div style={{ background: 'var(--bg-elevated)', padding: '0.8rem 1.5rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="heading-section" style={{ fontSize: '14px' }}>Write Code</span>
                        <select value={selectedLanguage} onChange={(e) => handleLanguageChange(e.target.value)} style={{ background: 'var(--bg-main)', color: 'var(--primary)', padding: '4px 8px', fontSize: '11px', borderRadius: '6px' }}>
                            <option value="java">JAVA</option>
                            <option value="python">PYTHON</option>
                            <option value="javascript">JAVASCRIPT</option>
                            <option value="cpp">C++</option>
                            <option value="c">C</option>
                        </select>
                    </div>
                    <Editor height="100%" language={selectedLanguage} theme="vs-dark" value={code} onChange={(val) => handleCodeChange(val)} options={{ minimap: { enabled: false }, fontSize: 14 }} />
                </div>

                {feedback && (
                    <div className="glass animate-fade-in" style={{ padding: '1.2rem', borderLeft: `4px solid ${feedback.success ? 'var(--success)' : 'var(--error)'}`, background: 'rgba(255,255,255,0.02)' }}>
                        <h4 style={{ color: feedback.success ? 'var(--success)' : 'var(--error)', fontSize: '14px' }}>{feedback.success ? 'CORRECT' : 'WRONG ANSWER'}</h4>
                        {!feedback.success && feedback.error && <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '0.5rem' }}>Reason: {feedback.error}</div>}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                    <button onClick={skipQuestion} disabled={submitting || skipping} className="btn-accent" style={{ flex: 1, padding: '1rem' }}>Skip</button>
                    <button onClick={submitSolution} disabled={submitting} className="btn-primary" style={{ flex: 2, padding: '1rem' }}>Submit Code</button>
                </div>
            </div>
        </div>
    );
};
