#!/usr/bin/env bash
set -e # halt script on error

# If this is the deploy branch, push it up to gh-pages
echo "${DEPLOY_BRANCH}"
echo "${GH_REF}"
if [ $TRAVIS_PULL_REQUEST = "false" ] && [ $TRAVIS_BRANCH = ${DEPLOY_BRANCH} ]; then
  echo "Get ready, we're pushing to gh-pages!"
  cd dist
  git init
  git config user.name "Travis-CI"
  git config user.email "travis@somewhere.com"
  git add .
  git commit -m "CI deploy to gh-pages"
  git push --force --quiet "https://${GH_TOKEN}@${GH_REF}" master:gh-pages
else
  echo "Not a publishable branch so we're all done here"
fi
