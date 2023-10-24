import React, { useState, useEffect } from 'react';
import getEnvironment from '../getenvironment';

function LockedSummary() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [editRowIndex, setEditRowIndex] = useState(null);
 
const apiUrl=getEnvironment();
  


  return (
    <div>
      <h1>CSV File Upload</h1>
      {/* <button onClick={}>Upload CSV</button> */}

       <h2>Table of Faculty Data</h2>
    </div>
  );
}

export default LockedSummary;