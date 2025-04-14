import React from 'react';
import HospitalDetailViewComponent from '../components/admin/HospitalDetailView';
import { useParams } from 'react-router-dom';
export default function HospitalDetailView() {
  const { hospitalId } = useParams();
  if (!hospitalId) {
    return <div>Hospital ID is required</div>;
  }
  return <HospitalDetailViewComponent hospitalId={hospitalId} />;
}
