import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const Committees = () => {
    const params = useParams();
    const IdConf = params.confid;
  const apiUrl = getEnvironment();


    const initialData = {
        "ConfId": IdConf,
        "Type": "",
        "Subtype": "",
        "Name": "",
        "Designation": "",
        "Institute": "",
        "ProfileLink": "",
        "ImgLink": "",
        "sequence": 0,
        "feature": true
    };
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { ConfId, Type, Subtype, Name, Designation, Institute, ProfileLink, ImgLink, sequence, feature } = formData;
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "sequence") {
            setFormData({
                ...formData,
                [name]: parseInt(value),
            });
        } else if (name === "feature") {
            setFormData({
                ...formData,
                [name]: value === "true",
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/committee`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/committee/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/committee/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh - 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/committee/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/committee/conference/${IdConf}`, {
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
                    <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif text-center  " >Add a New Committee</div>
                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Type of Committee</label>
                    <input type="text" name="Type" required value={Type} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Subtype of Committee</label>
                    <input type="text" name="Subtype" required   value={Subtype} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold " >Name</label>
                    <input type="text" name="Name" required value={Name} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Designation</label>
                    <input type="text" name="Designation" required value={Designation} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Institute</label>
                    <input type="text" name="Institute" required value={Institute} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Profile Link of Committee</label>
                    <input type="text" name="ProfileLink" required value={ProfileLink} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Image Link of Committee</label>
                    <input type="ImgLink" name="ImgLink" required  value={ImgLink} onChange={handleChange}
                        className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" />

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                    <select name="feature" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline" onChange={handleChange}>
                        <option value={true}>Yes</option>
                        <option value={false}>No</option>
                    </select>

                    <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Sequence
                        <input
                            type="number"
                            name="sequence"
                            value={sequence}
                            onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-:outline-none focus:tw-:shadow-outline"
                        />
                    </label>

                    <div className="tw-flex tw-justify-evenly ">
                        <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline">Add </button>

                        <button type="button" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline">
                            Update 
                        </button>
                    </div>

                </form>

                <hr />

                    <div className="tw-shadow-md  tw-m-4 md:tw-m-10 tw-overflow-x-auto">
                    <div className="tw-text-black-700 tw-text-[28px] tw-font-serif text-center  " >Added committees</div>
                    {loading ? (
                        <LoadingIcon />
                    ) : (
                        <table className="tw-min-w-full tw-border-collapse tw-box-border " >
                            <thead>
                                <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                    <th className="tw-p-1 tw-text-center">Type of Committee</th>
                                    <th className="tw-p-1 tw-text-center">SubType of Committee</th>
                                    <th className="tw-p-1 tw-text-center">Name</th>
                                    <th className="tw-p-1 tw-text-center">Designation</th>
                                    <th className="tw-p-1 tw-text-center">Institute</th>
                                    <th className="tw-p-1 tw-text-center">Sequence</th>
                                    <th className="tw-p-1 tw-text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? data.map((item, index) => (
                                    <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                        <td className="tw-p-1 tw-text-center">{item.Type}</td>
                                        <td className="tw-p-1 tw-text-center">{item.Subtype}</td>
                                        <td className="tw-p-1 tw-text-center">{item.Name}</td>
                                        <td className="tw-p-1 tw-text-center">{item.Designation}</td>
                                        <td className="tw-p-1 tw-text-center">{item.Institute}</td>
                                        <td className="tw-p-1 tw-text-center">{item.sequence}</td>
                                        <td className="tw-p-1 tw-text-center  tw-flex tw-flex-col lg:tw-flex-row  tw-justify-evenly  tw-border-hidden">
                                            <button onClick={() => { handleEdit(item._id); setEditID(item._id); }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline"> Edit </button>{" "}
                                            <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold  tw-px-4 tw-rounded focus:tw-:outline-none focus:tw-:shadow-outline"> Delete </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" className="tw-p-1 tw-text-center">No data available</td>
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

export default Committees;
