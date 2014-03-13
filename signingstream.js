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
    var body = that.buffer.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
    var text = body;
    // var start = Date.now();
    that.doSign(body, function (err, ciphertext) {
      // var end = Date.now();
      // console.log("Duration: %sms", (end-start));
      var body = '';
      body += '--' + that.boundary + '\n';
      body += text + '\n\n';
      if(!err){
        ciphertext = ciphertext.substring(ciphertext.lastIndexOf('-----BEGIN PGP SIGNATURE-----'));
        body += '--' + that.boundary + '\n';
        body += 'Content-Type: application/pgp-signature\n\n';
        body += ciphertext + '\n';
      }
      body += '--' + that.boundary + '--\n';
      callback(body);
    });
  });
  return this.buffer;
};

module.exports.SigningStream = SigningStream;
