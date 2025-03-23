import {
  axiosInstance,
  createEndpoint,
  handleApiError,
  handleApiResponse,
} from './config';

// Add new sick day record
export const addSickDay = (sickDayData) =>
  axiosInstance
    .post(createEndpoint('/sickday/add'), sickDayData)
    .then(handleApiResponse)
    .catch(handleApiError);

// Get all sick days for a patient
export const getPatientSickDays = (patientId) =>
  axiosInstance
    .get(createEndpoint(`/sickday/patient/${patientId}`))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get sick day by ID
export const getSickDayById = (sickDayId) =>
  axiosInstance
    .get(createEndpoint(`/sickday/${sickDayId}`))
    .then(handleApiResponse)
    .catch(handleApiError);
