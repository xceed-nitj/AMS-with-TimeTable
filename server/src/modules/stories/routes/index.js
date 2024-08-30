const express = require('express');
const path = require('path');
const {
  AddStory,
  SearchbyCompany,
  SearchbyName,
  SearchbyBatch,
  SearchbyDept} = require("../controller/story");
//api route to search by company name(searchbycompany),
//student name(searchbyname), dept name(searchbydept), batch(Searchbybatch)

//api to create story: http://localhost:8010/api/v1/stories/addstory
//api to fetch: http://localhost:8010/api/v1/stories/searchbycompany/Google(example)
const router = express.Router();
router.get('/searchbycompany/:companyName', SearchbyCompany);
router.get('/searchbyname/:name', SearchbyName);
router.get('/searchbybatch/:batch', SearchbyBatch);
router.get('/searchbydept/:dept', SearchbyDept);
router.post('/addstory', AddStory);
module.exports = router;