var config = {};

config.jwtKey = "secretofmaarifa";
config.dbLink = "mongodb://localhost:27017/db"; //For local server
//config.dbLink = "mongodb://admin:password@ds033639.mongolab.com:33639/uxtracker"; //remote free server
module.exports = config;