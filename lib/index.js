var fs = require('fs');
var natural = require('javascript-natural-sort');
var EventEmitter = require('events').EventEmitter;

var loader, saver, directory, state;
var migratus = new EventEmitter;

var getMigrations = (cb) => {
  var migrations;

  fs.readdir(directory, (err, files) => {
    migrations = files
      .filter( name => name.substr(-3) === '.js' ) // Only consider .js files
      .sort(natural);

    cb(null, migrations);
  })
}

var applyMigration = (direction, name, cb) => {
  var migration = require(directory+'/'+name);
  migratus.emit('migrate started', name, direction)

  migration[direction]( err => {
    if(err)
      migratus.emit('migrate failed', name, direction, err);
    else
      migratus.emit('migrate succeeded', name, direction);

    cb(err);
  });
}

var applySet = (direction) => {
  return (set, cb) => {
    var i = 0;

    var success = [];

    var finish = (err) => {
      cb(err, success);
    }

    var applyNext = () => {
      if(!set[i])
        return finish();

      var migration = set[i];
      applyMigration(direction, migration, (err) => {
        if(err)
          return finish(err);

        success.push(migration);
        i++;
        applyNext();
      });
    }

    applyNext();
  }
}

var up = (cb) => {
  getMigrations( (err, migrations) => {
    if(err)
      return cb(err);

    to(migrations.pop(), cb)
  });
}

var to = (migration, cb) => {
  var current, direction;

  getMigrations( (err, all) => {
    if(err)
      return cb(err);

    loader( (err, current) => {

      migratus.on('migrate succeeded', (name, direction) => {
        if(direction === 'up')
          current.push(name);
        else
          current.splice(all.indexOf(name), 1)

        saver(current, err => {
          if(err)
            return cb(err);
        });
      })

      if(err)
        return cb(err);

      migrateTo(all, current, migration, cb);
    });
  });
}

var migrateTo = (all, current, migration, cb) => {
  var position = all.indexOf(migration);
  if(position < 0)
    return cb('Migration '+migration+' not found');

  // [1,2,3,4,5,6] We are trying to go from 1 to 4.

  // Prepare [5,6] to bo reverted down.
  var down = all.slice(position+1, all.length)
              .filter( name => current.indexOf(name) > -1 )
              .reverse();

  //Find out whats missing in-between: [2,3,4])
  var up =  all
            .slice(0, position+1)
            .filter( name => current.indexOf(name) < 0 )


  if(down.length < 1 && up.length < 1)
    return cb(); //No change necessary. Already there.


  applySet('up')(up, (err) => {
    if(err)
      return cb(err);

    applySet('down')(down, cb)
  });
}

module.exports = (options) => {
  if(!options.loader)
    throw new Error('Please provide a loader function');

  if(!options.saver)
    throw new Error('Please provide a saver function');

  if(!options.saver)
    throw new Error('Please provide your migrations directory');

  loader = options.loader;
  saver  = options.saver;
  directory = options.directory;

  migratus.up = up;
  migratus.to = to;

  return migratus;
}