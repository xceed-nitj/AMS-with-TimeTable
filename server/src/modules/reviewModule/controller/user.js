const mongoose = require("mongoose");
const User = require("../../../models/reviewModule/user.js");

const addUser = async (req, res) => {
  const { name, Dept, Designation, College, Period, profession, email, role, password, area } =
    req.body;

  const newUser = new User({
    name: name,
    experience: {
      Dept: Dept,
      Designation: Designation,
      College: College,
      Period: Period,
    },
    profession: profession,
    email: email,
    role:role,
    password: password,
    area: area,
  });

  newUser
    .save()
    .then((savedUser) => res.status(200).send("User saved"))
    .catch((err) => res.status(500).send(err));
};

const getUsers = async (req, res) => {
  try {
    const Users = await User.find({}).exec();
    //console.log("Users", Users);
    res.status(200).send(Users);
  } catch (error) {
    res.status(500).send("Internal server error", error);
  }
};

const deleteUser = async (req, res) => {
    const _id = req.params.id;

    if (!_id) {
        return res.status(400).json({ message: 'No user id provided', type: 'error' });
    }

    try {
        const result = await User.findOneAndDelete({_id:_id});

        if (result.deletedCount > 0) {
            console.log(`Deleted the user with the id ${_id}`);
            return res.status(200).json({ message: `Deleted the user with the id ${_id}`, type: 'success' });
        } else {
            console.log(`User with id ${_id} not found`);
            return res.status(404).json({ message: `User with id ${_id} not found`, type: 'error' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error deleting the user.', type: 'error' });
    }
};


const updateUser = async (req, res) => {
    const userId = req.params.id; 
    const updateFields = req.body;
    
    if (!userId) {
        return res.status(400).json({ message: 'No user id provided', type: 'error' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true });

        if (updatedUser) {
            //console.log(`Updated user with id ${userId}`);
            return res.status(200).json({ message: `Updated user with id ${userId}`, user: updatedUser, type: 'success' });
        } else {
           // console.log(`User with id ${userId} not found`);
            return res.status(404).json({ message: `User with id ${userId} not found`, type: 'error' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error updating the user.', type: 'error' });
    }
};

const addUserEmail = async (req, res) => {
    const userId = req.params.id;
    const newEmail = req.body.email;

    try {
        const user = await User.findById(userId);

        if (user) {
            user.email.push(newEmail);
            await user.save();

            return res.status(200).json({ message: `Added email ${newEmail} to user with id ${userId}`, user, type: 'success' });
        } else {
            
            return res.status(404).json({ message: `User with id ${userId} not found`, type: 'error' });
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error adding email to user.', type: 'error' });
    }
};



module.exports = {addUser,  getUsers, deleteUser, updateUser, addUserEmail };
