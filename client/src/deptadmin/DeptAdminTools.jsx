import { useOutletContext } from 'react-router-dom';
import GroundTruthRTSP from '../attendancemodule/groundtruthgen_rtsp';
import RollAssign from '../attendancemodule/rollassign';
import GroundTruthUpload from '../attendancemodule/groundtruthupload';
import AttendanceReport from '../attendancemodule/AttendanceReport';
import FrameVerification from '../attendancemodule/FrameVerification';
import EmbeddingGeneration from '../attendancemodule/EmbeddingGeneration';
import ConfidenceMonitor from '../attendancemodule/confidenceMonitor';

export function DeptLiveRTSP() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <GroundTruthRTSP />;
    const deptToUse = batchDepartment || department;
    if (!deptToUse) return null;
    return <GroundTruthRTSP fixedDepartment={deptToUse} fixedRoomDepartment={department || deptToUse} />;
}

export function DeptAssignRolls() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <RollAssign />;
    const deptToUse = batchDepartment || department;
    if (!deptToUse) return null;
    return <RollAssign fixedDepartment={deptToUse} />;
}

export function DeptGroundTruthUpload() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <GroundTruthUpload />;
    const deptToUse = batchDepartment || department;
    if (!deptToUse) return null;
    return <GroundTruthUpload fixedDepartment={deptToUse} />;
}

export function DeptAttendanceReport() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <AttendanceReport />;
    const deptToUse = batchDepartment || department;
    if (!deptToUse) return null;
    return <AttendanceReport fixedDepartment={deptToUse} />;
}

export function DeptClassVerification() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <FrameVerification />;
    const deptToUse = department || batchDepartment;
    if (!deptToUse) return null;
    return <FrameVerification fixedDepartment={deptToUse} />;
}

export function DeptSubjectEmbeddings() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <EmbeddingGeneration />;
    const deptToUse = department || batchDepartment;
    if (!deptToUse) return null;
    return <EmbeddingGeneration fixedDepartment={deptToUse} />;
}

export function DeptConfidenceMonitor() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <ConfidenceMonitor />;
    const deptToUse = department || batchDepartment;
    if (!deptToUse) return null;
    return <ConfidenceMonitor fixedDepartment={deptToUse} />;
}