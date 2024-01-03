import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const Speaker = () => {
    const params = useParams();
    const IdConf = params.confid;
  const apiUrl = getEnvironment();


    // Define your initial data here
    const initialData = {
        "ConfId": IdConf,
        "Name": "",
        "Designation": "",
        "Institute": "",
        "ProfileLink": "",
        "ImgLink": "",
        "TalkType": "",
        "TalkTitle": "",
        "Abstract": "",
        "Bio": "",
        "sequence": 0,
        "feature": true
    };

    const [formData, setFormData] = useState(initialData);
    const [editID, setEditID] = useState();
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { ConfId, Name, Designation, Institute, ProfileLink, ImgLink, TalkType, TalkTitle, Abstract, Bio, sequence, feature } = formData;

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

        axios.post(`${apiUrl}/conferencemodule/speakers`, formData, {
            withCredentials: true

        })
            .then(res => {
                setData([...data, res.data]);
                setFormData(initialData); // Reset the form data to initialData
                setRefresh(refresh + 1);
            })
            .catch(err => {
                console.log(err);
                console.log(formData);
            });

    };

    const handleUpdate = () => {

        axios.put(`${apiUrl}/conferencemodule/speakers/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData); // Reset the form data to initialData
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {

        axios.delete(`${apiUrl}/conferencemodule/speakers/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/speakers/${editIDNotState}`, {
            withCredentials: true

        })

            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true)
        axios.get(`${apiUrl}/conferencemodule/speakers/conference/${IdConf}`, {
            withCredentials: true

        })
            .then(res => {
                setData(res.data);
            })
            .catch(err => console.log(err))
            .finally(() => setLoading(false))
    }, [refresh]);

    return (
        <main className='tw-py-10 tw-bg-gray-100 lg:tw-pl-72 tw-min-h-screen'>
            <div className='tw-px-2 md:tw-px-4 lg:tw-px-8'>

                <div className="tw-block tw-box-border" >

                    <form className=" tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10 " onSubmit={handleSubmit} autoComplete="off">
                        <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  " >Add a New Speaker</div>
                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1  tw-font-bold " >Name of Speaker</label>
                        <input type="text" required name="Name" value={Name}   onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Designation</label>
                        <input type="text" name="Designation"required value={Designation} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Institute</label>
                        <input type="text" name="Institute" required value={Institute} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Profile Link of Speaker</label>
                        <input type="text" name="ProfileLink"required value={ProfileLink} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Image Link of Speaker</label>
                        <input type="text" name="ImgLink" value={ImgLink} required  onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">TalkType</label>
                        <input type="text" name="TalkType"required value={TalkType} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">TalkTitle</label>
                        <input type="text" name="TalkTitle"required value={TalkTitle} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Bio</label>
                        <input type="text" name="Bio" required  value={Bio} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Abstract</label>
                        <input type="text" name="Abstract" required  value={Abstract} onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black" />
                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Sequence<input
                            type="number"
                            name="sequence"
                            value={formData.sequence}
                            onChange={handleChange}
                            className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black"
                        /></label>

                        <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
                        <select name="feature" className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black" onChange={handleChange}>
                            <option value={true}>Yes</option>
                            <option value={false}>No</option>

                        </select>
                        <div className="tw-flex tw-justify-evenly">
                            <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-semibold  tw-px-2 tw-rounded focus:tw-outline-black">Add </button>
                            <button type="button" onClick={handleUpdate} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-semibold tw-px-2 tw-rounded focus:tw-outline-black">
                                Update
                            </button>
                        </div>

                    </form>

                    <hr />

                    <div className="tw-shadow-md  tw-m-4 md:tw-m-10 tw-overflow-x-auto">
                        <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-text-center  " >Added Speakers
                        </div>
                        {!loading ? (

                            <table className="tw-min-w-full tw-border-collapse tw-box-border " >
                                <thead>
                                    <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                                        <th className="tw-p-1 tw-text-center">Name of Speaker</th>
                                        <th className="tw-p-1 tw-text-center">Designation</th>
                                        <th className="tw-p-1 tw-text-center">Institute</th>
                                        <th className="tw-p-1 tw-text-center">Sequence</th>

                                        <th className="tw-p-1 tw-text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.length > 0 ? data.map((item, index) => (
                                        <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                            <td className="tw-p-1 tw-text-center">{item.Name}</td>
                                            <td className="tw-p-1 tw-text-center">{item.Designation}</td>
                                            <td className="tw-p-1 tw-text-center">{item.Institute}</td>
                                            <td className="tw-p-1 tw-text-center">{item.sequence}</td>

                                          <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">                                                <button onClick={() => {
                                                    handleEdit(item._id)
                                                    setEditID(item._id)
                                                }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-2 tw-rounded focus:tw-outline-black"> Edit </button>{" "}
                                                <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold  tw-px-2 tw-rounded focus:tw-outline-black"> Delete </button>
                                            </td>
                                        </tr>)) : (
                                            <tr>                                        <td colSpan="5" className="tw-p-1 tw-text-center">No data available</td>
                                            </tr>

                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div><LoadingIcon/></div>
                        )}

                    </div>


                </div>
            </div>
        </main>
    );
};

export default Speaker;
