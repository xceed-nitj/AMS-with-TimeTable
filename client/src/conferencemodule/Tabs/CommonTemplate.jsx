import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules={
    toolbar:[
        [{header:[1,2,3,4,5,6,false]}],
        [{font:[]}],
        [{size:[]}],
        [{ color: [] }],
        ["bold","italic","underline","strike","blockquote"],
        [
            {list:"ordered"},
            { list:"bullet"},
            { indent:"-1"},
            { indent:"+1"},
        ],
        ["link","image","video"],
        ["clean"],

    ]
};

function CommonTemplate() {
    const [value, setValue] = useState('');

  return (
    <main className='tw-py-20 tw-bg-gray-100 lg:tw-pl-72 tw-min-h-screen'>
    <div className='tw-px-2 md:tw-px-4 lg:tw-px-8 '>

 
    <ReactQuill
      theme="snow"
      value={value}
      onChange={(value) => setValue(value)}
      className='tw-bg-white ' //tw-min-h-screen 
      modules={modules}
    />
    </div>
    {/* <div dangerouslySetInnerHTML={{__html:value}}>
        
    </div> */}
    <div className='tw-px-2 md:tw-px-4 lg:tw-px-8 '>
        {value}
    </div>
    </main>
  )
}

export default CommonTemplate