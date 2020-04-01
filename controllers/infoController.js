const mongoose = require('mongoose');

exports.get = async (req, res) => {
    const { version } = require('../package.json');;
    const environment = process.env.ENV;
    const token_expiration_time = process.env.EXPIRATIONTIME;
    const database = process.env.DATABASE;
    const passwordhash = process.env.PASSWORDHASH;
    const log = process.env.LOG;
    const timestamp = Date.now().toString();
    const info = {version: version, environment: environment, token_expiration_time: token_expiration_time, 
                  database: database, timestamp: timestamp, passwordhash: passwordhash, log:log };
    res.status(200).json(info);
};
