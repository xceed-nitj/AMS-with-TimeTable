import { useOutletContext } from 'react-router-dom';
import GroundTruthRTSP from '../attendancemodule/groundtruthgen_rtsp';
import RollAssign from '../attendancemodule/rollassign';

export function DeptLiveRTSP() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <GroundTruthRTSP />;
    if (!department) return null;
    return (
        <GroundTruthRTSP
            fixedDepartment={batchDepartment}
            fixedRoomDepartment={department}
        />
    );
}

export function DeptAssignRolls() {
    const { department, batchDepartment, fullAccess, loading } = useOutletContext();
    if (loading) return null;
    if (fullAccess) return <RollAssign />;
    if (!department) return null;
    return <RollAssign fixedDepartment={batchDepartment} />;
}
