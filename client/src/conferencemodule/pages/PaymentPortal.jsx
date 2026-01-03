import React from "react";

const PaymentPortal = () => {
  const handlePayment = () => {
    window.open(
      "https://www.nitj.ac.in/events_registration/wdmc_services/login",
      "_blank"
    );
  };

  return (
    <div className="tw-w-full tw-flex tw-justify-center tw-mt-6">
      <div className="tw-bg-white tw-shadow-md tw-rounded-lg tw-p-6 tw-w-full tw-max-w-2xl">
        
        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
          Payment Instructions
        </h2>

        <ul className="tw-text-sm tw-text-gray-700 tw-space-y-2">
          <li>• Instruction 1 (will be updated later)</li>
          <li>• Instruction 2 (will be updated later)</li>
          <li>• Instruction 3 (will be updated later)</li>
        </ul>

        <div className="tw-mt-6 tw-flex tw-justify-end">
          <button
            onClick={handlePayment}
            className="tw-bg-blue-600 tw-text-white tw-px-6 tw-py-2 tw-rounded-md hover:tw-bg-blue-700"
          >
            Payment Portal
          </button>
        </div>

      </div>
    </div>
  );
};

export default PaymentPortal;
