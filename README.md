# notes-app
Node.js application for managing notes using different data stores (in memory, filesystem, Leveldb, MYSQL, SQLite3, PostgreSQL, MongoDB)

Before installing make sure you have Node version >= 5.0 and NPM >= 3

You can easily switch between different data stores by changing .env variables.

```bash
# clone our repo
# --depth 1 removes all but one .git commit history
git clone --depth 1 https://github.com/sasha7/notes-app.git

# change directory to our repo
cd notes-app

# install the repo with npm
npm install

# run setup.js to setup initial environment in .env file
npm run setup

# start the server

npm start

# or start the server in watch mode using nodemon

npm run watch

```
go to [http://0.0.0.0:3000](http://0.0.0.0:3000) or [http://localhost:3000](http://localhost:3000) in your browser
