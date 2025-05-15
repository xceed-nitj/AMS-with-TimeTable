import {
  axiosInstance,
  createEndpoint,
  handleApiError,
  handleApiResponse,
} from './config';

// Get all hospitals
export const getAllHospitals = () =>
  axiosInstance
    .get(createEndpoint('/hospital/all'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get hospital doctors
export const getHospitalDoctors = (hospitalId) =>
  axiosInstance
    .get(createEndpoint(`/hospital/${hospitalId}/doctors`))
    .then(handleApiResponse)
    .catch(handleApiError);

// Get hospital by ID
export const getHospitalById = (hospitalId) =>
  axiosInstance
    .get(createEndpoint(`/hospital/${hospitalId}`))
    .then(handleApiResponse)
    .catch(handleApiError);

// Add new hospital
export const addHospital = (hospitalData) =>
  axiosInstance
    .post(createEndpoint('/hospital/add'), hospitalData)
    .then(handleApiResponse)
    .catch(handleApiError);

// Get hospital count
export const getHospitalCount = () =>
  axiosInstance
    .get(createEndpoint('/hospital/count'))
    .then(handleApiResponse)
    .catch(handleApiError);

// Update hospital
export const updateHospital = (hospitalId, updateData) =>
  axiosInstance
    .patch(createEndpoint(`/hospital/${hospitalId}`), updateData)
    .then(handleApiResponse)
    .catch(handleApiError);

// Delete hospital
export const deleteHospital = (hospitalId) =>
  axiosInstance
    .delete(createEndpoint(`/hospital/${hospitalId}`))
    .then(handleApiResponse)
    .catch(handleApiError);
