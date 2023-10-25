import React from 'react';

function Header() {
  const instituteName = 'Dr B R Ambedkar National Institute of Technology, Jalandhar';
  const department = 'Department of Electrical Engineering';
  const session = '2023-2024'; // Replace with the desired session
  const semester = 'Semester 2'; // Replace with the desired semester

  return (
    <div className="header">
      <div className="logo">
        <img src="../../src/assets/logo.png" alt="Institute Logo" />
      </div>
      <div className="details">
        <div className="line">{instituteName}</div>
        <div className="line">{department}</div>
        <div className="line">{`Session: ${session}, ${semester}`}</div>
      </div>
    </div>
  );
}

export default Header;
