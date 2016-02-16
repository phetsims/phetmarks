#!/bin/bash

[ `git ls-remote origin -h refs/heads/master | awk '{print $1}'` = `git rev-parse HEAD` ]
