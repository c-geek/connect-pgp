var stream = require('stream');
var util = require('util');

function SigningStream(openpgp, boundary) {
  stream.Stream.call(this);
  this.writable = true;
  this.buffer = "";
  this.openpgp = openpgp;
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
    var ciphertext = that.openpgp.write_signed_message(that.openpgp.keyring.privateKeys[0].obj, body);
    var ciphertext = ciphertext.substring(ciphertext.lastIndexOf('-----BEGIN PGP SIGNATURE-----'));
    var body = '';
    body += '--' + that.boundary + '\n';
    body += that.buffer + '\n\n';
    body += '--' + that.boundary + '\n';
    body += 'Content-Type: application/pgp-signature\n\n';
    body += ciphertext + '\n';
    body += '--' + that.boundary + '--\n';
    callback(body);
  });
  return this.buffer;
};


module.exports.SigningStream = SigningStream;