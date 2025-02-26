#!/bin/bash
# login to npm first npm login
# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}   RainfallJS NPM Publishing Assistant     ${NC}"
echo -e "${BLUE}============================================${NC}"

# Check if logged in to npm
echo -e "\n${YELLOW}Checking npm login status...${NC}"
NPM_USER=$(npm whoami 2>/dev/null)

if [ $? -ne 0 ]; then
  echo -e "${RED}You are not logged in to npm. Please login:${NC}"
  npm login
else
  echo -e "${GREEN}Logged in as: ${NPM_USER}${NC}"
  echo -e "If this is not the correct account, please run 'npm logout' and then run this script again."
  
  # Ask if they want to continue with this account
  read -p "Continue with this account? (y/n): " CONTINUE
  if [[ ! $CONTINUE =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please logout and login with the correct account.${NC}"
    exit 1
  fi
fi

# Build the package
echo -e "\n${YELLOW}Building the package...${NC}"
npm run build

if [ $? -ne 0 ]; then
  echo -e "${RED}Build failed. Please fix the errors and try again.${NC}"
  exit 1
else
  echo -e "${GREEN}Build successful!${NC}"
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo -e "\n${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Ask what type of version update
echo -e "\n${YELLOW}What type of version update would you like to make?${NC}"
echo "1) Patch (for bug fixes) - x.x.X"
echo "2) Minor (for new features) - x.X.x"
echo "3) Major (for breaking changes) - X.x.x"
echo "4) Custom (enter a specific version)"

read -p "Enter your choice (1-4): " VERSION_CHOICE

case $VERSION_CHOICE in
  1)
    VERSION_TYPE="patch"
    ;;
  2)
    VERSION_TYPE="minor"
    ;;
  3)
    VERSION_TYPE="major"
    ;;
  4)
    read -p "Enter the specific version (e.g., 1.2.3): " CUSTOM_VERSION
    VERSION_TYPE=$CUSTOM_VERSION
    ;;
  *)
    echo -e "${RED}Invalid choice. Exiting.${NC}"
    exit 1
    ;;
esac

# Update version
echo -e "\n${YELLOW}Updating version...${NC}"
if [[ $VERSION_CHOICE -eq 4 ]]; then
  npm version $VERSION_TYPE --no-git-tag-version
else
  npm version $VERSION_TYPE
fi

if [ $? -ne 0 ]; then
  echo -e "${RED}Version update failed. Please check for errors.${NC}"
  exit 1
fi

NEW_VERSION=$(node -p "require('./package.json').version")
echo -e "${GREEN}Updated version to: ${NEW_VERSION}${NC}"

# Confirm publishing
echo -e "\n${YELLOW}Ready to publish @morf_engineering/rainfalljs@${NEW_VERSION} to npm.${NC}"
read -p "Proceed with publishing? (y/n): " PUBLISH_CONFIRM

if [[ ! $PUBLISH_CONFIRM =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Publishing canceled. Your version has been updated but not published.${NC}"
  exit 0
fi

# Publish to npm
echo -e "\n${YELLOW}Publishing to npm...${NC}"
npm publish --access public

if [ $? -ne 0 ]; then
  echo -e "${RED}Publishing failed. Please check for errors.${NC}"
  exit 1
else
  echo -e "${GREEN}Successfully published @morf_engineering/rainfalljs@${NEW_VERSION} to npm!${NC}"
fi

# Push to GitHub if not using custom version
if [[ $VERSION_CHOICE -ne 4 ]]; then
  echo -e "\n${YELLOW}Would you like to push the version commit and tag to GitHub?${NC}"
  read -p "Push to GitHub? (y/n): " PUSH_CONFIRM
  
  if [[ $PUSH_CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}Pushing to GitHub...${NC}"
    git push && git push --tags
    
    if [ $? -ne 0 ]; then
      echo -e "${RED}GitHub push failed. Please check for errors.${NC}"
      echo -e "${YELLOW}You may need to manually push using:${NC}"
      echo "git push && git push --tags"
    else
      echo -e "${GREEN}Successfully pushed to GitHub!${NC}"
    fi
  fi
fi

echo -e "\n${BLUE}============================================${NC}"
echo -e "${GREEN}  Publishing process completed!${NC}"
echo -e "${BLUE}============================================${NC}"