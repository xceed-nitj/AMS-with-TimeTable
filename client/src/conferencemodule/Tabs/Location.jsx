import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const Location = () => {
    const params = useParams();
    const IdConf = params.confid;
  const apiUrl = getEnvironment();

    const initialData={
        "confId": IdConf,
        "description": "",
        "address": "",
        "latitude": "",
        "longitude": "",
        "feature": true,
        "sequence": 0
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState({});
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { description, address, latitude, longitude } = formData;

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

        axios.post(`${apiUrl}/conferencemodule/location`, formData, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/locations/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/location/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/location/${IdConf}`, {
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
            <div className='tw-px-4 sm:tw-px-6 lg:tw-px-8'>
                <div className="tw-block tw-box-border" >
                    <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-m-10 " autoComplete="off" onSubmit={handleSubmit}>
                        <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center" >About Location</div>
                        <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold " >Description</label>
                        <input type="text" name="description" required value={description} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold ">Address</label>
                        <input type="text" name="address" required value={address} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold ">Latitude</label>
                        <input type="text" name="latitude" required value={latitude} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold ">Longitude</label>
                        <input type="text" name="longitude" required value={longitude} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />
                        <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Sequence</label>
                        <input
                            type="number"
                            name="sequence"
                            value={formData.sequence}
                            onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
                        />
                        <label className="tw-block tw-text-gray-700 tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                        <select name="feature" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" onChange={handleChange}>
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>
                        </select>

                        <div className="tw-flex tw-justify-evenly">
                            <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Add</button>
                            <button type="submit" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Update</button>
                        </div>
                    </form>

                    <hr />

                    <div className="tw-shadow-md tw-m-10 tw-ali">
                        <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-mx-auto tw-my-auto tw-grid tw-place-content-center" >Added Information</div>
                        {loading ? (
                            <div>
                                <LoadingIcon />
                            </div>
                        ) : (
                            <table className="tw-min-w-full tw-border-collapse tw-box-border " >
                                <thead>
                                    <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                        <th className="tw-p-1 tw-text-center">Description</th>
                                        <th className="tw-p-1 tw-text-center">Address</th>
                                        <th className="tw-p-1 tw-text-center">Latitude</th>
                                        <th className="tw-p-1 tw-text-center">Longitude</th>
                                        <th className="tw-p-1 tw-text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data && Object.keys(data).length !== 0 ? (
                                        <tr className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                            <td className="tw-p-1 tw-text-center">{data.description}</td>
                                            <td className="tw-p-1 tw-text-center">{data.address}</td>
                                            <td className="tw-p-1 tw-text-center">{data.latitude}</td>
                                            <td className="tw-p-1 tw-text-center">{data.longitude}</td>
                                            <td className="tw-p-1 tw-text-center  tw-flex tw-justify-evenly">
                                                <button onClick={() => { handleEdit(data.id); setEditID(data.id); }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-black"> Edit </button>{" "}
                                                <button onClick={() => handleDelete(data._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-black"> Delete </button>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="tw-p-1 tw-text-center">No conference data available</td>
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

export default Location;
