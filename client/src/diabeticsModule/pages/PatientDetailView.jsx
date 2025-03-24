import React from 'react';
import PatientDetailViewComponent from '../components/doctor/PatientDetailView';
import { useParams } from 'react-router-dom';

export default function PatientDetailView() {
  const { patientId } = useParams();
  if (!patientId) {
    return <div>Patient ID is required</div>;
  }
  return <PatientDetailViewComponent patientId={patientId} />;
}
