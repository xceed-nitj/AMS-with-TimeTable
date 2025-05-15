import {
  axiosInstance,
  createEndpoint,
  handleApiError,
  handleApiResponse,
} from './config';

// Get all patients
export const getAllPatients = () =>
  axiosInstance
    .get(createEndpoint('/patient/all'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get patient by ID
export const getPatientById = (patientId) =>
  axiosInstance
    .get(createEndpoint(`/patient/${patientId}`))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get current patient's info
export const getCurrentPatient = () =>
  axiosInstance
    .get(createEndpoint('/patient/me'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Add new patient
export const addPatient = (patientData) =>
  axiosInstance
    .post(createEndpoint('/patient/add'), patientData)
    .then(handleApiResponse)
    .catch(handleApiError);

// Get patient count
export const getPatientCount = () =>
  axiosInstance
    .get(createEndpoint('/patient/count'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Patient login
export const loginPatient = (credentials) =>
  axiosInstance
    .post(createEndpoint('/patient/login'), credentials)
    .then(handleApiResponse)
    .catch(handleApiError);
