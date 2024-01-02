function EditCertificate({
  certificateData,
  setCertificateData,
  handleSubmit,
}) {
  let {
    Description,
    Date,
    Signature,
    Certificate,
    SubText,
    PresentedTo,
    BottomText1,
    BottomText2,
  } = certificateData;

  return (
    <div className="tw-px-3 tw-py-4 h-[100%] tw-overflow-auto  tw-w-full">
      <p className="tw-text-2xl tw-mb-5 tw-text-blue-900 tw-font-semibold ">
        Customization
      </p>

      <p className="tw-mb-1 tw-text-sm tw-text-gray-600 tw-mt-5]  ">
        Description
      </p>
      <input
        placeholder="Description"
        className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500 w-[20rem]"
        value={Description}
        onChange={(e) =>
          setCertificateData((data) => ({
            ...data,
            Description: e.target.value,
          }))
        }
      />

      <div className="tw-flex tw-gap-2 tw-mt-5">
        <div>
          <p className="tw-mb-1 tw-text-sm tw-text-gray-600 tw-mt-5] ">Date</p>
          <input
            placeholder="Date"
            className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500"
            value={Date}
            onChange={(e) =>
              setCertificateData((data) => ({ ...data, Date: e.target.value }))
            }
          />
        </div>
        <div>
          <p className="tw-mb-1 tw-text-sm tw-text-gray-600 tw-mt-5] ">
            Signature
          </p>
          <input
            placeholder="Signature"
            className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500"
            value={Signature}
            onChange={(e) =>
              setCertificateData((data) => ({
                ...data,
                Signature: e.target.value,
              }))
            }
          />
        </div>
      </div>

      <div className="tw-mt-4">
        <p className="tw-text-2xl tw-mb-5 tw-text-blue-900 tw-font-semibold">
          Text Labels
        </p>
        <div className="md:tw-flex tw-gap-2 tw-mt-5">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-text-gray-600 ">Certificate</p>
            <input
              placeholder="Certificate"
              className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500"
              value={Certificate}
              onChange={(e) =>
                setCertificateData((data) => ({
                  ...data,
                  Certificate: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <p className="tw-mb-1 tw-text-sm tw-text-gray-600">Sub Text</p>
            <input
              placeholder="Sub Text"
              className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500"
              value={SubText}
              onChange={(e) =>
                setCertificateData((data) => ({
                  ...data,
                  SubText: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <p className="tw-mb-1 tw-text-sm tw-text-gray-600 tw-mt-5]  tw-mt-5">
          Presented To
        </p>
        <input
          placeholder="Presented To"
          className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500 w-[20rem]"
          value={PresentedTo}
          onChange={(e) =>
            setCertificateData((data) => ({
              ...data,
              PresentedTo: e.target.value,
            }))
          }
        />
        <div className="md:tw-flex tw-gap-2 tw-mt-5">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-text-gray-600 tw-mt-5] ">
              Dates
            </p>
            <input
              placeholder="Dates"
              className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500"
              value={BottomText1}
              onChange={(e) =>
                setCertificateData((data) => ({
                  ...data,
                  BottomText1: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <p className="tw-mb-1 tw-text-sm tw-text-gray-600 tw-mt-5] ">
              Signature
            </p>
            <input
              placeholder="Signature"
              className="tw-border tw-p-2 tw-rounded-md active:tw-border-blue-500"
              value={BottomText2}
              onChange={(e) =>
                setCertificateData((data) => ({
                  ...data,
                  BottomText2: e.target.value,
                }))
              }
            />
          </div>
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-justify-center">
        <button
          className="tw-bg-blue-200 tw-px-3 tw-py-2 tw-rounded-md tw-text-blue-900 tw-font-bold tw-mt-5  hover:tw-bg-white hover:tw-border-2 tw-transition tw-mb-1"
          onClick={handleSubmit}
        >
          Select Certiifacate
        </button>
      </div>
    </div>
  );
}

export default EditCertificate;
