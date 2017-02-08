# notes-app
Node.js application for managing notes.

This repo serves as a playground for the following technologies:
* Node.js
* Express framework
* Objection.js ORM
* PostgresSQL
* Socket.io
* EventEmitter
* Unit and Functional Testing

Before installing make sure you have Node version >= 5.0 and NPM >= 3
and that PostgreSQL has "uuid-ossp" module installed as an extension:
* `SELECT * FROM pg_available_extensions;`
* `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`


# Features
* Account login and signup with:
** local credentials (email and password)
** OAuth provider (Facebook)
* Reset password feature
* Notes CRUD pages
* My profile page with extra option to link/unlink OAuth provider
* Automatic updating of notes list on `/notes` page when anyone updates, deletes or creates new note
* Contact form
* Simple API examples `/api/v1/users`, `/api/v1/notes`


# Quick start
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

# create postgres db
createdb --encoding utf8 notes-development

# start the server

npm start

# or start the server in watch mode using nodemon

npm run watch

```
go to [http://0.0.0.0:3000](http://0.0.0.0:3000) or [http://localhost:3000](http://localhost:3000) in your browser
