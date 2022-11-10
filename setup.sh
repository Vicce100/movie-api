echo 'Installing npm dependencies...'

rm -r node_modules
rm package-lock.json
rm .env

npm i

# only necessary if running linux
npm un bcrypt
npm i bcrypt --unsafe-perm=true --allow-root --save

echo '.env
node_modules

# production | develop
NODE_ENV=production

# change to server ip
IP_LOCAL=localhost
IP_ADDR=192.168.0.3

PORT=17053

DB_PRODUCTION=mongodb://192.168.0.143:27017/MovieDB
DB_LOCAL=mongodb://localhost/MovieDB

SECRET_ACCESS_TOKEN=8bb940e68dd51bd89ed047d636d120422e7e24d42988f69b9ec87363a399c53f260371415a77ce8d68e90666839dabf7d43d2c9273f0a49e158f80b716b880e1
SECRET_REFRESH_TOKEN=6f6aedb0c03f65d5d12662544bde01bbbf90d1164643ccd71b8746d0a2a36fc2b0a06d4df26be170cfc9926742f1fa0bfc2ede52ef4078d0c61d370b72b2787f
' > .env

echo 'Done!'