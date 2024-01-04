import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const Images = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();

    const initialData = {
        "confId": IdConf,
        "name": "",
        "imgLink": "",
        "feature": true,
        "sequence": 0
    }

    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { name, imgLink } = formData;
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

        else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }

    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/images`, formData, {
            withCredentials: true

        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData);
                setRefresh(refresh + 1);

            })
            .catch(err => {
                console.log(formData)
                console.log(err)
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/images/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/images/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/images/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => {
                console.log(data);
                console.log(err);
            });
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/images/conference/${IdConf}`, {
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
                <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10" autoComplete="off" onSubmit={handleSubmit}>
                    <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  ">Add a New Image</div>
                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Description</label>
                    <input type="text" name="name" required  value={name} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Image Link</label>
                    <input type="text" name="imgLink" required value={imgLink} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Sequence</label>
                    <input
                        type="number"
                        name="sequence"
                        value={formData.sequence}
                        onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline"
                    />
                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                    <select name="feature" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </select>

                    <div className="tw-flex tw-justify-evenly">
                        <button type="submit" className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline">Add </button>
                        <button type="button" onClick={handleUpdate} className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline">Update</button>
                    </div>
                </form>

                <hr />

                <div className="tw-shadow-md tw-m-4 md:tw-m-10 tw-overflow-x-auto">
                    <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-text-center  ">Existing Images</div>
                    {loading ? (
                        <div>
                            <LoadingIcon />
                        </div>
                    ) : (
                        <table className="tw-min-w-full tw-border-collapse tw-box-border tw-color-indi">
                            <thead>
                                <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                    <th className="tw-p-1 tw-text-center">Description</th>
                                    <th className="tw-p-1 tw-text-center">Image Link</th>
                                    <th className="tw-p-1 tw-text-center">Sequence</th>
                                    <th className="tw-p-1 tw-text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length ? data.map((item, index) => (
                                    <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                        <td className="tw-p-1 tw-text-center">{item.name}</td>
                                        <td className="tw-p-1 tw-text-center">{item.imgLink}</td>
                                        <td className="tw-p-1 tw-text-center">{item.sequence}</td>

                                        <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">                                            <button onClick={() => { handleEdit(item._id); setEditID(item._id) }} className="tw-bg-yellow-500 tw-hover:bg-yellow-700 tw-text-white tw-font-bold tw-px-2 tw-mx-2 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline"> Edit </button>{" "}
                                            <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 tw-hover:bg-red-700 tw-text-white tw-font-bold tw-mx-2 tw-px-2 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline"> Delete </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="tw-p-1 tw-text-center">No data available</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Images;
