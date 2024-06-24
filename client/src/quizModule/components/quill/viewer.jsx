import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import Quill CSS
import './viewer.css'

const Viewer = ({ content }) => {
  // Define the Quill configuration for viewer mode
  const quillConfig = {
    readOnly: true, // Set Quill to read-only mode
    theme: 'bubble', // or 'bubble' depending on your preferred theme
  };

  return (
    <div className='quill-viewer'>
      <ReactQuill value={content} modules={{ toolbar: false }} theme="snow" readOnly={true} />
    </div>
  );
};

export default Viewer;
