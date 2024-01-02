import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";

const Sponsors = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl='https://xceed.onrender.com/confrenceModule';

    const initialData={
        confId: IdConf,
        name: "",
        type: "",
        logo: "",
        sequence: 0,
        featured: true,
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confId, name, type, logo, sequence, featured } = formData;

    
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        }
        else if (name === "featured") {
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

        axios.post(`${apiUrl}/sponsor`, formData, {
            headers: {
                Authorization: '',
            },
        })
            .then((res) => {
                setData([...data, res.data]);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch((err) => {
                console.log(err);
                console.log(formData);
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/sponsor/${editID}`, formData, {
            headers: {
                Authorization: '',
            },
        })
            .then((res) => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch((err) => {
                console.log(formData);
                console.log(err);
            });
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/sponsor/${deleteID}`, {
            headers: {
                Authorization: '',
            },
        })
            .then((res) => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch((err) => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/sponsor/${editIDNotState}`, {
            headers: {
                Authorization: '',
            },
        })
            .then((res) => {
                setFormData(res.data);
            })
            .catch((err) => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/sponsor/conference/${IdConf}`, {
            headers: {
                Authorization: '',
            },
        })
            .then((res) => {
                setData(res.data);
            })
            .catch((err) => console.log(err))
            .finally(() => setLoading(false));
    }, [refresh]);

    return (
        <main className='tw-py-10 tw-bg-gray-100 lg:tw-pl-72 tw-min-h-screen'>
            <div className='tw-px-4 sm:tw-px-6 lg:tw-px-8'>
                <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-m-10" autoComplete="off" onSubmit={handleSubmit}>
                    <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center">Add a New Sponsor</div>
                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Title-1</label>
                    <input type="text" name="name" required value={name} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Title-2</label>
                    <input type="text" name="type"required value={type} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Logo</label>
                    <input type="text" name="logo" value={logo} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" />
                    <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                    <select name="feature" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-none focus:tw-shadow-outline" onChange={handleChange}>
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
                        <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow-outline">Add Sponsor</button>
                        <button type="submit" onClick={() => handleUpdate()} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow-outline">
                            Update Sponsor
                        </button>
                    </div>
                </form>

                <hr />

                <div className="tw-shadow-md tw-m-10 ali">
                    <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center">Added Sponsors</div>
                    {!loading ? (
                        <table className="tw-min-w-full tw-border-collapse tw-box-border">
                            <thead>
                                <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                    <th className="tw-p-1  tw-text-center">Name</th>
                                    <th className="tw-p-1 tw-text-center">Type</th>
                                    <th className="tw-p-1 tw-text-center">Logo</th>
                                    <th className="tw-p-1 tw-text-center">Sequence</th>
                                    <th className="tw-p-1 tw-text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, index) => (
                                    <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                        <td className="tw-p-1 tw-text-center">{item.name}</td>
                                        <td className="tw-p-1 tw-text-center">{item.type}</td>
                                        <td className="tw-p-1  tw-text-center">{item.logo}</td>
                                        <td className="tw-p-1  tw-text-center">{item.sequence}</td>
                                        <td className="tw-p-1 tw-border-hidden tw-text-center  tw-flex tw-justify-evenly">
                                            <button onClick={() => {
                                                handleEdit(item._id)
                                                setEditID(item._id)
                                            }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow-outline">Edit</button>{" "}
                                            <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold  tw-px-4 tw-rounded focus:tw-outline-none focus:tw-shadow-outline">Delete</button>
                                        </td>
                                    </tr>)) : (
                                        <tr>
                                            <td colSpan="5" className="tw-p-1 tw-text-center">No data available</td>
                                        </tr>

                                )}
                            </tbody>
                        </table>
                    ) : (
                        <div><LoadingIcon /></div>
                    )}
                </div>
            </div>
        </main>
    );
};

export default Sponsors;
