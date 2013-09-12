#!/bin/bash
gpg --batch --no-default-keyring --secret-keyring $1 --clearsign -a --passphrase-fd 3 3<&0 < <(echo $MESSAGE | tr "\\\\n" "\r\n")