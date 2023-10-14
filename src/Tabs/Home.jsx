import React, { useState, useEffect } from "react";
import axios from 'axios'
import { useParams } from "react-router-dom";
const Home = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [formData, setFormData] = useState({


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
        "shortName": "",

    });

    const [editID, setEditID] = useState()

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0)

    const { confId, confName, confStartDate, confEndDate, aboutConf, aboutIns, youtubeLink, instaLink, facebookLink, twitterLink, logo, shortName } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${import.meta.env.VITE_API_URL}/home`, formData, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                setData( res.data);
                console.log(res.data);
                setFormData({

                    confId: IdConf,
                    confName: "",
                    confStartDate: "",
                    confEndDate: "",
                    aboutConf: "",
                    aboutIns: "",
                    youtubeLink: "",
                    instaLink: "",
                    facebookLink: "",
                    twitterLink: "",
                    logo: "",
                    shortName: "",
                }); setRefresh(refresh + 1)

            })
            .catch(err => {console.log(err);
            console.log(formData)});

    };

    const handleUpdate = () => {

        axios.put(`${import.meta.env.VITE_API_URL}/home/${editID}`, formData, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                setFormData({
                    confId: IdConf,
                    confName: "",
                    confStartDate: "",
                    confEndDate: "",
                    aboutConf: "",
                    aboutIns: "",
                    youtubeLink: "",
                    instaLink: "",
                    facebookLink: "",
                    twitterLink: "",
                    logo: "",
                    shortName: ""
                });
                setRefresh(refresh + 1)
            })
            .catch(err => console.log(err))


    };

    const handleDelete = (deleteID) => {

        axios.delete(`${import.meta.env.VITE_API_URL}/home/${deleteID}`, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                console.log('DELETD RECORD::::', res)
                setRefresh(refresh + 1)


            })
            .catch(err => console.log(err))
    };

    const handleEdit = (editIDNotState) => {
        axios.get(`${import.meta.env.VITE_API_URL}/home/${editIDNotState}`, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })

            .then(res => {
                setFormData(res.data)

            })
            .catch(err => console.log(err))
    };

    useEffect(() => {

        axios.get(`${import.meta.env.VITE_API_URL}/home/conf/${IdConf}`, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                setData(res.data)
                console.log(data)
            })
            .catch(err => console.log(err))
    }, [refresh]);

    return (
        <main className='py-10 bg-gray-100 lg:pl-72'>
            <div className='px-4 sm:px-6 lg:px-8'>

                <div className="block box-border" >

                    <form className=" bg-blue-100 shadow-md rounded px-8 pt-6 pb-8 m-10 " onSubmit={handleSubmit}>
                        <div className="text-blue-700 text-[28px] font-serif mx-auto my-auto grid place-content-center" >About Conference</div>
                        <label className="block text-gray-700 text-lg ml-1  font-bold " >Name of Conference</label>
                        <input type="text" name="confName" value={confName} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Starting Date of Conference</label>
                        <input type="date" name="confStartDate" value={confStartDate} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Ending Date of Conference</label>
                        <input type="date" name="confEndDate" value={confEndDate} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Description of Conference</label>
                        <input type="text" name="aboutConf" value={aboutConf} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">About Institute</label>
                        <input type="ImgLink" name="aboutIns" value={aboutIns} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Youtube Link</label>
                        <input type="text" name="youtubeLink" value={youtubeLink} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Instagram Link</label>
                        <input type="text" name="instaLink" value={instaLink} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Facebook Link</label>
                        <input type="text" name="facebookLink" value={facebookLink} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Twitter Link</label>
                        <input type="text" name="twitterLink" value={twitterLink} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Logo</label>
                        <input type="text" name="logo" value={logo} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">shortName</label>
                        <input type="text" name="shortName" value={shortName} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />




                        <div className="flex justify-evenly">
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add</button>
                            <button type="submit" onClick={() => {
                                handleUpdate()
                            }} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Update
                            </button>
                        </div>

                    </form>

                    <hr />

                    <div className="shadow-md   m-10 ali">
                        <div className="text-black-700 text-[28px] font-serif mx-auto my-auto grid place-content-center" >Added Information</div>
                        <table className="min-w-full border-collapse box-border " >
                            <thead>
                                <tr className="border-[2px] bg-blue-100  border-blue-500">
                                    <th className="p-1 text-center">Name of Conference</th>
                                    <th className="p-1 text-center">Start Date</th>
                                    <th className="p-1 text-center">End Date</th>
                                    <th className="p-1 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
    {data && Object.keys(data).length !== 0 ? (
        <tr className="border-[1px] font-serif border-blue-500">
            <td className="p-1 text-center">{data.confName}</td>
            <td className="p-1 text-center">{data.confStartDate}</td>
            <td className="p-1 text-center">{data.confEndDate}</td>
            <td className="p-1 text-center  flex justify-evenly">
                <button onClick={() => {
                    handleEdit(data.id);
                    setEditID(data.id);
                }} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold px-4 rounded focus:outline-none focus:shadow-outline"> Edit </button>{" "}
                <button onClick={() => handleDelete(data.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold  px-4 rounded focus:outline-none focus:shadow-outline"> Delete </button>
            </td>
        </tr>
    ) : (
        <tr>
            <td colSpan="4" className="p-1 text-center">No conference data available</td>
        </tr>
    )}
</tbody>


                        </table>
                    </div>
                </div>
            </div>
        </main>

    );
};

export default Home;