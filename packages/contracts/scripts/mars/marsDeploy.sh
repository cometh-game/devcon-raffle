#!/bin/bash
set -eu

# Setting Infura or Alchemy key to use for convenience here
export ALCHEMY_KEY="j_dccrP25UjZv5uYxh1mcjEl5o8nWZaf"

# Setting Etherscan key to use for convenience here
#export ETHERSCAN_KEY="FJG9XKWZC5ECE6T86IGM8XI35DME5KYU1E"

# Consume the first argument as a path to the Mars deploy script.
# All other command line arguments get forwarded to Mars.
DEPLOY_SCRIPT="$1"
shift 1

network='arbitrum'
args="$@"

while [[ "$@" ]]; do
  case "$1" in
    --network)
      if [ "$2" ]; then
        network="$2"
        shift 1
      fi
      ;;
    -?)
      # ignore
      ;;
  esac
  shift 1
done

#if [[ "$(git status --porcelain)" ]]; then
#    echo "Error: git working directory must be empty to run deploy script."
#    exit 1
#fi

#if [[ "$(git log --pretty=format:'%H' -n 1)" != "$(cat ./build/canary.hash)" ]]; then
#    echo "Error: Build canary does not match current commit hash. Please run yarn build."
#    exit 1
#fi

# Skip prompt if PRIVATE_KEY variable already exists
if [[ -z "${PRIVATE_KEY:-}" ]]; then
  # Prompt the user for a PRIVATE_KEY without echoing to bash output.
  # Then export PRIVATE_KEY to an environment variable that won't get
  # leaked to bash history.
  #
  # WARNING: environment variables are still leaked to the process table
  # while a process is running, and hence visible in a call to `ps -E`.
  echo "Enter a private key (0x{64 hex chars}) for contract deployment."
  read -s -p "PRIVATE_KEY=" PRIVATE_KEY
  export PRIVATE_KEY
fi

# Log file name
network_log="-${network}"
target_file_name="$(basename -- ${DEPLOY_SCRIPT})"
target_log="-${target_file_name%.*}"
timestamp_log="-$(date +%s)"

yarn mars
ts-node ${DEPLOY_SCRIPT} \
  --waffle-config ./.waffle.json \
  ${args} \
  --log "./cache/deploy${network_log}${target_log}${timestamp_log}.log"
