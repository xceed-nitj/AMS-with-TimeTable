import React, { useState, useEffect } from "react";
import axios from 'axios'
import { useParams } from "react-router-dom";
const Speaker = () => {
    const params = useParams();
    const IdConf = params.confid;
    const [formData, setFormData] = useState({
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
    });

    const [editID, setEditID] = useState()

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0)

    const { ConfId, Name, Designation, Institute, ProfileLink, ImgLink, TalkType, TalkTitle, Abstract, Bio, sequence, feature } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        axios.post(`${import.meta.env.VITE_API_URL}/speakers`, formData, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                setData([...data, res.data]);
                setFormData({
                    ConfId: IdConf,
                    Name: "",
                    Designation: "",
                    Institute: "",
                    ProfileLink: "",
                    ImgLink: "",
                    TalkType: "",
                    TalkTitle: "",
                    Abstract: "",
                    Bio: "",
                    sequence: 0,
                    feature: true
                }); setRefresh(refresh + 1)

            })
            .catch(err => {console.log(err)
            console.log(formData)});

    };

    const handleUpdate = () => {

        axios.put(`${import.meta.env.VITE_API_URL}/speakers/${editID}`, formData, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                setFormData({
                    ConfId: IdConf,
                    Name: "",
                    Designation: "",
                    Institute: "",
                    ProfileLink: "",
                    ImgLink: "",
                    TalkType: "",
                    TalkTitle: "",
                    Abstract: "",
                    Bio: "",
                    sequence: 0,
                    feature: true
                });
                setRefresh(refresh + 1)
            })
            .catch(err => console.log(err))


    };

    const handleDelete = (deleteID) => {

        axios.delete(`${import.meta.env.VITE_API_URL}/speakers/${deleteID}`, {
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
        axios.get(`${import.meta.env.VITE_API_URL}/speakers/${editIDNotState}`, {
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

        axios.get(`${import.meta.env.VITE_API_URL}/speakers/conference/${IdConf}`, {
            headers: {
                Authorization: import.meta.env.VITE_API_KEY
            }
        })
            .then(res => {
                setData(res.data)
            })
            .catch(err => console.log(err))
    }, [refresh]);

    return (
        <main className='py-10 bg-gray-100 lg:pl-72'>
            <div className='px-4 sm:px-6 lg:px-8'>

                <div className="block box-border" >

                    <form className=" bg-blue-100 shadow-md rounded px-8 pt-6 pb-8 m-10 " onSubmit={handleSubmit}>
                        <div className="text-blue-700 text-[28px] font-serif mx-auto my-auto grid place-content-center" >Add a New Speaker</div>
                        <label className="block text-gray-700 text-lg ml-1  font-bold " >Name of Speaker</label>
                        <input type="text" name="Name" value={Name} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Designation</label>
                        <input type="text" name="Designation" value={Designation} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Institute</label>
                        <input type="text" name="Institute" value={Institute} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Profile Link of Speaker</label>
                        <input type="text" name="ProfileLink" value={ProfileLink} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Image Link of Speaker</label>
                        <input type="ImgLink" name="ImgLink" value={ImgLink} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">TalkType</label>
                        <input type="text" name="TalkType" value={TalkType} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">TalkTitle</label>
                        <input type="text" name="TalkTitle" value={TalkTitle} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Bio</label>
                        <input type="text" name="Bio" value={Bio} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />

                        <label className="block text-gray-700 text-lg ml-1 font-bold ">Abstract</label>
                        <input type="text" name="Abstract" value={Abstract} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" />


{/* <label className="block text-gray-700 text-lg ml-1 font-bold ">Sequence</label>
                        <input type="number" name="sequence" value={sequence} onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-500   leading-tight    focus:outline-none focus:shadow-outline" /> */}



                        <div className="flex justify-evenly">
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Speaker</button>
                            <button type="submit" onClick={() => {
                                handleUpdate()
                            }} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Update Speaker
                            </button>
                        </div>

                    </form>

                    <hr />

                    <div className="shadow-md   m-10 ali">
                        <div className="text-black-700 text-[28px] font-serif mx-auto my-auto grid place-content-center" >Added Speakers</div>
                        <table className="min-w-full border-collapse box-border " >
                            <thead>
                                <tr className="border-[2px] bg-blue-100  border-blue-500">
                                    <th className="p-1 text-center">Name of Speaker</th>
                                    <th className="p-1 text-center">Designation</th>
                                    <th className="p-1 text-center">Institute</th>
                                    <th className="p-1 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index} className="border-[1px] font-serif border-blue-500">
                                        <td className="p-1 text-center">{item.Name}</td>
                                        <td className="p-1 text-center">{item.Designation}</td>
                                        <td className="p-1 text-center">{item.Institute}</td>

                                        <td className="p-1 text-center  flex justify-evenly">
                                            <button onClick={() => {
                                                handleEdit(item.id)
                                                setEditID(item.id)
                                            }} className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold px-4 rounded focus:outline-none focus:shadow-outline"> Edit </button>{" "}
                                            <button onClick={() => handleDelete(item.id)} className="bg-red-500 hover:bg-red-700 text-white font-bold  px-4 rounded focus:outline-none focus:shadow-outline"> Delete </button>
                                        </td>
                                    </tr>))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>

    );
};

export default Speaker;