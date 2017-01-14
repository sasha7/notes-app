const fs = require('fs');

// Simply copies the contents from the .env-example and
// creates with them a new file called .env
fs.createReadStream('.env.example')
  .pipe(fs.createWriteStream('.env'));
