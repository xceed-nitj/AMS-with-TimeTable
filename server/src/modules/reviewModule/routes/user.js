const express = require('express');
const {addUser,  getUsers, deleteUser, updateUser, addUserEmail ,getUserbyId, getUserbyEmail} = require('../controller/user.js');
const { checkRole } = require('../../checkRole.middleware');
const router = express.Router();

router.get('/getUsers', getUsers);
router.get('/getUser/:id',getUserbyId);
router.get('/getUsermail',getUserbyEmail)
router.post('/addUser', checkRole(['admin']), addUser);
router.patch('/updateUser/:id', checkRole(['admin']), updateUser);
router.delete('/deleteUser/:id', checkRole(['admin']), deleteUser);
router.patch('/addUserEmail/:id', checkRole(['admin']), addUserEmail);

module.exports = router;