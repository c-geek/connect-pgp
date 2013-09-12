module.exports = function (privateKey, passphrase, keyring) {
  return keyring ? new GPG(privateKey, passphrase, keyring) : new OpenPGPJS(privateKey, passphrase) ;
}

function OpenPGPJS(privateKey, passphrase) {
  var openpgp = require('./openpgp').openpgp;
  openpgp.init();
  openpgp.keyring.importPrivateKey(privateKey, passphrase);

  this.sign = function (message, callback) {
    try{
      callback(null, openpgp.write_signed_message(openpgp.keyring.privateKeys[0].obj, message));
    }
    catch(ex){
      console.warn(ex.toString());
      callback(ex.toString());
    }
  }
}

function GPG(privateKey, passphrase, keyring) {
  var spawn = require('child_process').spawn;
  var fs = require('fs');
  var privateKeyName = 'key' + Date.now();

  fs.writeFileSync(privateKeyName, privateKey, { encoding: 'utf8'})

  var exec = require('child_process').exec;
  exec('./gpg-import.sh ' + keyring + ' ' + privateKeyName, function (error, stdout, stderr) {
    fs.unlink(privateKeyName, function () {
      if(stderr) console.error(stderr);
      if(stdout) console.log(stdout);
    });
  });

  this.sign = function (message, callback) {
    try{
      var strippedMessage = message.replace(/\r\n/, '\n').replace(/\n/, '\\n');
      var cipherText = '';
      var child = spawn('./gpg.sh', [keyring], { env: {MESSAGE: strippedMessage }});

      child.stdin.write(passphrase);
      child.stdin.end();

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', function (data) {
        console.error(data);
        if (/^execvp\(\)/.test(data)) {
          console.log('Failed to start gpg process.');
        }
      });

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', function (data) {
        cipherText += data;
      });

      child.on('close', function () {
        callback(null, cipherText.toString());
      });
    }
    catch(ex){
      callback(ex.toString());
    }
  }
}
