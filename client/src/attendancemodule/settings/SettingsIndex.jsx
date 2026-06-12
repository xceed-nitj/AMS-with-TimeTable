import React from 'react';
import { useNavigate } from 'react-router-dom';
import { theme, styles, cssReset } from '../config';

export default function SettingsIndex() {
    const navigate = useNavigate();

    return (
        <div style={{ ...styles.page, padding: 24, boxSizing: 'border-box' }}>
            <style>{cssReset}</style>
            
            <div style={{ marginBottom: 24 }}>
                <div style={styles.heading}>Settings</div>
                <div style={styles.subheading}>Manage your AMS system preferences and configurations.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                {/* Batch Management Card */}
                <div 
                    onClick={() => navigate('/attendance/settings/batches')}
                    style={{ 
                        ...styles.card, 
                        cursor: 'pointer',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        border: `1px solid ${theme.border}`,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)';
                        e.currentTarget.style.borderColor = theme.accent;
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(26,31,60,0.04)';
                        e.currentTarget.style.borderColor = theme.border;
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 8,
                            background: '#64748b1a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginRight: 16
                        }}>
                            {/* Icon placeholder using emoji for simplicity, similar to typical UI elements */}
                            <span style={{ fontSize: 20 }}>📁</span>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: theme.text }}>Batch Management</h3>
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '13.5px', color: theme.textMuted, lineHeight: 1.5 }}>
                        Configure explicit batch identifiers used to structure the ERP Image Upload folders.
                    </p>
                </div>
            </div>
        </div>
    );
}
