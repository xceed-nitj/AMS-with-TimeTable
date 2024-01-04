import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";
const ConferencePage = () => {
  const apiUrl = getEnvironment();

    const [formData, setFormData] = useState({
        "email": "",
        "name": ""
    });

    const [editID, setEditID] = useState();
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);

    const { email, name } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/conf`, formData, {
            withCredentials: true
        })
            .then(res => {
                setData([...data, res.data]);
                setFormData({
                    "email": "",
                    "name": ""
                });
                setRefresh(refresh - 1);
            })
            .catch(err => console.log(err));
    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/conf/${editID}`, formData, { withCredentials: true})
            .then(res => {
                setFormData({
                    email: "",
                    name: "",
                });
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(formData);
                console.log(err);
            });
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/conf/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/conf/${editIDNotState}`, {
            withCredentials: true
        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/conf`, {
            withCredentials: true
        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false));

            
    }, [refresh]);

    return (
        <div className="tw-block box-border">
            <form className="tw-bg-blue-100 lg:tw-max-w-4xl lg:tw-mx-auto tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10" autoComplete="off" onSubmit={handleSubmit}>
                <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  ">Create a new Conference</div>
                <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Email</label>
                <input
                    type="email"
                    required
                    name="email"
                    value={email}
                    onChange={handleChange}
                    className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black"
                />

                <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Name of Conference</label>
                <input
                    type="text"
                    required
                    name="name"
                    value={name}
                    onChange={handleChange}
                    className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black"
                />

                <div className="tw-flex tw-justify-evenly tw-mt-5">
                    <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Add </button>
                    <button
                        type="button"
                        onClick={() => {
                            handleUpdate();
                        }}
                        className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black"
                    >
                        Update 
                    </button>
                </div>
            </form>

            <hr />

            <div>
                <div className="tw-text-black tw-text-[28px] tw-font-serif tw-text-center  ">Existing Conferences</div>

                {!loading ? (
                    <div className="tw-flex tw-flex-wrap tw-justify-evenly tw-items-center">
                        {data.length > 0 ? (
                            data.map((item, index) => (
                                <Link key={item._id} to={`/cf/adminpanel/${item._id}`}>
                                    <div className="tw-w-[280px] md:tw-w-[320px] tw-h-[200px] tw-flex tw-flex-col tw-justify-evenly tw-bg-blue-100  tw-rounded-lg tw-box-border tw-m-5 hover:tw-bg-blue-300 hover:tw-shadow-xl ">
                                        <table className="tw-min-w-full mx-2 md:tw-mx-5 tw-bg-transparent tw-border-collapse tw-box-border">
                                            <tbody >
                                                <tr>
                                                    <td className="tw-p-1 tw-font-bold tw-border-hidden tw-text-center">Email</td>
                                                    <td className="tw-font-bold tw-border-hidden">:</td>
                                                    <td className="tw-p-1 tw-text-center tw-border-hidden">{item.email}</td>
                                                </tr>
                                                <tr>
                                                    <td className="tw-p-1 tw-font-bold tw-border-hidden tw-text-center">Name</td>
                                                    <td className="tw-font-bold tw-border-hidden">:</td>
                                                    <td className="tw-p-1 tw-text-center tw-border-hidden">{item.name}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <Link to="/cf/adminpanel">
                                            <div className="tw-p-1 tw-text-center tw-flex tw-justify-evenly">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleEdit(item._id);
                                                        setEditID(item._id);
                                                    }}
                                                    className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-black"
                                                >
                                                    Edit
                                                </button>{" "}
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-black"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </Link>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="tw-p-1 tw-text-center">No Conference data available</div>
                        )}
                    </div>
                ) : (
                    <div>
                        <LoadingIcon />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConferencePage;
