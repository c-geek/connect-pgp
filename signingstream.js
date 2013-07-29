var stream = require('stream');
var util = require('util');

function SigningStream() {
  stream.Stream.call(this);
  this.writable = true;
  this.buffer = "";
};
util.inherits(SigningStream, stream.Stream);

SigningStream.prototype.write = function(data) {
  if (data && data.length)
    this.buffer += data.toString();
};

SigningStream.prototype.end = function(data) {
  this.write(data);
  this.emit('end');
};

SigningStream.prototype.sign = function(callback) {
  var that = this;
  process.nextTick(function () {
    var body = that.buffer;
    callback(body);
  });
  return this.buffer;
};


module.exports.SigningStream = SigningStream;