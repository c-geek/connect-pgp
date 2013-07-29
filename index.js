var SigningStream = require('./signingstream').SigningStream;

module.exports = function sign() {

  return function sign(req, res, next){
    var write = res.write
      , end = res.end
      , stream
      , method
      , doSign = req.headers['accept'] == 'multipart/signed';

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
        if (!this.headerSent) doSign = false;
        this.write(chunk, encoding);
      } else if (!this.headerSent) {
        // response size === 0
        doSign = false;
      }
      return stream
        ? stream.end()
        : end.call(res);
    };

    // Rendering fired
    res.on('header', function(){
      if (!doSign) return;
      console.log("Sign: ", doSign);

      // head
      if ('HEAD' == req.method) return;

      // signature stream
      stream = new SigningStream();

      // header fields
      res.setHeader('Content-Type', 'multipart/signed');
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
