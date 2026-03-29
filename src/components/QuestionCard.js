import React from 'react';
import { motion } from 'framer-motion';

export const QuestionCard = ({ question, isActive, onClick }) => {
    const isSolved = question.solved; 

    return (
        <motion.div
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="glass-card"
            style={{
                width: '180px',
                minWidth: '180px',
                padding: '1.2rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.8rem',
                position: 'relative',
                borderWidth: isActive ? '2px' : '1px',
                borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                background: isActive ? 'rgba(0, 245, 255, 0.08)' : 'var(--glass)',
                boxShadow: isActive ? '0 0 20px rgba(0, 245, 255, 0.2)' : 'none'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: '800', letterSpacing: '1px' }}>
                    Q{String(question.id).padStart(2, '0')}
                </span>
                {isSolved && (
                    <span style={{ fontSize: '0.65rem', fontWeight: '900', color: 'var(--success)' }}>SOLVED</span>
                )}
            </div>

            <h4 style={{ 
                fontSize: '0.9rem', 
                fontWeight: '700', 
                margin: '0.2rem 0', 
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis',
                color: isActive ? 'white' : 'var(--text)'
            }}>
                {question.title}
            </h4>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                <span style={{ 
                    fontSize: '0.6rem', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    background: 'rgba(0,0,0,0.3)',
                    color: question.difficulty === 'Easy' ? 'var(--success)' : question.difficulty === 'Medium' ? '#ffcc00' : 'var(--error)',
                    fontWeight: 'bold'
                }}>
                    {question.difficulty.toUpperCase()}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: '600' }}>{question.base_score} pts</span>
            </div>

            {isActive && (
                <motion.div 
                    layoutId="active-indicator"
                    style={{ 
                        position: 'absolute', 
                        bottom: '-1.5rem', 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        width: '30px',
                        height: '4px',
                        background: 'var(--primary)',
                        borderRadius: '2px',
                        boxShadow: '0 0 10px var(--primary)'
                    }} 
                />
            )}
        </motion.div>
    );
};
