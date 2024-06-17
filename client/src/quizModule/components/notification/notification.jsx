import React from 'react';

const ConfirmationNotification = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="confirmation-notification">
      <div className="confirmation-message">{message}</div>
      <div className="confirmation-buttons">
        <button className="confirmation-button" onClick={onConfirm}>
          Confirm
        </button>
        <button className="confirmation-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmationNotification;
