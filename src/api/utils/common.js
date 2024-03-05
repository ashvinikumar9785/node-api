const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

const getPlatform = req => req.headers['x-care-platform'];
const getLanguage = req => req.headers['accept-language'];
const generateToken = payload => jwt.sign(payload, process.env.JWT_SECRET);
const getObjectId = id => ObjectId(id);

module.exports = { getPlatform, getLanguage, generateToken, getObjectId };
