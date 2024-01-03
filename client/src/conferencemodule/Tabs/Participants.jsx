import React, { useState, useEffect } from "react";
import axios from 'axios';
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

import { useParams } from "react-router-dom";

const Participants = () => {
    const params = useParams();
    const IdConf = params.confid;
  const apiUrl = getEnvironment();

    const initialData = {
        "confId": IdConf,
        "authorName": "",
        "authorDesignation": "",
        "authorInstitute": "",
        "paperTitle": "",
        "paperId": "",
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState();
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);

    const {  authorName, authorDesignation, authorInstitute, paperTitle, paperId } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/participant`, formData, {
            withCredentials: true

        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err =>{
                console.log(err);
                console.log(formData)
            } );

    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/participant/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/participant/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/participant/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/participant/conf/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));

    }, [refresh]);

    return (
        <main className='tw-py-10 tw-bg-gray-100 lg:tw-pl-72 tw-min-h-screen'>
            <div className='tw-px-2 md:tw-px-4 lg:tw-px-8'>

                <div className="tw-block tw-box-border" >

                    <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10 " autoComplete='off' onSubmit={handleSubmit}>
                        <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  " >Add a New Participant</div>
                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1  tw-font-bold " >Name</label>
                        <input type="text" name="authorName" required value={authorName} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Designation</label>
                        <input type="text" name="authorDesignation" required value={authorDesignation} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Institute</label>
                        <input type="text" name="authorInstitute" required value={authorInstitute} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Paper Title</label>
                        <input type="text" name="paperTitle" required value={paperTitle} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Paper Id</label>
                        <input type="text" name="paperId" required value={paperId} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <div className="tw-flex tw-justify-evenly">
                            <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Add </button>
                            <button type="button" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">
                                Update 
                            </button>
                        </div>

                    </form>

                    <hr />

                    <div className="tw-shadow-md  tw-m-4 md:tw-m-10 tw-overflow-x-auto">
                        <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-text-center  " >Added Participants</div>
                        {loading ? (
                            <LoadingIcon />
                        ) : (
                                <table className="tw-min-w-full tw-border-collapse tw-box-border " >
                                    <thead>
                                        <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                            <th className="tw-p-1 tw-text-center">Name of Participant</th>
                                            <th className="tw-p-1 tw-text-center">Designation</th>
                                            <th className="tw-p-1 tw-text-center">Institute</th>
                                            <th className="tw-p-1 tw-text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.length > 0 ? data.map((item, index) => (
                                            <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                                <td className="tw-p-1 tw-text-center">{item.authorName}</td>
                                                <td className="tw-p-1 tw-text-center">{item.authorDesignation}</td>
                                                <td className="tw-p-1 tw-text-center">{item.authorInstitute}</td>

                                              <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">                                                    <button onClick={() => {
                                                        handleEdit(item._id);
                                                        setEditID(item._id);
                                                    }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-black"> Edit </button>{" "}
                                                    <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold  tw-px-4 tw-rounded focus:tw-outline-black"> Delete </button>
                                                </td>
                                            </tr>)) : (
                                                <tr>
                                                    <td colSpan="5" className="tw-p-1 tw-text-center">No data available</td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            )}

                    </div>
                </div>
            </div>
        </main>
    );
};

export default Participants;
