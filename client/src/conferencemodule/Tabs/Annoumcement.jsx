import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";

const Announcement = () => {
    const params = useParams();
    const apiUrl='https://xceed.onrender.com/confrenceModule';

    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "title": "",
        "metaDescription": "",
        "description": "",
        "sequence": 0,
        "feature": true,
        "new": true,
        "hidden": true,
        "link": ""
    };
    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, metaDescription, description, link } = formData;


    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "feature") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        }
        else if (name === "new") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        } else if (name === "hidden") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        }
        else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${apiUrl}/announcements`, formData, {
            headers: {
                Authorization: ''
            }
        })
            .then(res => {
                setData([...data, res.data]);

                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/announcements/${editID}`, formData, {
            headers: {
                Authorization: ''
            }
        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        setLoading(true)
        axios.delete(`${apiUrl}/announcements/${deleteID}`, {
            headers: {
                Authorization: ''
            }
        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/announcements/${editIDNotState}`, {
            headers: {
                Authorization: ''
            }
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/announcements/conf/${IdConf}`, {
            headers: {
                Authorization: ''
            }
        })
            .then(res => {
                setData(res.data);
                console.log(res.data);

            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className='tw-py-10 tw-bg-gray-100 lg:tw-pl-72 tw-min-h-screen'>
            <div className='tw-px-4 sm:tw-px-6 lg:tw-px-8'>
                <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-m-10" autoComplete="off" onSubmit={handleSubmit}>
                    <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center">Add a New Announcement</div>
                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Title</label>
                    <input type="text" name="title" required value={title} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Meta Description</label>
                    <input type="text" name="metaDescription" value={metaDescription} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Description</label>
                    <input type="text" name="description" required value={description} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Link</label>
                    <input type="text" name="link" value={link} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                    <select name="feature" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>

                    </select>
                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">New</label>
                    <select name="new" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>

                    </select>
                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Hidden</label>
                    <select name="hidden" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>

                    </select>


                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Sequence<input
                        type="number"
                        name="sequence"
                        value={formData.sequence}
                        onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline"
                    /></label>


                    <div className="tw-flex tw-justify-evenly">
                        <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow-outline">Add Announcement</button>
                        <button type="submit" onClick={() => handleUpdate()} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow">Update Announcement</button>
                    </div>
                </form>

                <hr />

                <div className="tw-shadow-md tw-m-10 tw-ali">
                    <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center">Added Announcements</div>
                    {!loading ? (
                        <table className="tw-min-w-full tw-border-collapse tw-box-border">
                            <thead>
                                <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                    <th className="tw-p-1 tw-text-center">Title</th>
                                    <th className="tw-p-1 tw-text-center">Meta Description</th>
                                    <th className="tw-p-1 tw-text-center">Description</th>
                                    <th className="tw-p-1 tw-text-center">Link</th>
                                    <th className="tw-p-1 tw-text-center">Sequence</th>
                                    <th className="tw-p-1 tw-text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, index) => (
                                    <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                        <td className="tw-p-1 tw-text-center">{item.title}</td>
                                        <td className="tw-p-1 tw-text-center">{item.metaDescription}</td>
                                        <td className="tw-p-1 tw-text-center">{item.description}</td>
                                        <td className="tw-p-1 tw-text-center">{item.link}</td>
                                        <td className="tw-p-1 tw-text-center">{item.sequence}</td>
                                        <td className="tw-p-1 tw-text-center tw-flex tw-justify-evenly">
                                            <button onClick={() => {
                                                handleEdit(item._id);
                                                setEditID(item._id);
                                            }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-mx-2 tw-rounded focus:tw-outline-none focus:tw-shadow-outline">Edit</button>{" "}
                                            <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold tw-mx-2 tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow">Delete</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>                                        
                                        <td colSpan="5" className="tw-p-1 tw-text-center">No data available</td>
                                    </tr>

                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div>
                            <LoadingIcon />
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Announcement;
