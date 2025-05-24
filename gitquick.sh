#!/bin/bash
# Usage: ./gitquick.sh "Commit message"

if [ -z "$1" ]; then
  echo "Inserisci un messaggio di commit."
  exit 1
fi

git add .
git commit -m "$1"
git push
