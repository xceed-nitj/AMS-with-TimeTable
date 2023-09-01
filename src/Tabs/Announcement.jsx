import React, { useState, useEffect } from "react";
import axios from 'axios'
import { useParams } from "react-router-dom";

const Announcement = () => {
    const params=useParams();
    const IdConf=params.confid;
    const [formData, setFormData] = useState({
        
            "confId": IdConf,
            "title": "",
            "metaDescription": "",
            "description": "",
            "sequence": 0,
            "feature": true,
            "new": true,
            "hidden": true,
            "link": ""
          
    });

    const [editID, setEditID] = useState()

    const [data, setData] = useState([]);
    const [refresh, setRefresh] = useState(0)

    const {  confId,title, metaDescription,description,sequence,feature, hidden,link } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
       
            axios.post(`${import.meta.env.VITE_API_URL}/announcement`, formData, {
                headers: {
                    Authorization: import.meta.env.VITE_API_KEY
                }
            })
            .then(res => {
                setData([...data, res.data]);
                setFormData({
                    confId: IdConf,
                    title: "",
                    metaDescription: "",
                    description: "",
                    sequence: 0,
                    feature: true,
                    new: true,
                    hidden: true,
                    link: ""
                });                    setRefresh(refresh + 1)

            })
            .catch(err =>{console.log(err);
            console.log(formData)} );
        
    };

    const handleUpdate = () => {

            axios.put(`${import.meta.env.VITE_API_URL}/announcement/${editID}`, formData, {
                headers: {
                    Authorization: import.meta.env.VITE_API_KEY
                }
            })
                .then(res => {
                    setFormData({ 
                        confId: IdConf,
                        title: "",
                        metaDescription: "",
                        description: "",
                        sequence: 0,
                        feature: true,
                        new: true,
                        hidden: true,
                        link: "" });
                    setRefresh(refresh + 1)
                })
                .catch(err => console.log(err))

       
    };

    const handleDelete = (deleteID) => {

        axios.delete(`${import.meta.env.VITE_API_URL}/announcement/${deleteID}`,  {
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
        axios.get(`${import.meta.env.VITE_API_URL}/announcement/${editIDNotState}`, {
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
       
        axios.get(`${import.meta.env.VITE_API_URL}/announcement/conf/${IdConf}`, {
                headers: {
                    Authorization: import.meta.env.VITE_API_KEY
                }
            })
            .then(res => {
                setData(res.data)
            })
            .catch(err => console.log(err))
        // console.log(data);
    }, [refresh]);

    return (
       
<main className='py-10 bg-gray-100 lg:pl-72'>
    <div className='px-4 sm:px-6 lg:px-8'>                   
                    <form className =" bg-blue-100 shadow-md rounded px-8 pt-6 pb-8 m-10 " onSubmit={handleSubmit}>
                    <div className="text-blue-700 text-[28px] font-serif mx-auto my-auto grid place-content-center" >Add a New Announcement</div>
                            <label className ="block text-gray-700 text-lg ml-1 font-bold ">Title</label>
                            <input type="text" name="title" value={title} onChange={handleChange}
                            className ="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-700   leading-tight    focus:outline-none focus:shadow-outline"/> 

                            <label className ="block text-gray-700 text-lg ml-1 font-bold ">Meta Description</label>
                            <input type="text" name="metaDescription" value={metaDescription} onChange={handleChange}
                            className ="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-700   leading-tight    focus:outline-none focus:shadow-outline"/> 
                          
                            <label className="block text-gray-700 text-lg ml-1  font-bold " >Description</label>
                            <input type="text"  name="description" value={description} onChange={handleChange}
                            className ="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-700   leading-tight    focus:outline-none focus:shadow-outline"/> 

                            <label className ="block text-gray-700 text-lg ml-1 font-bold ">Link</label>
                            <input type="text" name="link" value={link} onChange={handleChange}
                            className ="shadow appearance-none border rounded w-full py-1 mb-2 px-3 text-blue-700   leading-tight    focus:outline-none focus:shadow-outline"/> 

                            
                           

                            
                        <div className ="flex justify-evenly">
                        <button type="submit"  className ="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Announcement</button>
                        <button type="submit"  onClick={() => {
                            handleUpdate()
                        }}  className ="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Update Announcement
                        </button>  
                        </div>
                        
                    </form>
                    
                    <hr />
                    
                  <div className="shadow-md   m-10 ali">
                  <div className="text-black-700 text-[28px] font-serif mx-auto my-auto grid place-content-center" >Added Announcements</div>
                    <table className="min-w-full border-collapse box-border " >
                        <thead>
                            <tr className="border-[2px] bg-blue-100  border-blue-500">
                            <th className="p-1 text-center">Title</th>
                            <th className="p-1 text-center">Meta Description</th>

                                <th className="p-1 text-center  ">Description</th>
                                <th className="p-1 text-center">Link</th>
                                <th className="p-1 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, index) => (
                                <tr key={index} className="border-[1px] font-serif border-blue-500">
                                    <td className="p-1 text-center">{item.title}</td>
                                    <td className="p-1 text-center">{item.metaDescription}</td>
                                    <td className="p-1 text-center">{item.description}</td>
                                    <td className="p-1 text-center">{item.link}</td>
                                   
                                    
                                    <td className="p-1 text-center  flex justify-evenly">
                                        <button onClick={() => {handleEdit(item.id)
                                        setEditID(item.id) }} className ="bg-yellow-500 hover:bg-yellow-700 text-white font-bold px-4 mx-2 rounded focus:outline-none focus:shadow-outline"> Edit </button>{" "}
                                        <button  onClick={() => handleDelete(item.id)} className ="bg-red-500 hover:bg-red-700 text-white font-bold mx-2 px-4 rounded focus:outline-none focus:shadow-outline"> Delete </button>
                                    </td>
                                </tr>))}
                        </tbody>
                    </table>
                    </div>
                </div>
                </main>
           
    );
};

export default Announcement;