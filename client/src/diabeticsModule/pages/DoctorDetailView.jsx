import React from 'react';
import DoctorDetailViewComponent from '../components/admin/DoctorDetailView';
import { useParams } from 'react-router-dom';

export default function DoctorDetailView() {
  const { doctorId } = useParams();
  if (!doctorId) {
    return <div>Doctor ID is required</div>;
  }
  return <DoctorDetailViewComponent doctorId={doctorId} />;
}
