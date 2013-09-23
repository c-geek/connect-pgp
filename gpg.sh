#!/bin/bash
gpg --batch --no-default-keyring --secret-keyring $1 -s -a --passphrase-fd 3 3<&0 < <(echo $MESSAGE | sed -e "s/\\\\n/\n/g")
