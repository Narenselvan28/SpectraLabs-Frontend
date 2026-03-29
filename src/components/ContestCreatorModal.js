import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { X, Plus, Trash2, Info, Code, Database, Save, CheckCircle2 } from 'lucide-react';
import API_BASE_URL from '../apiConfig';

const ContestCreatorModal = ({ isOpen, onClose, onRefresh }) => {
    const [contestData, setContestData] = useState({
        name: '',
        duration: 60,
        max_participants: 50,
        auto_gen_ids: false,
        questions: [{ 
            title: '', 
            difficulty: 'Medium', 
            base_score: 250, 
            language: 'javascript',
            input_type: 'array',
            input_format: '',
            constraints: '',
            example_input: '',
            example_output: '',
            hidden_logic: 'function solution(input) {\n  return input;\n}', 
            test_cases: [], 
            expected_outputs: [] 
        }]
    });

    const handleCreateContest = async () => {
        if (!contestData.name) return alert("MISSING_DATA: Contest name required.");
        const missingTitle = contestData.questions.some(q => !q.title.trim());
        if (missingTitle) {
            return alert("TASK_VALIDATION_ERROR: All mission tasks must have a valid title.");
        }
        try {
            await axios.post(`${API_BASE_URL}/api/admin/contests`, contestData, { withCredentials: true });
            onRefresh();
            onClose();
        } catch (err) {
            alert("TRANSMISSION_FAILED: " + (err.response?.data?.error || err.message));
        }
    };

    const addQuestion = () => {
        setContestData({
            ...contestData,
            questions: [...contestData.questions, { 
                title: '', 
                difficulty: 'Medium', 
                base_score: 250, 
                language: 'javascript',
                hidden_logic: 'function solution(input) {\n  return input;\n}', 
                test_cases: [], 
                expected_outputs: [] 
            }]
        });
    };

    const removeQuestion = (index) => {
        if (contestData.questions.length <= 1) return;
        const newQs = [...contestData.questions];
        newQs.splice(index, 1);
        setContestData({ ...contestData, questions: newQs });
    };

    const updateQuestion = (index, field, value) => {
        const newQs = [...contestData.questions];
        newQs[index] = { ...newQs[index], [field]: value };
        setContestData({ ...contestData, questions: newQs });
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '2rem' }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="glass" 
                style={{ width: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '3rem', position: 'relative', border: '1px solid var(--primary)' }}
            >
                <button onClick={onClose} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%' }}>
                    <X size={20} />
                </button>
                
                <header style={{ marginBottom: '3rem' }}>
                    <h2 className="glow-text" style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '2px' }}>NEW_MISSION_PARAMETRIC</h2>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', letterSpacing: '2px' }}>DEFINE ENVIRONMENT PARAMETERS AND LOGIC SETS</p>
                </header>

                {/* General Config */}
                <div className="glass-card" style={{ padding: '2rem', marginBottom: '3rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
                    <div style={{ gridColumn: 'span 3' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 'bold', display: 'block', marginBottom: '0.6rem' }}>MISSION_NOMENCLATURE</label>
                        <input value={contestData.name} onChange={e => setContestData({...contestData, name: e.target.value})} placeholder="e.g. CYBER_STORM_2026" style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.6rem' }}>DURATION_MINUTES</label>
                        <input type="number" value={contestData.duration} onChange={e => setContestData({...contestData, duration: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginBottom: '0.6rem' }}>OPERATOR_CAPACITY</label>
                        <input type="number" value={contestData.max_participants} onChange={e => setContestData({...contestData, max_participants: parseInt(e.target.value)})} style={{ width: '100%' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingTop: '1.5rem' }}>
                        <input type="checkbox" checked={contestData.auto_gen_ids} onChange={e => setContestData({...contestData, auto_gen_ids: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                        <label style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 'bold' }}>AUTO_PROVISION_UIDS</label>
                    </div>
                </div>

                {/* Problem Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Database size={24} color="var(--primary)" />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>SPECTRALABS_CHALLENGE_SET</h3>
                    </div>
                    <button onClick={addQuestion} className="btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Plus size={18} /> ADD_TASK
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {contestData.questions.map((q, i) => (
                        <div key={i} className="glass" style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderLeft: '4px solid var(--primary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ background: 'var(--primary)', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '900' }}>TASK_{i+1}</span>
                                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>{q.title || "UNTITLED_TASK"}</h4>
                                </div>
                                {contestData.questions.length > 1 && (
                                    <button onClick={() => removeQuestion(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                        <Trash2 size={14} /> REMOVE
                                        </button>
                                )}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>TASK_IDENTIFIER</label>
                                    <input placeholder="TASK_TITLE" value={q.title} onChange={e => updateQuestion(i, 'title', e.target.value)} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>DIFFICULTY_CLASS</label>
                                    <select value={q.difficulty} onChange={e => updateQuestion(i, 'difficulty', e.target.value)} style={{ width: '100%', background: '#111', color: 'white', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <option value="Easy">EASY (100 PTS)</option>
                                        <option value="Medium">MEDIUM (250 PTS)</option>
                                        <option value="Hard">HARD (500 PTS)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>COMPILER_ENV</label>
                                    <select value={q.language} onChange={e => updateQuestion(i, 'language', e.target.value)} style={{ width: '100%', background: '#111', color: 'white', padding: '0.8rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <option value="javascript">JAVASCRIPT_V8</option>
                                        <option value="python">PYTHON_3.x</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                    <Code size={14} color="var(--primary)" />
                                    <label style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold' }}>HIDDEN_LOGIC_WRAPPER</label>
                                    <span style={{ fontSize: '0.6rem', color: 'var(--muted)', marginLeft: '0.5rem' }}>(Admin implementation for Blackbox System)</span>
                                </div>
                                <textarea value={q.hidden_logic} onChange={e => updateQuestion(i, 'hidden_logic', e.target.value)} style={{ width: '100%', height: '140px', fontSize: '0.85rem' }} />
                            </div>

                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(0, 245, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(0, 245, 255, 0.1)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
                                    <Database size={16} color="var(--primary)" />
                                    <h5 style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '1px' }}>INPUT_CONFIGURATION</h5>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>DATA_TYPE (MACHINE_VALIDATED)</label>
                                        <select value={q.input_type} onChange={e => updateQuestion(i, 'input_type', e.target.value)} style={{ width: '100%', background: '#000', color: 'var(--primary)', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--primary-soft)', fontSize: '0.7rem' }}>
                                            <option value="number">NUMBER</option>
                                            <option value="array">ARRAY</option>
                                            <option value="string">STRING</option>
                                            <option value="object">OBJECT</option>
                                            <option value="matrix">MATRIX (ARRAY_OF_ARRAYS)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>FORMAT_EXPLANATION (HUMAN_READABLE)</label>
                                        <input placeholder="e.g. Array of integers separated by comma" value={q.input_format} onChange={e => updateQuestion(i, 'input_format', e.target.value)} style={{ width: '100%', fontSize: '0.75rem' }} />
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>CONSTRAINTS (DOMAIN_RULES)</label>
                                    <input placeholder="e.g. 1 ≤ N ≤ 1000" value={q.constraints} onChange={e => updateQuestion(i, 'constraints', e.target.value)} style={{ width: '100%', fontSize: '0.75rem' }} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>EXAMPLE_INPUT (SHOWN_TO_USER)</label>
                                        <textarea value={q.example_input} onChange={e => updateQuestion(i, 'example_input', e.target.value)} placeholder="[12, 7, 15]" style={{ width: '100%', height: '60px', fontSize: '0.75rem' }} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.6rem', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>EXAMPLE_OUTPUT</label>
                                        <textarea value={q.example_output} onChange={e => updateQuestion(i, 'example_output', e.target.value)} placeholder="[7, 2]" style={{ width: '100%', height: '60px', fontSize: '0.75rem' }} />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                        <Info size={14} color="var(--muted)" />
                                        <label style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: 'bold' }}>TEST_VECTORS (SECRET_VALS_ARRAY)</label>
                                    </div>
                                    <input placeholder='[10, 20, 30]' onChange={e => {
                                         try { updateQuestion(i, 'test_cases', JSON.parse(e.target.value)); } catch(e){}
                                    }} style={{ width: '100%' }} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                                        <CheckCircle2 size={14} color="var(--success)" />
                                        <label style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>EXPECTED_OUTPUTS (SECRET_RESULT_ARRAY)</label>
                                    </div>
                                    <input placeholder='[100, 400, 900]' onChange={e => {
                                         try { updateQuestion(i, 'expected_outputs', JSON.parse(e.target.value)); } catch(e){}
                                    }} style={{ width: '100%' }} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '4rem', display: 'flex', gap: '1.5rem' }}>
                    <button onClick={onClose} className="btn-accent" style={{ flex: 1, color: 'var(--muted)', borderColor: 'var(--border)' }}>ABORT_MISSION</button>
                    <button onClick={handleCreateContest} className="btn-primary" style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <Save size={20} /> FINALIZE_MISSION_PROVISIONING
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default ContestCreatorModal;
