echo 'Switching to branch production'
git checkout production

echo 'Buildning app...'
npm run buildToDir
# cp /tsconfig.json /build
# cp /.prettierrc /build
# cp /.gitignore /build
# cp /.eslint.json /build
cp .env build
cp README.md build
cp setup.sh build
cp package.json build

echo 'Deploying files to server...'
scp -r build/* victor@192.168.0.144:/home/victor/movie-api/

echo 'Done!'