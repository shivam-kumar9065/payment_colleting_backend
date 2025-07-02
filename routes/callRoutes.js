const express = require("express");
const { callCustomer } = require("../controllers/callController");
const router = express.Router();

router.post("/call", callCustomer);

module.exports = router;
