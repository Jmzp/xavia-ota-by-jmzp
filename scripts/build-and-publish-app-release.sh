#!/bin/bash

# Check if the correct number of arguments are provided
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <runtimeVersion> <xavia-ota-url>"
  exit 1
fi

# Get the current commit hash and message
commitHash=$(git rev-parse HEAD)
commitMessage=$(git log -1 --pretty=%B)

# Assign arguments to variables
runtimeVersion=$1
serverHost=$2

# Normalize serverHost (remove trailing slash to avoid //api path and redirects)
serverHost="${serverHost%/}"

# Debug flag (export DEBUG=1 to enable verbose mode)
DEBUG=${DEBUG:-0}

# Generate a timestamp for the output folder
timestamp=$(date -u +%Y%m%d%H%M%S)
outputFolder="ota-builds/$timestamp"

# Ask the user to confirm the hash, commit message, runtime version, and output folder
echo "Output Folder: $outputFolder"
echo "Runtime Version: $runtimeVersion"
echo "Commit Hash: $commitHash"
echo "Commit Message: $commitMessage"

read -p "Do you want to proceed with these values? (y/n): " confirm

if [ "$confirm" != "y" ]; then
  echo "Operation cancelled by the user."
  exit 1
fi

rm -rf $outputFolder
mkdir -p $outputFolder

# Run expo export with the specified output folder
npx expo export --output-dir $outputFolder --platform android

# Extract expo config property from app.json and save to expoconfig.json
jq '.expo' app.json > $outputFolder/expoconfig.json


# Zip the output folder
cd $outputFolder  
zip -q -r ${timestamp}.zip .

# Optional diagnostics in debug mode
if [ "$DEBUG" = "1" ]; then
  echo "Zip file generated: ${timestamp}.zip"
  echo "Zip size (human readable):"
  du -h ${timestamp}.zip || true
fi

# Build curl args based on debug flag
if [ "$DEBUG" = "1" ]; then
  echo "\nUploading to ${serverHost}/api/upload (DEBUG: verbose, HTTP/1.1) ..."
  CURL_ARGS=( -v --http1.1 )
  CURL_SUFFIX=( -w "\nHTTP_CODE=%{http_code}\n" )
else
  echo "Uploading to ${serverHost}/api/upload..."
  CURL_ARGS=( -sS )
  CURL_SUFFIX=()
fi

# Upload the zip file to the server
curl "${CURL_ARGS[@]}" -X POST "${serverHost}/api/upload" \
  -F "file=@${timestamp}.zip" \
  -F "runtimeVersion=$runtimeVersion" \
  -F "commitHash=$commitHash" \
  -F "commitMessage=$commitMessage" \
  "${CURL_SUFFIX[@]}"

curl_exit=$?
if [ "$DEBUG" = "1" ]; then
  echo "curl exit code: $curl_exit"
fi

echo "Uploaded to ${serverHost}/api/upload"
cd ..

# Remove the output folder and zip file
rm -rf $outputFolder

echo "Removed $outputFolder"
echo "Done"