const express = require('express');
const auth = require('../authentication/middleware');

const router = express.Router();

/* GET users listing. */
router.get('/', auth, (req, res, next) => {
  res.send('respond with a resource');
});

module.exports = router;
