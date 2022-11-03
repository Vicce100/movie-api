echo 'Installing npm dependencies...'

npm i

# only necessary if running linux
npm un bcrypt
npm i bcrypt --unsafe-perm=true --allow-root --save