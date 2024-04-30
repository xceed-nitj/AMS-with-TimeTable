import React, { useState } from 'react';
import axios from 'axios';
import getEnvironment from '../../getenvironment';

const apiUrl = getEnvironment();

const UpdatePaperStatus = () => {
  const [paperId, setPaperId] = useState('');
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');

  const handlePaperIdChange = (event) => {
    setPaperId(event.target.value);
  };

  const handleStatusChange = (event) => {
    setStatus(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${apiUrl}/reviewmodule/reviewerAcceptance/updateStatus`, {
        paperId: paperId,
        status: status
      });
      console.log(response.data);
      setMessage('Paper status updated successfully.');
      // Clear form fields after successful submission
      setPaperId('');
      setStatus('');
    } catch (error) {
      console.error('Error updating paper status:', error);
      console.log(error);
      setMessage('Error updating paper status. Please try again.');
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Update Paper Status</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="paperId">Paper ID:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="paperId"
                    value={paperId}
                    onChange={handlePaperIdChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="status">Status:</label>
                  <select
                    className="form-control"
                    id="status"
                    value={status}
                    onChange={handleStatusChange}
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-primary">Update Status</button>
                </div>
              </form>
              {message && <p className="text-center mt-3">{message}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePaperStatus;
