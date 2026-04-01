// client/src/attendancemodule/useDepartments.js
// Shared hook — fetches department list from the DB so batch folder names
// always match the exact dept string stored in the TimeTable collection.

import { useState, useEffect } from 'react';
import { API_BASE } from './config';

export function useDepartments() {
    const [departments, setDepartments] = useState([]);
    const [deptLoading, setDeptLoading] = useState(true);
    const [deptError,   setDeptError]   = useState(null);

    useEffect(() => {
        let cancelled = false;
        setDeptLoading(true);
        fetch(`${API_BASE}/departments`)
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                if (data.departments && data.departments.length > 0) {
                    // Deduplicate after sanitizing spaces → underscores
                    // so "CIVIL ENGINEERING" and "CIVIL_ENGINEERING" merge to one entry
                    const seen = new Set();
                    const sanitized = [];
                    for (const d of data.departments) {
                        const safe = (d.dept || '').trim().replace(/\s+/g, '_');
                        if (safe && !seen.has(safe.toUpperCase())) {
                            seen.add(safe.toUpperCase());
                            sanitized.push(safe);
                        }
                    }
                    setDepartments(sanitized);
                } else {
                    setDeptError('No departments found in DB');
                }
            })
            .catch(err => { if (!cancelled) setDeptError(err.message); })
            .finally(() => { if (!cancelled) setDeptLoading(false); });
        return () => { cancelled = true; };
    }, []);

    return { departments, deptLoading, deptError };
}
