import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    LabelList,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import getEnvironment from '../getenvironment';
import { styles, theme } from './config';

const apiUrl = getEnvironment();

const panelBase = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 8,
};

function formatCount(value) {
    return Number(value || 0).toLocaleString('en-IN');
}

function formatPercent(value) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    return `${safeValue}%`;
}

function buildSummary(groundTruthRows, embeddingRows) {
    const erpPhotoCount = groundTruthRows.reduce((sum, item) => sum + (item.erpPhotoCount || 0), 0);
    const approvedAssignments = groundTruthRows.reduce((sum, item) => sum + (item.approvedAssignments || 0), 0);
    const theorySubjects = embeddingRows.reduce((sum, item) => sum + (item.totalSubjects || 0), 0);
    const completedSubjectEmbeddings = embeddingRows.reduce((sum, item) => sum + (item.completedSubjects || 0), 0);

    return {
        erpPhotoCount,
        approvedAssignments,
        theorySubjects,
        completedSubjectEmbeddings,
        groundTruthProgressPct: erpPhotoCount > 0 ? Math.round((approvedAssignments / erpPhotoCount) * 100) : 0,
        embeddingProgressPct: theorySubjects > 0 ? Math.round((completedSubjectEmbeddings / theorySubjects) * 100) : 0,
    };
}

function buildBranchOverview(data, departments) {
    return departments.map((department) => {
        const groundTruthRows = (data.groundTruthProgress || [])
            .filter((row) => row.departmentKey === department.key);
        const embeddingRows = (data.embeddingProgress || [])
            .filter((row) => row.departmentKey === department.key);
        const summary = buildSummary(groundTruthRows, embeddingRows);

        return {
            departmentKey: department.key,
            label: department.label,
            rollProgressPct: summary.groundTruthProgressPct,
            embeddingProgressPct: summary.embeddingProgressPct,
            approvedAssignments: summary.approvedAssignments,
            erpPhotoCount: summary.erpPhotoCount,
            completedSubjectEmbeddings: summary.completedSubjectEmbeddings,
            theorySubjects: summary.theorySubjects,
        };
    });
}

function LoadingPanel({ compact, text }) {
    return (
        <section style={{ ...styles.card, marginTop: compact ? 18 : 0, color: theme.textMuted }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                    width: 16,
                    height: 16,
                    border: `2px solid ${theme.border}`,
                    borderTopColor: theme.accent,
                    borderRadius: '50%',
                    animation: 'spin .8s linear infinite',
                    flex: '0 0 auto',
                }} />
                {text}
            </div>
        </section>
    );
}

function EmptyState({ children }) {
    return (
        <div style={{
            padding: '30px 18px',
            textAlign: 'center',
            color: theme.textMuted,
            fontSize: 13,
            border: `1px dashed ${theme.border}`,
            borderRadius: 8,
            background: '#fbfcff',
        }}>
            {children}
        </div>
    );
}

function ProgressRing({ value, color }) {
    const safeValue = Math.max(0, Math.min(100, Number(value) || 0));
    return (
        <div style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            background: `conic-gradient(${color} ${safeValue * 3.6}deg, ${theme.surfaceAlt} 0deg)`,
            display: 'grid',
            placeItems: 'center',
            flex: '0 0 auto',
            transition: 'background .35s ease',
        }}>
            <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: theme.surface,
                display: 'grid',
                placeItems: 'center',
                color,
                fontFamily: theme.fontMono,
                fontWeight: 700,
                fontSize: 18,
            }}>
                {formatPercent(safeValue)}
            </div>
        </div>
    );
}

function MetricPanel({ color, detail, label, value }) {
    return (
        <div style={{
            ...panelBase,
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            minHeight: 128,
        }}>
            <ProgressRing value={value} color={color} />
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: theme.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0 }}>
                    {label}
                </div>
                <div style={{ marginTop: 8, fontSize: 20, color: theme.text, fontWeight: 700, lineHeight: 1.2 }}>
                    {formatPercent(value)}
                </div>
                <div style={{ marginTop: 6, color: theme.textMuted, fontSize: 12, lineHeight: 1.45 }}>
                    {detail}
                </div>
            </div>
        </div>
    );
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload || {};
    return (
        <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            boxShadow: '0 8px 22px rgba(26,31,60,0.14)',
            fontSize: 12,
        }}>
            <div style={{ color: theme.text, fontWeight: 700, marginBottom: 6 }}>{label}</div>
            {'approvedAssignments' in row && (
                <>
                    <div style={{ color: theme.textMuted }}>
                        Approved {formatCount(row.approvedAssignments)} of {formatCount(row.erpPhotoCount)} ERP photos
                    </div>
                    {row.approvedRecordCount > row.approvedAssignments && (
                        <div style={{ marginTop: 5, color: theme.textMuted }}>
                            {formatCount(row.approvedRecordCount)} approved records, counted by unique ERP roll numbers.
                        </div>
                    )}
                    {row.outOfBatchApprovedAssignments > 0 && (
                        <div style={{ marginTop: 5, color: theme.warning, fontWeight: 700 }}>
                            {formatCount(row.outOfBatchApprovedAssignments)} approved roll numbers are outside this ERP batch.
                        </div>
                    )}
                    {!row.hasErpBatch && row.approvedAssignments > 0 && (
                        <div style={{ marginTop: 5, color: theme.danger, fontWeight: 700 }}>
                            ERP photo batch is missing, so progress cannot be calculated.
                        </div>
                    )}
                </>
            )}
            {'completedSubjects' in row && (
                <div style={{ color: theme.textMuted }}>
                    Completed {formatCount(row.completedSubjects)} of {formatCount(row.totalSubjects)} theory subjects
                </div>
            )}
            <div style={{ marginTop: 5, color: payload[0].fill || theme.accent, fontWeight: 700 }}>
                Progress {formatPercent(row.progressPct)}
            </div>
        </div>
    );
}

function OverviewTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    const row = payload[0]?.payload || {};
    return (
        <div style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: '10px 12px',
            boxShadow: '0 8px 22px rgba(26,31,60,0.14)',
            fontSize: 12,
        }}>
            <div style={{ color: theme.text, fontWeight: 700, marginBottom: 7 }}>{label}</div>
            <div style={{ color: theme.textMuted }}>
                Roll assignment: <strong style={{ color: theme.success }}>{formatPercent(row.rollProgressPct)}</strong>
                {' '}({formatCount(row.approvedAssignments)} of {formatCount(row.erpPhotoCount)})
            </div>
            <div style={{ marginTop: 5, color: theme.textMuted }}>
                Subject embeddings: <strong style={{ color: theme.warning }}>{formatPercent(row.embeddingProgressPct)}</strong>
                {' '}({formatCount(row.completedSubjectEmbeddings)} of {formatCount(row.theorySubjects)})
            </div>
        </div>
    );
}

function SectionHeader({ title, subtitle }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: theme.text }}>{title}</div>
            <div style={{ marginTop: 3, fontSize: 12, color: theme.textMuted }}>{subtitle}</div>
        </div>
    );
}

function compactDepartmentLabel(value) {
    const text = String(value || '').trim();
    return text
        .replace(/\bAnd\b/g, '&')
        .replace(/\bEngineering\b/g, 'Engg')
        .replace(/\bCommunication\b/g, 'Comm')
        .replace(/\bElectronics\b/g, 'Electronics')
        .replace(/\bInstrumentation\b/g, 'Instr')
        .replace(/\bControl\b/g, 'Ctrl');
}

function BranchOverviewChart({ rows, selectedDepartment, onSelectDepartment }) {
    if (!rows.length) return null;

    return (
        <div style={{ ...panelBase, padding: 16, marginBottom: 14 }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 10,
            }}>
                <SectionHeader
                    title="All Branches Overview"
                    subtitle="ERP-backed branch comparison for institute admin."
                />
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11, color: theme.textMuted }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: theme.success }} />
                        Roll
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 2, background: theme.warning }} />
                        Embeddings
                    </span>
                </div>
            </div>

            <div style={{ height: Math.max(210, rows.length * 58) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={rows}
                        layout="vertical"
                        margin={{ top: 6, right: 36, left: 18, bottom: 8 }}
                        barCategoryGap={16}
                        onClick={(event) => {
                            const key = event?.activePayload?.[0]?.payload?.departmentKey;
                            if (key) onSelectDepartment(key);
                        }}
                    >
                        <CartesianGrid stroke={theme.border} strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={formatPercent}
                            tick={{ fontSize: 11, fill: theme.textMuted }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={180}
                            tick={{ fontSize: 11, fill: theme.textMuted }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<OverviewTooltip />} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                        <Bar
                            dataKey="rollProgressPct"
                            name="Roll assignment"
                            fill={theme.success}
                            radius={[0, 5, 5, 0]}
                            isAnimationActive
                            animationBegin={80}
                            animationDuration={800}
                            style={{ cursor: 'pointer' }}
                        >
                            <LabelList
                                dataKey="rollProgressPct"
                                position="right"
                                formatter={formatPercent}
                                style={{ fill: theme.success, fontSize: 10, fontWeight: 700 }}
                            />
                        </Bar>
                        <Bar
                            dataKey="embeddingProgressPct"
                            name="Subject embeddings"
                            fill={theme.warning}
                            radius={[0, 5, 5, 0]}
                            isAnimationActive
                            animationBegin={160}
                            animationDuration={800}
                            style={{ cursor: 'pointer' }}
                        >
                            <LabelList
                                dataKey="embeddingProgressPct"
                                position="right"
                                formatter={formatPercent}
                                style={{ fill: theme.warning, fontSize: 10, fontWeight: 700 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 8, color: theme.textMuted, fontSize: 11 }}>
                Selected branch: <strong style={{ color: theme.text }}>
                    {rows.find((row) => row.departmentKey === selectedDepartment)?.label || 'None'}
                </strong>
            </div>
        </div>
    );
}

function BatchChart({ rows }) {
    const batches = rows
        .flatMap((row) => (row.batches || []).map((batch) => ({
            ...batch,
            label: `${batch.degree || ''} ${compactDepartmentLabel(row.department)} ${batch.year || batch.batch}${batch.hasErpBatch === false ? ' (ERP missing)' : ''}`.trim(),
            progressLabel: batch.hasErpBatch === false && batch.approvedAssignments > 0
                ? 'ERP missing'
                : formatPercent(batch.progressPct),
        })))
        .sort((a, b) => String(a.year).localeCompare(String(b.year)) || a.batch.localeCompare(b.batch));

    if (!batches.length) {
        return <EmptyState>No ERP photo batches are available for this department yet.</EmptyState>;
    }

    return (
        <div style={{ ...panelBase, padding: 16 }}>
            <SectionHeader
                title="Roll Assignment by Batch"
                subtitle="Approved roll assignments measured against ERP photo count."
            />
            <div style={{ height: Math.max(190, batches.length * 50) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={batches}
                        layout="vertical"
                        margin={{ top: 8, right: 46, left: 8, bottom: 8 }}
                        barCategoryGap={18}
                    >
                        <CartesianGrid stroke={theme.border} strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={formatPercent}
                            tick={{ fontSize: 11, fill: theme.textMuted }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={160}
                            tick={{ fontSize: 11, fill: theme.textMuted }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(16,185,129,0.06)' }} />
                        <Bar
                            dataKey="progressPct"
                            name="Batch progress"
                            radius={[0, 6, 6, 0]}
                            isAnimationActive
                            animationBegin={120}
                            animationDuration={850}
                        >
                            {batches.map((batch) => (
                                <Cell key={batch.batch} fill={theme.success} />
                            ))}
                            <LabelList
                                dataKey="progressLabel"
                                position="right"
                                style={{ fill: theme.success, fontSize: 11, fontWeight: 700 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function SemesterChart({ rows }) {
    const semesters = [...rows]
        .map((row) => ({
            ...row,
            label: `Sem ${row.sem}`,
        }))
        .sort((a, b) => {
            const aSem = Number(a.sem);
            const bSem = Number(b.sem);
            if (!Number.isNaN(aSem) && !Number.isNaN(bSem)) return aSem - bSem;
            return String(a.sem).localeCompare(String(b.sem));
        });

    if (!semesters.length) {
        return <EmptyState>No theory-subject embedding progress is available for this department yet.</EmptyState>;
    }

    return (
        <div style={{ ...panelBase, padding: 16 }}>
            <SectionHeader
                title="Subject Embeddings by Semester"
                subtitle="Only theory classes are counted in the denominator."
            />
            <div style={{ height: Math.max(190, semesters.length * 50) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={semesters}
                        layout="vertical"
                        margin={{ top: 8, right: 46, left: 8, bottom: 8 }}
                        barCategoryGap={18}
                    >
                        <CartesianGrid stroke={theme.border} strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickFormatter={formatPercent}
                            tick={{ fontSize: 11, fill: theme.textMuted }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={70}
                            tick={{ fontSize: 11, fill: theme.textMuted }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(245,158,11,0.07)' }} />
                        <Bar
                            dataKey="progressPct"
                            name="Embedding progress"
                            radius={[0, 6, 6, 0]}
                            isAnimationActive
                            animationBegin={160}
                            animationDuration={850}
                        >
                            {semesters.map((semester) => (
                                <Cell key={`${semester.departmentKey}-${semester.sem}`} fill={theme.warning} />
                            ))}
                            <LabelList
                                dataKey="progressPct"
                                position="right"
                                formatter={formatPercent}
                                style={{ fill: theme.warning, fontSize: 11, fontWeight: 700 }}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function getDepartmentOptions(data) {
    if (Array.isArray(data?.departments) && data.departments.length) {
        return data.departments.map((department) => ({
            key: department.key,
            label: department.label,
        }));
    }

    return (data?.groundTruthProgress || []).reduce((items, row) => {
        if (!row.departmentKey || items.some((item) => item.key === row.departmentKey)) return items;
        items.push({ key: row.departmentKey, label: row.department || row.departmentKey });
        return items;
    }, []).sort((a, b) => a.label.localeCompare(b.label));
}

export default function DashboardProgress({ title = 'Dashboard Progress', compact = false }) {
    const [state, setState] = useState({ data: null, loading: true, refreshing: false, error: '' });
    const [selectedDepartment, setSelectedDepartment] = useState('');

    const loadProgress = useCallback(async (refreshing = false) => {
        setState((current) => ({
            ...current,
            loading: !refreshing && !current.data,
            refreshing,
            error: '',
        }));

        try {
            const response = await fetch(`${apiUrl}/attendancemodule/dept-admin/stats/progress`, {
                credentials: 'include',
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load dashboard progress.');
            }
            setState({ data, loading: false, refreshing: false, error: '' });
        } catch (error) {
            setState((current) => ({
                ...current,
                loading: false,
                refreshing: false,
                error: error.message,
            }));
        }
    }, []);

    useEffect(() => {
        loadProgress(false);
    }, [loadProgress]);

    const data = useMemo(() => state.data || {}, [state.data]);
    const departments = useMemo(() => getDepartmentOptions(data), [data]);
    const overviewRows = useMemo(() => buildBranchOverview(data, departments), [data, departments]);

    useEffect(() => {
        if (!departments.length) {
            setSelectedDepartment('');
            return;
        }
        setSelectedDepartment((current) =>
            departments.some((department) => department.key === current) ? current : departments[0].key);
    }, [departments]);

    if (state.loading && !state.data) {
        return (
            <LoadingPanel
                compact={compact}
                text="Loading department progress dashboard..."
            />
        );
    }

    if (state.error && !state.data) {
        return (
            <section style={{ ...styles.card, marginTop: compact ? 18 : 0, color: theme.danger }}>
                {state.error}
            </section>
        );
    }

    const activeDepartment = selectedDepartment || departments[0]?.key || '';
    const selectedDepartmentLabel = departments.find((department) => department.key === activeDepartment)?.label
        || data.department
        || 'Selected department';
    const groundTruthRows = (data.groundTruthProgress || [])
        .filter((row) => row.departmentKey === activeDepartment);
    const embeddingRows = (data.embeddingProgress || [])
        .filter((row) => row.departmentKey === activeDepartment);
    const summary = buildSummary(groundTruthRows, embeddingRows);

    return (
        <section style={{ ...styles.card, marginTop: compact ? 18 : 0, padding: compact ? 18 : 24 }}>
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 16,
            }}>
                <div style={{ minWidth: 220 }}>
                    <div style={{ fontSize: compact ? 16 : 18, fontWeight: 700, color: theme.text }}>
                        {title}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: theme.textMuted }}>
                        {state.refreshing
                            ? `Refreshing ${selectedDepartmentLabel} progress...`
                            : `${selectedDepartmentLabel} progress`}
                    </div>
                    {state.error && (
                        <div style={{ marginTop: 6, color: theme.danger, fontSize: 12 }}>{state.error}</div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ minWidth: 260 }}>
                        <label style={{ ...styles.label, marginBottom: 5, letterSpacing: 0 }}>Department</label>
                        <select
                            value={activeDepartment}
                            onChange={(event) => setSelectedDepartment(event.target.value)}
                            disabled={!data.fullAccess || state.refreshing || !departments.length}
                            style={{
                                ...styles.select,
                                padding: '8px 12px',
                                fontSize: 12,
                                background: !data.fullAccess ? theme.surfaceAlt : styles.select.background,
                                cursor: !data.fullAccess || state.refreshing ? 'default' : 'pointer',
                            }}
                        >
                            {departments.length ? departments.map((department) => (
                                <option key={department.key} value={department.key}>
                                    {department.label}
                                </option>
                            )) : (
                                <option value="">No ERP departments found</option>
                            )}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={() => loadProgress(true)}
                        disabled={state.refreshing}
                        style={{
                            ...styles.btnGhost,
                            padding: '8px 14px',
                            fontSize: 12,
                            opacity: state.refreshing ? 0.65 : 1,
                            cursor: state.refreshing ? 'default' : 'pointer',
                        }}
                    >
                        {state.refreshing ? 'Refreshing progress...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {!departments.length ? (
                <EmptyState>No ERP-backed department batches were found on the backend.</EmptyState>
            ) : (
                <>
                    {data.fullAccess && (
                        <BranchOverviewChart
                            rows={overviewRows}
                            selectedDepartment={activeDepartment}
                            onSelectDepartment={setSelectedDepartment}
                        />
                    )}

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: 12,
                        marginBottom: 14,
                    }}>
                        <MetricPanel
                            color={theme.success}
                            label="Roll Assignment"
                            value={summary.groundTruthProgressPct}
                            detail={`${formatCount(summary.approvedAssignments)} approved of ${formatCount(summary.erpPhotoCount)} ERP photos`}
                        />
                        <MetricPanel
                            color={theme.warning}
                            label="Subject Embeddings"
                            value={summary.embeddingProgressPct}
                            detail={`${formatCount(summary.completedSubjectEmbeddings)} completed of ${formatCount(summary.theorySubjects)} theory subjects`}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : '1fr 1fr', gap: 14 }}>
                        <BatchChart rows={groundTruthRows} />
                        <SemesterChart rows={embeddingRows} />
                    </div>
                </>
            )}
        </section>
    );
}
