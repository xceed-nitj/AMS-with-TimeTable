import React, { useState , useEffect} from "react";
import getEnvironment from "../getenvironment";
import { Button, Input, Text } from "@chakra-ui/react";
import Header from '../components/header';

function Del() {
  const [code, setCode] = useState('');
  const apiUrl = getEnvironment();
  const [isInputValid, setIsInputValid] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [messages, setMessages] = useState([]);

  // const deleteNotification = async (messageId) => {
  //   try {
  //     const condirmDeleteNotify = window.confirm("Are you sure you want to delete this message?");
  //     if (!condirmDeleteNotify) {
  //       return; // Exit if the user cancels the confirmation
  //     }
  //     const response = await fetch(`${apiUrl}/timetablemodule/message/delete/${messageId}`, {
  //       method: "DELETE",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include"
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log("Fetched messages data:", data); // Log the fetched data
  //       setMessages(messages.filter((message) => message._id !== messageId));
  //       console.log("Fetched messages:", messages); // Log the fetched messages
  //     } else {
  //       console.error("Failed to fetch messages");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching messages:", error);
  //   }}

  const handleInputChange = (e) => {
    const input = e.target.value;
    setCode(input);
    setIsInputValid(input.trim().length > 0); // Check if input is not empty
  };
  // const fetchMessages = async () => {
  //   try {
  //     const response = await fetch(`${apiUrl}/timetablemodule/message/myMessages`, {
  //       method: "GET",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include"
  //     });
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log("Fetched messages data:", data); // Log the fetched data
  //       setMessages(data.data);
  //       console.log("Fetched messages:", messages); // Log the fetched messages
  //     } else {
  //       console.error("Failed to fetch messages");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching messages:", error);
  //   }
  // };
  // useEffect(() => {
  //   fetchMessages();
  // }, []);

  const deleteEntry = (tableName) => {
    if (!isInputValid) {
      alert("Please provide a valid code.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete entries with code '${code}' from ${tableName}?`);
    if (confirmDelete) {
      fetch(`${apiUrl}/timetablemodule/${tableName}/deletebycode/${code}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
      })
      .then(response => {
        if (response.ok) {
            setDeleteMessage(`Deleted entries with code '${code}' from ${tableName}`);
            setTimeout(() => {
                setDeleteMessage('');
              }, 3000); 
          console.log(`Deleted entries with code '${code}' from ${tableName}`);
        } else {
          throw new Error('Delete request failed');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert("Failed to delete entries");
      });
    }
  };

  return (
    <div>
      <h1>Delete Entries</h1>
      <label htmlFor="codeInput">Code:</label>
      <Input type="text" id="codeInput" value={code} onChange={handleInputChange} />


      {deleteMessage && <Text color="green">{deleteMessage}</Text>}

      <table>
        <tr>
          <td> Delete Subject data for this code:</td>
          <td><Button onClick={() => deleteEntry('subject')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
        <tr>
          <td>Delete Semester data for this code:</td>
          <td><Button onClick={() => deleteEntry('addsem')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
        <tr>
          <td>Delete Faculty data for this code:</td>
          <td><Button onClick={() => deleteEntry('addfaculty')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
        <tr>
          <td>Delete Room data for this code:</td>
          <td><Button onClick={() => deleteEntry('addroom')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
        <tr>
          <td>Delete Class Table for this code:</td>
          <td><Button onClick={() => deleteEntry('tt')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
        <tr>
          <td>Delete Locked Time Table for this code:</td>
          <td><Button onClick={() => deleteEntry('lock')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
        <tr>
          <td>Delete Session for this code:</td>
          <td><Button onClick={() => deleteEntry('timetable')} disabled={!isInputValid}>Delete</Button></td>
        </tr>
      </table>

      
      


    </div>
  );
}

export default Del;
