import React, { useState, useEffect } from 'react'
import getEnvironment from '../../getenvironment';
import Modal from 'react-modal';


const Signaturemodal = (eventId) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Uploaded');
    const apiUrl = getEnvironment();
    if (activeTab === "Uploaded") {
        try {
            const fetchData = async () => {
                const response = await fetch(`${apiUrl}/certificatemodule/certificate/getcertificateimages/${eventId.eventId}`,
                    {
                        method: 'GET',
                        headers: {
                            "Content-type": "application/json"
                        },
                        credentials: 'include'
                    }
                )
                console.log(response)
                if (response.ok) {
                    const images = await response.json()
                    console.log("images:", images)
                } else {
                    console.error(response.error)
                }
            }
            fetchData()
        } catch (error) {
            console.error(error)
        }
    }

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    const handleTabClick = (tabId) => setActiveTab(tabId);



    return (
        <div>
            <button type='button' style={{ color: "black" }} onClick={openModal}>Open Modal</button>
            <Modal style={{ height: "500px" }} className="tw-fixed tw-top-28 tw-left-1/4 tw-w-1/2 tw-border-black tw-border-2 tw-rounded-lg tw-bg-slate-50"
                isOpen={isOpen}
                onRequestClose={closeModal}
            >
                <ul className="nav nav-tabs tw-relative tw-top-0 tw-left-0 tw-list-none tw-flex tw-m-0 tw-p-1 tw-gap-2 tw-bg-slate-600">
                    <li className="nav-item tw-m-0 tw-p-0">
                        <button style={{ color: "white", padding: "3px", margin: "0px", width: "100px", background: activeTab === 'Uploaded' ? "rgb(100 116 139)" : "rgb(71 85 105)" }}
                            onClick={() => handleTabClick('Uploaded')}
                        >
                            Uploaded
                        </button>
                    </li>
                    <li className="nav-item tw-m-0 tw-p-0">
                        <button style={{ color: "white", padding: "2px", margin: "0px", width: "100px", background: activeTab === 'Upload' ? "rgb(100 116 139)" : "rgb(71 85 105)" }}
                            onClick={() => handleTabClick('Upload')}
                        >
                            Upload
                        </button>
                    </li>
                </ul>
                <div className="modal-content tw-px-3">
                    <div className="tab-content">

                        {activeTab === 'Uploaded' && <div style={{ height: "450px" }} className='tw-flex tw-flex-col tw-justify-around'>
                            <h1 className='tw-w-full tw-text-center tw-font-bold'>Choose From your Uploaded Images</h1>
                            <div className="uploadedImages tw-flex tw-gap-4 tw-flex-wrap tw-p-4 tw-overflow-y-scroll tw-h-96">
                                <img src="http://localhost:8010/certificatemodule/images/uploads\certificateModuleImages\667f708df01bef0f646cbdc8-winner-signatures[0].url.url.png" height="100px" width="100px" alt="" srcset="" />

                            </div>
                        </div>}
                        {activeTab === 'Upload' && <div><p>This is the content of the second tab.</p></div>}
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Signaturemodal
