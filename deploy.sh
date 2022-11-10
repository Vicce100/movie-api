echo 'Switching to branch production'
git checkout production

echo 'Buildning app...'
npm run buildToDir
# cp .env build -- .env files dose not get sent with scp
cp README.md build
cp setup.sh build
cp package.json build

echo 'Deploying files to server...'
scp -i ~/.ssh/movie_rsa -r build/* victor@192.168.0.3:/home/victor/movie-api/

echo 'Done!'