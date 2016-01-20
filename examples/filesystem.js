#!/usr/bin/env node

var fs = require('fs');
var Migrate = require('../lib/index.js');

var stateFile = './state.json';

var loader = (cb) => {
  var state;

  try {
    state = JSON.parse(fs.readFileSync(stateFile).toString());
  } catch(e) {
    return cb(e);
  }

  cb(null, state);
}

var saver = (state, cb) => {
  try {
    fs.writeFileSync(stateFile, JSON.stringify(state));
  } catch(e) {
    return cb(e);
  }

  cb();
}

var migrate = Migrate({
  loader:loader,
  saver:saver,
  directory:__dirname+'/migrations'
})

migrate.on('migrate failed', name => console.log('Migration failed:', name));
migrate.on('migrate succeeded', name => console.log('Migration succeeded:', name));

var to = process.argv[2];

if(to === 'up')
  return migrate.up( (err) => {
    if(err)
      console.log(err);
  });

if(to)
  return migrate.to(to, (err) => {
    if(err)
      console.log(err);
  });

console.log('This is an example migrator using filesystem as state storage.');
console.log('It stores current state of the database in `state.json` file.');
console.log('Usage: ./filesystem.js [up] [migration_name]');
console.log('Example: `./filesystem.js up` Migrates up to the last migration.');
console.log('Example: `./filesystem.js 3.js` Migrates to the 3.js.');