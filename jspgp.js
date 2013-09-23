module.exports = function (privateKey, passphrase, keyring) {
  return keyring ? new GPG(privateKey, passphrase, keyring) : new OpenPGPJS(privateKey, passphrase) ;
}

function OpenPGPJS(privateKey, passphrase) {
  var openpgp = require('./openpgp').openpgp;
  openpgp.init();
  openpgp.keyring.importPrivateKey(privateKey, passphrase);

  this.sign = function (message, callback) {
    var cleaned = message;
    cleaned = cleaned.replace(/-----BEGIN PGP([A-Z ]*)-----/g, 'BEGIN PGP$1');
    cleaned = cleaned.replace(/-----END PGP([A-Z ]*)-----/g, 'END PGP$1');
    callback(null, cleaned, openpgp.write_signed_message(openpgp.keyring.privateKeys[0].obj, message));
  }
}

function GPG(privateKey, passphrase, keyring) {
  var spawn = require('child_process').spawn;
  var fs = require('fs');
  var privateKeyName = 'key' + Date.now();

  fs.writeFileSync(privateKeyName, privateKey, { encoding: 'utf8'})

  var exec = require('child_process').exec;
  exec(__dirname + '/gpg-import.sh ' + keyring + ' ' + privateKeyName, function (error, stdout, stderr) {
    fs.unlink(privateKeyName, function () {
      if(stderr) console.error(stderr);
      if(stdout) console.log(stdout);
    });
  });

  this.sign = function (message, callback) {
    try{
      var strippedMessage = message.replace(/\r\n/, '\n').replace(/\n/, '\\n');
      var cipherText = '';
      var child = spawn(__dirname + '/gpg.sh', [keyring], { env: {MESSAGE: strippedMessage }});

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
        callback(null, message, cipherText.toString());
      });
    }
    catch(ex){
      callback(ex.toString());
    }
  }
}
