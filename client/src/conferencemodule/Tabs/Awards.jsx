import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const Awards = () => {
    const params = useParams();
  const apiUrl = getEnvironment();

    const IdConf = params.confid;
    const initialData = {
        confId: IdConf,
        title1: "",
        title2: "",
        description: "",
        sequence: 0,
        featured: true,
        new: true,
        hidden: true,
        link: ""
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState();
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);

    const {  title1, title2, description, link } = formData;

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "featured" || name === "new" || name === "hidden") {
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

        axios.post(`${apiUrl}/conferencemodule/awards`, formData, {
            withCredentials: true

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
        axios.put(`${apiUrl}/conferencemodule/awards/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/awards/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/awards/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/awards/conference/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => {
                console.log(err);
            })
            .finally(() => setLoading(false));

        console.log(data);
    }, [refresh]);

    return (
        <main className='tw-py-10 tw-bg-gray-100 lg:tw-pl-72 tw-min-h-screen'>
            <div className='tw-px-4 sm:tw-px-6 lg:tw-px-8'>
                <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-m-10 " autoComplete="off" onSubmit={handleSubmit}>
                    <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center">Add a New Award</div>
                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Title-1</label>
                    <input type="text" name="title1" required value={title1} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black " />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Title-2</label>
                    <input type="text" name="title2" value={title2} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Description</label>
                    <input type="text" name="description" value={description} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Link</label>
                    <input type="text" name="link" value={link} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                    <select name="featured" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </select>

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">New</label>
                    <select name="new" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </select>

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Hidden</label>
                    <select name="hidden" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </select>

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Sequence<input
                        type="number"
                        name="sequence"
                        value={formData.sequence}
                        onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black"
                    /></label>

                    <div className="tw-flex tw-justify-evenly">
                        <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Add Award</button>
                        <button type="submit" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">
                            Update Award
                        </button>
                    </div>
                </form>

                <hr />

                <div className="tw-shadow-md tw-m-10 ali">
                    <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center">Added awards</div>
                    {loading ? (
                        <LoadingIcon />
                    ) : (
                        <table className="tw-min-w-full tw-border-collapse tw-box-border">
                            <thead>
                                <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                    <th className="tw-p-1 tw-text-center">Title-1</th>
                                    <th className="tw-p-1 tw-text-center">Title-1</th>
                                    <th className="tw-p-1 tw-text-center">Description</th>
                                    <th className="tw-p-1 tw-text-center">Link</th>
                                    <th className="tw-p-1 tw-text-center">Sequence</th>
                                    <th className="tw-p-1 tw-text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, index) => (
                                    <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                        <td className="tw-p-1 tw-text-center">{item.title1}</td>
                                        <td className="tw-p-1 tw-text-center">{item.title2}</td>
                                        <td className="tw-p-1 tw-text-center">{item.description}</td>
                                        <td className="tw-p-1 tw-text-center">{item.link}</td>
                                        <td className="tw-p-1 tw-text-center">{item.sequence}</td>
                                        <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">
                                            <button onClick={() => {
                                                handleEdit(item._id);
                                                setEditID(item._id);
                                            }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-mx-2 tw-rounded focus:tw-outline-black"> Edit </button>{" "}
                                            <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold tw-mx-2 tw-px-4 tw-rounded focus:tw-outline-black"> Delete </button>
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

export default Awards;
