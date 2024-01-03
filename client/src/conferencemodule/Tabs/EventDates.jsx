import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const EventDates = () => {
    const params = useParams();
    const IdConf = params.confid;
    const apiUrl = getEnvironment();


    const initialData = {
        "confId": IdConf,
        "title": "",
        "date": "",
        "sequence": 0,
        "extended": false,
        "newDate": "",
        "completed": true,
        "featured": true
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, date, sequence, newDate } = formData;

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

        axios.post(`${apiUrl}/conferencemodule/eventDates`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/eventDates/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/eventDates/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/eventDates/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/eventDates/conference/${IdConf}`, {
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
                <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10 " autoComplete="off" onSubmit={handleSubmit}>
                    <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  " >Add New EventDate</div>
                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Title</label>
                    <input type="text" name="title" required   value={title} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700   tw-leading-tight    tw-focus:outline-none tw-focus:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Date</label>
                    <input type="datetime-local"  name="date" value={date} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700   tw-leading-tight    tw-focus:outline-none tw-focus:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Is Date Extended ?</label>
                    <select name="extended" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700   tw-leading-tight    tw-focus:outline-none tw-focus:shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false} selected>No</option>

                    </select>

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold " >New Dates</label> <input type="datetime-local" name="newDate" value={newDate} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700   tw-leading-tight    tw-focus:outline-none tw-focus:shadow-outline" />
                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Featured</label>
                    <select name="featured" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700   tw-leading-tight    tw-focus:outline-none tw-focus:shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>

                    </select>


                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Sequence
                        <input
                            type="number"
                            name="sequence"
                            value={formData.sequence}
                            onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    tw-focus:outline-none tw-focus:shadow-outline"
                        />
                    </label>

                    <div className="tw-flex tw-justify-evenly">
                        <button type="submit" className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:outline-none tw-focus:shadow-outline">Add </button>
                        <button type="submit" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:outline-none tw-focus:shadow-outline">Update</button>
                    </div>
                </form>

                <hr />

                <div className="tw-shadow-md tw-m-4  md:tw-m-10 tw-overflow-x-auto">
                    <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-text-center  " >Event Dates</div>

                    {loading ? (
                        <LoadingIcon />
                    ) : (
                        <table className="tw-min-w-full tw-border-collapse tw-box-border " >
                            <thead>
                                <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                    <th className="tw-p-1 tw-text-center">Title</th>
                                    <th className="tw-p-1 tw-text-center">Date</th>
                                    <th className="tw-p-1 tw-text-center">Extended</th>
                                    <th className="tw-p-1 tw-text-center  ">New Date</th>
                                    <th className="tw-p-1 tw-text-center  ">Sequence</th>
                                    <th className="tw-p-1 tw-text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, index) => (
                                    <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                        <td className="tw-p-1 tw-text-center">{item.title}</td>
                                        <td className="tw-p-1 tw-text-center">{item.date}</td>
                                        <td className="tw-p-1 tw-text-center">{item.extended ? 'Yes' : 'No'}</td>
                                        <td className="tw-p-1 tw-text-center">{item.newDate}</td>
                                        <td className="tw-p-1 tw-text-center">{item.sequence}</td>
                                        <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">                                            <button onClick={() => { handleEdit(item._id); setEditID(item._id); }} className="tw-bg-yellow-500 tw-hover:bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-mx-2 tw-rounded tw-focus:outline-none tw-focus:shadow-outline"> Edit </button>{" "}
                                            <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 tw-hover:bg-red-700 tw-text-white tw-font-bold tw-mx-2 tw-px-4 tw-rounded tw-focus:outline-none tw-focus:shadow-outline"> Delete </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="tw-p-1 tw-text-center">No data available</td>
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

export default EventDates;
