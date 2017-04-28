#!/bin/bash

node build.js && echo "Build succeed!"
npm publish . && echo "Successfully published !"
