import React, { useState, useEffect, useRef } from 'react'
import getEnvironment from '../../getenvironment';
import Modal from 'react-modal';
import { Text, IconButton, Input, HStack, useToast } from '@chakra-ui/react';
import { AddIcon, CloseIcon, CopyIcon } from '@chakra-ui/icons';
import { FaUpload } from "react-icons/fa";

const Signaturemodal = ({ eventId, formData, setFormData, index, handleFileChange, signatures, signature, handleChange, selectedFiles }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('Uploaded');
    const [images, setImages] = useState([])
    const apiUrl = getEnvironment();
    const toast = useToast()

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
                    // console.log("image: ", image)
                    let Image = image.map((elem) => {
                        // console.log(elem)
                        if (elem["url"]["url"] || elem["url"]["url"] == "") {
                            return elem
                        } else if (elem["name"]["name"] || elem["name"]["name"] == "") {
                            const item = {
                                name: { name: elem.name.name, fontSize: elem.name.fontSize, fontFamily: elem.name.fontFamily, bold: elem.name.bold, italic: elem.name.italic, fontColor: elem.name.fontColor },
                                position: { position: elem.position.position, fontSize: elem.position.fontSize, fontFamily: elem.position.fontFamily, bold: elem.position.bold, italic: elem.position.italic, fontColor: elem.position.fontColor },
                                url: { url: elem.url || "", size: 100 }
                            }
                            return item;
                        } else if (elem["url"] || elem["url"] == "") {
                            const item = {
                                name: { name: elem.name, fontSize: "", fontFamily: "", bold: "normal", italic: "normal", fontColor: "black" },
                                position: { position: elem.position, fontSize: "", fontFamily: "", bold: "normal", italic: "normal", fontColor: "black" },
                                url: { url: elem.url, size: 100 }
                            }
                            return item;
                        } else {
                            const item = {
                                name: { name: " ", fontSize: "", fontFamily: "", bold: "normal", italic: "normal", fontColor: "black" },
                                position: { position: " ", fontSize: "", fontFamily: "", bold: "normal", italic: "normal", fontColor: "black" },
                                url: { url: "", size: 100 }
                            }
                            return item;
                        }
                    })
                    // console.log("Image: ", Image)
                    let Images = [Image[0]];
                    for (let i = 1; i < Image.length; i++) {
                        let count = 0;
                        Images.forEach(element => {
                            if (element.url.url == Image[i].url.url) {
                                count = 1;
                            }
                        });
                        if (count == 0 && Image[i].url.url.trim()) { Images.push(Image[i]) }
                    }
                    // console.log("Images: ",Images)
                    Images = Images.filter(function( element ) {
                        return element !== undefined;
                     });
                    setImages(Images)
                } else {
                    console.error(response.error)
                }
            } catch (error) {
                console.error(error)
            }

        }
        fetchdata()
    }, [])

    function copyToClipboard(e, text) {

        e.stopPropagation();
        if (!navigator.clipboard) {
            return Promise.reject('Clipboard API not supported');
        }
        e.target.parentElement.style.display = "none";
        toast({
            title: 'Link copied',
            duration: 1000,
            isClosable: true,
        });
        setTimeout(() => {
            e.target.parentElement.style.display = "block";
        }, 1000)
        return navigator.clipboard.writeText(text);
    }

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
    console.log(images);
    return (
        <div>
            <button type='button' style={{ color: "black", height: "25px", width: "25px" }} onClick={openModal}><FaUpload style={{ height: "25px", width: "25px", color:"deeppink" }} /></button>
            <Modal style={{ height: "550px" }} className="tw-fixed tw-top-24 tw-left-0 md:tw-top-28 md:tw-left-60 tw-w-full md:tw-w-2/3 tw-border-black tw-border-2 tw-rounded-lg tw-bg-slate-200"
                isOpen={isOpen}
                onRequestClose={closeModal}
                ariaHideApp={false}
            >
                <ul style={{ background: "#111827" }} className="nav nav-tabs tw-relative tw-top-0 tw-left-0 tw-list-none tw-flex tw-items-center tw-m-0 tw-p-1 tw-gap-2 tw-h-12">
                <h1 className='tw-w-full tw-text-center tw-text-white tw-font-bold tw-align-middle tw-h-12 tw-pt-4'>Select From your Uploaded Signatures</h1>
                </ul>
                <IconButton
                    icon={<CloseIcon />}
                    className="tw-absolute tw-top-0 tw-right-0"
                    style={{ position: "absolute", height: "38px" }}
                    onClick={closeModal}
                />
                <div className="modal-content tw-pl-8">
                    <div>
                        <div style={{ height: "500px" }} className='tw-flex tw-flex-col'>
                            <div style={{ height: "495px" }} className="uploadedImages tw-flex tw-gap-4 tw-flex-wrap tw-p-4 tw-overflow-y-scroll">
                                {images.length == 0 ? <p>You have no images uploaded</p> : images.map((elem, index) => (
                                    <div onClick={(e) => { handleClick(e, index) }} key={`${index}`} style={{ height: "150px", width: "150px" }} className="tw-border-2 tw-border-zinc-300 tw-rounded-lg tw-object-contain tw-p-1 hover:tw-bg-slate-300 hover:tw-cursor-pointer" >
                                        <div className='tw-relative'
                                            onMouseEnter={e => { const copy = e.target.parentElement.lastChild; copy.style.display = "block" }}
                                            onMouseLeave={e => { const copy = e.target.parentElement.lastChild; copy.style.display = "none" }}
                                        ><img src={elem.url ? `${elem.url.url}` : " "}></img><div className='tw-z-10 tw-absolute tw-bottom-0 tw-right-0 tw-flex tw-justify-center tw-items-center hover:tw-bg-slate-400 tw-p-1' style={{ height: "28px", width: "28px", borderRadius: "50%", display: "none" }} ><CopyIcon style={{ height: "18px", width: "18px", display: 'flex', justifyContent: "center", alignItems: "center" }} onClick={(e) => { copyToClipboard(e, elem.url.url) }} /></div></div>
                                        <Text fontWeight="bold" color="black" fontSize="14px" className='tw-text-center'>{elem.name.name}</Text>
                                        <Text fontSize="10px" color="black" className='tw-text-center'>{elem.position.position}</Text>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

export default Signaturemodal
