import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useParams } from "react-router-dom";
import LoadingIcon from "../components/LoadingIcon";
import getEnvironment from "../../getenvironment";

const Contacts = () => {
    const params = useParams();
  const apiUrl = getEnvironment();

    const IdConf = params.confid;
    const initialData={
        "confId": IdConf,
        "title": "",
        "name": "",
        "designation": "",
        "imgLink": "",
        "institute": "",
        "profileLink": "",
        "phone": "",
        "email": "",
        "fax": "",
        "feature": true,
        "sequence": 0

    }
    const [formData, setFormData] = useState(initialData);

    const [editID, setEditID] = useState("");
    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0);
    const [loading, setLoading] = useState(false);

    const { title, name, designation, imgLink, institute, profileLink, phone, email, fax } = formData;

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
                [name]: value==="true",
            });
        }
    
        else{
            setFormData({
                ...formData,
                [name]: value,
            });
        }
        
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${apiUrl}/conferencemodule/contactUs`, formData, {
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
        axios.put(`${apiUrl}/conferencemodule/contactUs/${editID}`, formData, {
            withCredentials: true

        })
            .then(res => {
                setFormData(initialData);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleDelete = (deleteID) => {
        axios.delete(`${apiUrl}/conferencemodule/contactUs/${deleteID}`, {
            withCredentials: true

        })
            .then(res => {
                console.log('DELETED RECORD::::', res);
                setRefresh(refresh + 1);
            })
            .catch(err => console.log(err));
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${apiUrl}/conferencemodule/contactUs/${editIDNotState}`, {
            withCredentials: true

        })
            .then(res => {
                setFormData(res.data);
            })
            .catch(err => console.log(err));
    };

    useEffect(() => {
        setLoading(true);
        axios.get(`${apiUrl}/conferencemodule/contactUs/conference/${IdConf}`, {
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
        <form className="tw-bg-blue-100 tw-shadow-md tw-rounded tw-px-4 md:tw-px-8 tw-pt-6 tw-pb-8 tw-m-4 tw-mt-10 md:tw-m-10" autoComplete="off" onSubmit={handleSubmit}>
            <div className="tw-text-blue-700 tw-text-[28px] tw-font-serif tw-text-center  ">Add New Contact Details</div>
            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Title</label>
            <input
                type="text"
                name="title"
                required
                value={title}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Name</label>
            <input
                type="text"
                name="name"
                required
                value={name}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Designation</label>
            <input
                type="text"
                name="designation"
                required
                value={designation}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Institute</label>
            <input
                type="text"
                name="institute"
                required
                value={institute}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Profile Link </label>
            <input
                type="text"
                name="profileLink"
                required
                value={profileLink}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Image Link</label>
            <input
                type="text"
                name="imgLink"
                value={imgLink} required  
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Phone</label>
            <input
                type="text"
                name="phone"
                required
                value={phone}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Email</label>
            <input
                type="text"
                name="email"
                required
                value={email}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Fax</label>
            <input
                type="text"
                name="fax"
                value={fax} required  
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
            />

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold">Feature</label>
            <select
                name="feature"
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-700 tw-leading-tight focus:tw-outline-black"
                onChange={handleChange}
            >
                <option value={true}>Yes</option>
                <option value={false}>No</option>
            </select>

            <label className="tw-block tw-text-gray-700 tw-text-md md:tw-text-lg tw-ml-1 tw-font-bold ">Sequence<input
                type="number"
                name="sequence"
                value={formData.sequence}
                onChange={handleChange}
                className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-1 tw-mb-2 tw-px-3 tw-text-blue-500 tw-leading-tight focus:tw-outline-black"
            /></label>

            <div className="tw-flex tw-justify-evenly">
                <button type="submit" className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Add </button>
                <button type="submit" onClick={() => { handleUpdate() }} className="tw-bg-blue-500 hover:tw-bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded focus:tw-outline-black">Update </button>
            </div>
        </form>

        <hr />

        <div className="tw-shadow-md tw-m-4 md:tw-m-10 tw-overflow-x-auto">
            <div className="tw-text-black-700 tw-text-[28px] tw-font-serif tw-text-center  ">Added contacts</div>
            {loading ? (
                <div>
                    <LoadingIcon/>

                </div>
            ) : (
                <table className="tw-min-w-full tw-border-collapse tw-box-border">
                    <thead>
                        <tr className="tw-border-[2px] tw-bg-blue-100  tw-border-blue-500">
                            <th className="tw-p-1 tw-text-center">Title</th>
                            <th className="tw-p-1 tw-text-center">Name</th>
                            <th className="tw-p-1 tw-text-center">Designation</th>
                            <th className="tw-p-1 tw-text-center">Institute</th>
                            <th className="tw-p-1 tw-text-center">Phone</th>
                            <th className="tw-p-1 tw-text-center">Email</th>
                            <th className="tw-p-1 tw-text-center">Fax</th>
                            <th className="tw-p-1 tw-text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length > 0 ? data.map((item, index) => (
                            <tr key={index} className="tw-border-[1px] tw-font-serif tw-border-blue-500">
                                <td className="tw-p-1 tw-text-center">{item.title}</td>
                                <td className="tw-p-1 tw-text-center">{item.name}</td>
                                <td className="tw-p-1 tw-text-center">{item.designation}</td>
                                <td className="tw-p-1 tw-text-center">{item.institute}</td>
                                <td className="tw-p-1 tw-text-center">{item.phone}</td>
                                <td className="tw-p-1 tw-text-center">{item.email}</td>
                                <td className="tw-p-1 tw-text-center">{item.fax}</td>
 <td className="tw-p-1 tw-text-center tw-border-hidden tw-flex tw-justify-evenly">                                    <button onClick={() => { handleEdit(item._id); setEditID(item._id) }} className="tw-bg-yellow-500 hover:tw-bg-yellow-700 tw-text-white tw-font-bold tw-px-4 tw-rounded focus:tw-outline-black"> Edit </button>{" "}
                                    <button onClick={() => handleDelete(item._id)} className="tw-bg-red-500 hover:tw-bg-red-700 tw-text-white tw-font-bold  tw-px-4 tw-rounded focus:tw-outline-black"> Delete </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="8" className="tw-p-1 tw-text-center">No data available</td>
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

export default Contacts;
