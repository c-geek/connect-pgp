var stream = require('stream');
var util = require('util');

function SigningStream(sign, boundary) {
  stream.Stream.call(this);
  this.writable = true;
  this.buffer = "";
  this.doSign = sign;
  this.boundary = boundary;
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
    var text = that.buffer.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
    that.doSign(text, function (err, signature) {
      var body = '';
      body += '--' + that.boundary + '\r\n';
      body += 'Content-Type: octet-stream\r\n\r\n';
      body += text + '\r\n';
      if(!err){
        signature = signature.substring(signature.lastIndexOf('-----BEGIN PGP SIGNATURE-----'));
        body += '--' + that.boundary + '\r\n';
        body += 'Content-Type: application/pgp-signature\r\n\r\n';
        body += signature + '\r\n';
      }
      body += '--' + that.boundary + '--\r\n';
      callback(body);
    });
  });
  return this.buffer;
};

module.exports.SigningStream = SigningStream;
