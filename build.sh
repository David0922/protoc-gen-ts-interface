#!/bin/bash

set -e -x

yarn clean

npx tsc

MAIN=$(realpath ./dist/main.js)
SYMLINK=$(yarn bin)/protoc-gen-ts-interface

chmod +x $MAIN

ln -s $MAIN $SYMLINK
