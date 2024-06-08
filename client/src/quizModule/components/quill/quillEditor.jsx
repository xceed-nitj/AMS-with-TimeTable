import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useRef } from 'react';

// Custom image handler for Quill
const QuillEditor = ({ value, onChange }) => {
  const quillRef = useRef(null);

  const modules = {
    toolbar: 
    {
      container: [
        [{ 'size': ['small', false, 'large', 'huge'] }], 
        // [{ header: [1, 2, 3, 4,5,6,false] }],
        ['bold', 'italic'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['image'], // Include the 'image' button in the toolbar
        [{ 'script': 'sub'}, { 'script': 'super' }],

        [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
        [{ 'direction': 'rtl' }],  

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
        [{ 'font': [] }],
        [{ 'align': [] }],

        ['clean'],
      ],
    },
  };

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={onChange}
      modules={modules}
      theme="snow"
    />
  );
};

export default QuillEditor;
