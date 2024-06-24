const express = require('express');
const {addUser,  getUsers, deleteUser, updateUser, addUserEmail ,getUserbyId} = require('../controller/user.js');
const router = express.Router();

router.get('/getUsers', getUsers);
router.get('/getUser/:id',getUserbyId);
router.post('/addUser', addUser);
router.patch('/updateUser/:id', updateUser);
router.delete('/deleteUser/:id', deleteUser);
router.patch('/addUserEmail/:id', addUserEmail);

module.exports = router;