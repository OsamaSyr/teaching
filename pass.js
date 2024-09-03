const bcrypt = require('bcryptjs');
const password = 'admin';
const salt = bcrypt.genSaltSync(10);
const hashedPassword = bcrypt.hashSync(password, salt);
console.log(hashedPassword);