var mongoose = require('mongoose');
mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_URI);

global.ObjectId = mongoose.Types.ObjectId;

// When successfully connected
mongoose.connection.on('connected', function () {
  console.log('Mongoose connection open to ' + process.env.MONGO_URI);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
  console.log('Mongoose connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
  console.log('Mongoose connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
  mongoose.connection.close(function () {
    console.log('Mongoose connection disconnected through app termination');
    process.exit(0);
  });
});

// set console logs
mongoose.set('debug', process.env.NODE_ENV === 'development');
module.exports = mongoose;
