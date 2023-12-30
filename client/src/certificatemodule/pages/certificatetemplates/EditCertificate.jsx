function EditCertificate({ certificateData, setCertificateData, handleSubmit
}) {

    let { Description,
        Date,
        Signature,
        Certificate,
        SubText,
        PresentedTo,
        BottomText1,
        BottomText2 } = certificateData;

    return (
        <div className="px-3 py-4 h-[100%] overflow-auto  w-full">
            <p className="text-2xl mb-5 text-blue-900 font-semibold ">Customization</p>

            <p className="mb-1 text-sm text-gray-600 mt-5]  ">Description</p>
            <input placeholder="Description" className="border p-2 rounded-md active:border-blue-500 w-[20rem]" value={Description}
                onChange={(e) => setCertificateData(data => ({ ...data, Description: e.target.value }))} />

            <div className="flex gap-2 mt-5">
                <div>
                    <p className="mb-1 text-sm text-gray-600 mt-5] ">Date</p>
                    <input placeholder="Date" className="border p-2 rounded-md active:border-blue-500" value={Date} onChange={(e) => setCertificateData(data => ({ ...data, Date: e.target.value }))} />
                </div>
                <div>
                    <p className="mb-1 text-sm text-gray-600 mt-5] ">Signature</p>
                    <input placeholder="Signature" className="border p-2 rounded-md active:border-blue-500" value={Signature} onChange={(e) => setCertificateData(data => ({ ...data, Signature: e.target.value }))} />
                </div>
            </div>

            <div className="mt-4">
                <p className="text-2xl mb-5 text-blue-900 font-semibold">Text Labels</p>
                <div className="md:flex gap-2 mt-5">
                    <div>
                        <p className="mb-1 text-sm text-gray-600 ">Certificate</p>
                        <input placeholder="Certificate" className="border p-2 rounded-md active:border-blue-500" value={Certificate} onChange={(e) => setCertificateData(data => ({ ...data, Certificate: e.target.value }))} />
                    </div>
                    <div>
                        <p className="mb-1 text-sm text-gray-600">Sub Text</p>
                        <input placeholder="Sub Text" className="border p-2 rounded-md active:border-blue-500" value={SubText} onChange={(e) => setCertificateData(data => ({ ...data, SubText: e.target.value }))} />
                    </div>
                </div>
                <p className="mb-1 text-sm text-gray-600 mt-5]  mt-5">Presented To</p>
                <input placeholder="Presented To" className="border p-2 rounded-md active:border-blue-500 w-[20rem]" value={PresentedTo} onChange={(e) => setCertificateData(data => ({ ...data, PresentedTo: e.target.value }))} />
                <div className="md:flex gap-2 mt-5">
                    <div>
                        <p className="mb-1 text-sm text-gray-600 mt-5] ">Dates</p>
                        <input placeholder="Dates" className="border p-2 rounded-md active:border-blue-500" value={BottomText1} onChange={(e) => setCertificateData(data => ({ ...data, BottomText1: e.target.value }))} />
                    </div>
                    <div>
                        <p className="mb-1 text-sm text-gray-600 mt-5] ">Signature</p>
                        <input placeholder="Signature" className="border p-2 rounded-md active:border-blue-500" value={BottomText2} onChange={(e) => setCertificateData(data => ({ ...data, BottomText2: e.target.value }))} />
                    </div>
                </div>
            </div>
            <div className="flex items-center justify-center">
                <button className="bg-blue-200 px-3 py-2 rounded-md text-blue-900 font-bold mt-5  hover:bg-white hover:border-2 transition mb-1" onClick={handleSubmit}>Select Certiifacate</button>
            </div>
        </div>
    )
}

export default EditCertificate
