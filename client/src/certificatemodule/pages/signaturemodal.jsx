import React, { useState, useEffect, useRef } from 'react'
import getEnvironment from '../../getenvironment';
import Modal from 'react-modal';
import { Text, IconButton, Input, HStack } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';
import { FaUpload } from "react-icons/fa";


const Signaturemodal = ({ eventId, formData, setFormData, index, handleFileChange, signatures, signature, handleChange, selectedFiles }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Uploaded');
    const [images, setImages] = useState([])
    const apiUrl = getEnvironment();
    useEffect(() => {
        const fetchdata = async () => {
            try {
                const response = await fetch(`${apiUrl}/certificatemodule/certificate/getcertificateimages/${eventId}`,
                    {
                        method: 'GET',
                        headers: {
                            "Content-type": "application/json"
                        },
                        credentials: 'include'
                    }
                )
                if (response.ok) {
                    const image = await response.json();
                    let Image = image.map((elem) => {
                        // console.log(elem)
                        if (elem["url"]["url"]) {
                            return elem
                        } else if (elem["name"]["name"]) {
                            const item = {
                                name: { name: elem.name.name, fontSize: elem.name.fontSize, fontFamily: elem.name.fontFamily, bold: elem.name.bold, italic: elem.name.italic, fontColor: elem.name.fontColor },
                                position: { position: elem.position.position, fontSize: elem.position.fontSize, fontFamily: elem.position.fontFamily, bold: elem.position.bold, italic: elem.position.italic, fontColor: elem.position.fontColor },
                                url: { url: elem.url, size: 100 }
                            }
                            return item;
                        } else if (elem["url"]) {
                            const item = {
                                name: { name: elem.name, fontSize: "", fontFamily: "", bold: "normal", italic: "normal", fontColor: "black" },
                                position: { position: elem.position, fontSize: "", fontFamily: "", bold: "normal", italic: "normal", fontColor: "black" },
                                url: { url: elem.url, size: 100 }
                            }
                            return item;
                        }
                    })
                    setImages(Image)
                } else {
                    console.error(response.error)
                }
            } catch (error) {
                console.error(error)
            }

        }
        fetchdata()
    }, [])


    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);
    const handleTabClick = (tabId) => setActiveTab(tabId);
    // console.log(images)
    const handleClick = (e, i) => {
        const Signature = images[i]
        setFormData((prevData) => {
            const updatedField = [...prevData["signatures"]]
            updatedField[index] = Signature;
            return { ...prevData, signatures: updatedField }
        })
        setIsOpen(false)
    }
    return (
        <div>
            <button type='button' style={{ color: "black", height: "25px", width: "25px" }} onClick={openModal}><FaUpload style={{ height: "25px", width: "25px" }} /></button>
            <Modal style={{ height: "550px" }} className="tw-fixed tw-top-28 tw-left-60 tw-w-2/3 tw-border-black tw-border-2 tw-rounded-lg tw-bg-slate-200"
                isOpen={isOpen}
                onRequestClose={closeModal}
                ariaHideApp={false}
            >
                <ul style={{ background: "#111827" }} className="nav nav-tabs tw-relative tw-top-0 tw-left-0 tw-list-none tw-flex tw-items-center tw-m-0 tw-p-1 tw-gap-2 tw-h-12">
                    <li className="nav-item">
                        <button className='tw-rounded-lg ' style={{ color: activeTab === 'Uploaded' ? "#111827" : "white", padding: "3px", margin: "0px", width: "100px", background: activeTab === 'Uploaded' ? "rgb(226 232 240)" : "#111827" }}
                            onClick={() => handleTabClick('Uploaded')}
                        >
                            Uploaded
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className='tw-rounded-lg' style={{ color: activeTab === 'Upload' ? "#111827" : "white", padding: "3px", margin: "0px", width: "100px", background: activeTab === 'Upload' ? "rgb(226 232 240)" : "#111827" }}
                            onClick={() => handleTabClick('Upload')}
                        >
                            Upload
                        </button>
                    </li>
                </ul>
                <IconButton
                    icon={<CloseIcon />}
                    className="tw-absolute tw-top-0 tw-right-0"
                    style={{ position: "absolute", height: "38px" }}
                    onClick={closeModal}
                />
                <div className="modal-content tw-pl-8">
                    <div>
                        {activeTab === 'Uploaded' && <div style={{ height: "500px" }} className='tw-flex tw-flex-col'>
                            <h1 className='tw-w-full tw-text-center tw-font-bold tw-align-middle tw-h-12 tw-pt-4'>Select From your Uploaded Images</h1>
                            <div style={{ height: "452px" }} className="uploadedImages tw-flex tw-gap-4 tw-flex-wrap tw-p-4 tw-overflow-y-scroll">
                                {images.length==0?"You have no images uploaded":images.map((elem, index) => (
                                    <div onClick={(e) => { handleClick(e, index) }} key={`${index}`} style={{ height: "150px", width: "170px" }} className="tw-border-2 tw-border-zinc-300 tw-rounded-lg tw-object-contain tw-p-1 hover:tw-bg-slate-300 hover:tw-cursor-pointer" >
                                        <img src={`${elem.url.url}`}></img>
                                        <Text fontWeight="bold" color="black" fontSize="14px" className='tw-text-center'>{elem.name.name}</Text>
                                        <Text fontSize="10px" color="black" className='tw-text-center'>{elem.position.position}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>}
                        {activeTab === 'Upload' && <div style={{ height: "500px" }} className='tw-flex tw-flex-col'>
                            <h1 className='tw-w-full tw-text-center tw-font-bold tw-align-middle tw-h-20 tw-pt-8'>Upload New</h1>
                            <div style={{ height: "300px" }} className="tw-flex tw-flex-col tw-justify-evenly tw-gap-4 tw-p-4 ">
                                <HStack width="100%" className='tw-flex tw-justify-center'>
                                    <Text className='tw-font-semibold'>Upload a new image: </Text>
                                    <input
                                        id={`signature${index}`}
                                        name={`signatures[${index}].url.url`}
                                        onChange={(e) => handleFileChange(e, 'signatures', index)}
                                        type='file'
                                        accept='image/jpeg , image/png'
                                        style={{ margin: "0px", padding: "0px", width:"200px" }}
                                    /></HStack>
                                <Text className='tw-w-full tw-text-center tw-align-middle'>OR</Text>
                                <HStack width="100%" className='tw-flex tw-justify-center'>
                                    <Text width="60px" className='tw-text-right tw-font-semibold'>Link:</Text>
                                    <Input
                                        name={`signatures[${index}].url.url`}
                                        value={signature.url.url}
                                        onChange={(e) => handleChange(e, 'signatures', index)}
                                        placeholder="URL"
                                        width="55%"
                                        style={{ border: "2px solid black" }}
                                    />
                                </HStack>

                            </div></div>}
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Signaturemodal
