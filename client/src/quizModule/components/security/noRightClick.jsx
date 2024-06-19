import React from 'react';

const NoRightClickPage = () => {
  const handleContextMenu = (e) => {
    e.preventDefault(); // Prevent default right-click behavior
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <h1>This is a page where right-click is disabled.</h1>
      <p>Right-clicking is not allowed on this page.</p>
    </div>
  );
};

export default NoRightClickPage;
