var SigningStream = require('./signingstream').SigningStream;

var chars = "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
signFuction should be the following:
  
  function (cleartext, callback);

  - `cleartext`: a `String` var to be signed
  - `callback`: a function(err, ciphertext) width:
    * `err`: a string containing error if one occured
    * `signature`: a string containing ASCII armored signature

  Note: a valid PGP signatures matches this format:

  > -----BEGIN PGP SIGNATURE-----
  > ...
  > -----END PGP SIGNATURE-----
**/

module.exports = function sign(signFunction) {

  return function sign(req, res, next){
    var write = res.write
      , end = res.end
      , stream
      , method
      , doSign = req.headers['accept'] == 'multipart/signed'
      , boundary = 'foo';

    // see compress.js #724
    req.on('close', function(){
      res.write = res.end = function(){};
    });

    // proxy
    res.write = function(chunk, encoding){
      if (!this.headerSent) this._implicitHeader();
      return stream
        ? stream.write(new Buffer(chunk, encoding))
        : write.call(res, chunk, encoding);
    };

    res.end = function(chunk, encoding){
      if (chunk) {
        doSign = doSign && !this.headerSent;
        this.write(chunk, encoding);
      } else if (!this.headerSent) {
        // response size === 0
      }
      return stream
        ? stream.end()
        : end.call(res);
    };

    // Rendering fired
    res.on('header', function(){
      if (!doSign) return;

      // head
      if ('HEAD' == req.method) return;

      var boundary = "";
      for (var i = 0; i < 15; i++) {
        var num = Math.floor(Math.random() * 100) % 62;
        boundary += chars[num];
      };

      // signature stream
      stream = new SigningStream(signFunction, boundary);

      // header fields
      var contentType = 'multipart/signed;';
      contentType += ' boundary='+boundary+';';
      //contentType += ' micalg=pgp-sha1;';
      contentType += ' protocol="application/pgp-signature"';
      res.setHeader('Content-Type', contentType);
      res.removeHeader('Content-Length');

      // signature

      stream.on('data', function(chunk){
        write.call(res, chunk);
      });

      stream.on('end', function(){
        this.sign(function (body) {
          end.call(res, body);
        });
      });

      stream.on('drain', function() {
        res.emit('drain');
      });
    });

    next();
  };
};
