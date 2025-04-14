import {
  axiosInstance,
  createEndpoint,
  handleApiError,
  handleApiResponse,
} from './config';

// Get all doctors
export const getAllDoctors = () =>
  axiosInstance
    .get(createEndpoint('/doctor/all'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get doctor by ID
export const getDoctorById = (doctorId) =>
  axiosInstance
    .get(createEndpoint(`/doctor/${doctorId}`))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get current doctor's info
export const getCurrentDoctor = () =>
  axiosInstance
    .get(createEndpoint('/doctor/me'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Add new doctor
export const addDoctor = (doctorData) =>
  axiosInstance
    .post(createEndpoint('/doctor/add'), doctorData)
    .then(handleApiResponse)
    .catch(handleApiError);

// Get doctor count
export const getDoctorCount = () =>
  axiosInstance
    .get(createEndpoint('/doctor/count'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Doctor login
export const loginDoctor = (credentials) =>
  axiosInstance
    .post(createEndpoint('/doctor/login'), credentials)
    .then(handleApiResponse)
    .catch(handleApiError);
