# Connect-pgp

A middleware for Connect.js signing HTTP responses.

**THIS MODULE DOES NOTHING YET.**

## Usage

```js
var connect = require('connect');
var pgpsign = require('connect-pgp');

var app = connect();
app.use(pgpsign());
```

## Triggering

Middleware triggers on HTTP header:

    "Accept: multipart/signed"

then answers:

    HTTP/1.1 200 OK
    Content-Type: multipart/signed; boundary=bar; micalg=pgp-sha1; protocol="application/pgp-signature"

    --bar
    Content-Type: text/plain; charset=iso-8859-1
    Content-Transfer-Encoding: quoted-printable
    
    This is the body content.

    Every word and every space in the body content body will be
    signed, even the two fields "Content-Type" and "Content-Transfer-Encoding"
    above, with the new line before this body content.

    --bar
    Content-Type: application/pgp-signature
    
    -----BEGIN PGP MESSAGE-----
    Version: 2.6.2

    iQCVAwUBMJrRF2N9oWBghPDJAQE9UQQAtl7LuRVndBjrk4EqYBIb3h5QXIX/LC//
    jJV5bNvkZIGPIcEmI5iFd9boEgvpirHtIREEqLQRkYNoBActFBZmh9GC3C041WGq
    uMbrbxc+nIs1TIKlA08rVi9ig/2Yh7LFrK5Ein57U/W72vgSxLhe/zhdfolT9Brn
    HOxEa44b+EI=
    =ndaj
    -----END PGP MESSAGE-----

    --bar--

# License

This software is provided under [MIT license](https://raw.github.com/c-geek/connect-pgp/master/LICENSE).
