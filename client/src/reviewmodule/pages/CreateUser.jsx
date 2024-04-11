import React, { useState } from 'react';

const CreateUser = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleFullNameChange = (event) => {
    setFullName(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Here you can implement your user creation logic, e.g., sending the user data to a server to create a new user
    console.log('Full Name:', fullName);
    console.log('Email:', email);
    console.log('Password:', password);
  };

  return (
    <div className="tw-flex tw-items-center tw-justify-center tw-h-screen">
      <div className="tw-bg-white tw-shadow-md tw-rounded tw-px-8 tw-pt-6 tw-pb-8 tw-mb-4">
        <h2 className="tw-text-2xl tw-mb-4 tw-text-center">Create User</h2>
        <form onSubmit={handleSubmit}>
          <div className="tw-mb-4">
            <label htmlFor="fullName" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">
              Full Name:
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={handleFullNameChange}
              className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
              required
            />
          </div>
          <div className="tw-mb-4">
            <label htmlFor="email" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleEmailChange}
              className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
              required
            />
          </div>
          <div className="tw-mb-6">
            <label htmlFor="password" className="tw-block tw-text-gray-700 tw-text-sm tw-font-bold tw-mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              className="tw-shadow tw-appearance-none tw-border tw-rounded tw-w-full tw-py-2 tw-px-3 tw-text-gray-700 tw-leading-tight tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
              required
            />
          </div>
          <div className="tw-flex tw-items-center tw-justify-center">
            <button
              type="submit"
              className="tw-bg-blue-500 tw-hover:bg-blue-700 tw-text-white tw-font-bold tw-py-2 tw-px-4 tw-rounded tw-focus:tw-outline-none tw-focus:tw-shadow-outline"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
