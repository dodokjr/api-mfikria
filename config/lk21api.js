const axios = require('axios');

const baseURL = "https://149.56.198.206";

const lk21api = axios.create({
    baseURL,
});

module.exports = lk21api