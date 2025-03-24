import React from 'react';
import { useParams } from 'react-router-dom';
import PatientHistoryComponent from '../components/patient/PatientHistory';

export default function PatientHistory() {
  const { patientId } = useParams();
  return <PatientHistoryComponent patientId={patientId} />;
}
