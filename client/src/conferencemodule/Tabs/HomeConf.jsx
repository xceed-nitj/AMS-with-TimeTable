import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import { useNavigate } from "react-router-dom";
import getEnvironment from "../../getenvironment";

const HomeConf = () => {
    const navigate = useNavigate();

    const params = useParams();
    const apiUrl = getEnvironment();

    const IdConf = params.confid;
    const initialData = {
        "confId": IdConf,
        "confName": "",
        "confStartDate": "",
        "confEndDate": "",
        "aboutConf": "",
        "aboutIns": "",
        "youtubeLink": "",
        "instaLink": "",
        "facebookLink": "",
        "twitterLink": "",
        "logo": "",
        "shortName": ""
    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState(null);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { confName, confStartDate, confEndDate, aboutConf, aboutIns, youtubeLink, instaLink, facebookLink, twitterLink, logo, shortName } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data) {
            window.alert('You cannot Add multiple values of this for one conference');
         setFormData(initialData)

        }
        else {
            axios.post(`${apiUrl}/conferencemodule/home`, formData, { withCredentials: true })
            .then(res => {
                setData(res.data);
                console.log(res.data);
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });

        }

    };

    const handleUpdate = () => {
        axios.put(`${apiUrl}/conferencemodule/home/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/home/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setData(null)
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/home/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        var currentURL = window.location.href;
        const IdConf = params.confid;
        if (!currentURL.includes("/cf/adminpanel/" + IdConf + "/home")) {
            navigate("/cf/adminpanel/" + IdConf + "/home")
        }

        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/home/conf/${IdConf}`, {
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
            <div className='tw-px-2 sm:tw-px-4 lg:tw-px-8'>
                <div className="tw-block tw-box-border" >

                    <form autoComplete="off" className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10 " onSubmit={handleSubmit}>
                        <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  " >About Conference</div>
                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1  tw-font-bold " >Name of Conference</label>
                        <input type="text" required name="confName" value={confName} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Starting Date of Conference</label>
                        <input type="date" name="confStartDate" required value={confStartDate} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Ending Date of Conference</label>
                        <input type="date" name="confEndDate" required value={confEndDate} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Description of Conference</label>
                        <input type="text" name="aboutConf" required value={aboutConf} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">About Institute</label>
                        <input type="text" name="aboutIns" value={aboutIns} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Youtube Link</label>
                        <input type="text" name="youtubeLink" value={youtubeLink} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Instagram Link</label>
                        <input type="text" name="instaLink" value={instaLink} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Facebook Link</label>
                        <input type="text" name="facebookLink" value={facebookLink} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Twitter Link</label>
                        <input type="text" name="twitterLink" value={twitterLink} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Logo</label>
                        <input type="text" name="logo" value={logo} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">shortName</label>
                        <input type="text" name="shortName" value={shortName} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500   tw-leading-tight    focus:tw-:outline-none focus:tw-:shadow-outline" />

                        <div className="tw-flex tw-justify-evenly">
                            <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-semibold tw-py-2 px-2  tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline">Add</button>
                            <button type="submit" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-semibold tw-py-2 px-2 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline">Update</button>
                        </div>
                    </form>

                    <hr />

                    <div className="tw-shadow-md  tw-m-4 md:tw-m-10 tw-overflow-x-auto">
                        <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-text-center  " >Added Information</div>
                        {loading ? (
                            <LoadingIcon />
                        ) : (
                            <table className="tw-min-w-full tw-border-collapse tw-box-border " >
                                <thead>
                                    <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                        <th className="tw-p-1 tw-text-center">Name of Conference</th>
                                        <th className="tw-p-1 tw-text-center">Start Date</th>
                                        <th className="tw-p-1 tw-text-center">End Date</th>
                                        <th className="tw-p-1 tw-text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data ? (
                                        <tr className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                            <td className="tw-p-1 tw-text-center">{data.confName}</td>
                                            <td className="tw-p-1 tw-text-center">{data.confStartDate}</td>
                                            <td className="tw-p-1 tw-text-center">{data.confEndDate}</td>
                                            <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">                                                <button onClick={() => { handleEdit(data._id); setEditID(data._id); }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline"> Edit </button>{" "}
                                                <button onClick={() => handleDelete(data._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold  tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline"> Delete </button>
                                            </td>
                                        </tr>
                                    ) : (
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

export default HomeConf;
