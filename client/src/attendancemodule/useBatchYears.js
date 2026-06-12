// client/src/attendancemodule/useBatchYears.js
// Fetches available batch years from the settings API so year dropdowns
// always reflect what has actually been configured in Batch Management.

import { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

const apiUrl = getEnvironment();

export function useBatchYears() {
    const [batchYears,        setBatchYears]        = useState([]);
    const [batchYearsLoading, setBatchYearsLoading] = useState(true);
    const [batchYearsError,   setBatchYearsError]   = useState(null);

    useEffect(() => {
        let cancelled = false;
        setBatchYearsLoading(true);
        setBatchYearsError(null);

        fetch(`${apiUrl}/attendancemodule/settings/batches`, { credentials: 'include' })
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load batches')))
            .then(data => {
                if (cancelled) return;
                const years = [...new Set(
                    (data.batches || []).map(b => b.batchYear).filter(Boolean)
                )].sort().reverse();
                setBatchYears(years);
            })
            .catch(err => { if (!cancelled) setBatchYearsError(err.message); })
            .finally(() => { if (!cancelled) setBatchYearsLoading(false); });

        return () => { cancelled = true; };
    }, []);

    return { batchYears, batchYearsLoading, batchYearsError };
}
