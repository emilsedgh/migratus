var fs = require('fs');
var natural = require('javascript-natural-sort');


var loader, saver, directory, state;

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
  migration[direction](cb);
}

var applySet = (direction) => {
  return (set, cb) => {
    var i = 0;

    var success = [];

    var finish = () => {
      cb(null, success);
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

  var migrations = JSON.parse(JSON.stringify(all));

  if(current.indexOf(migration) > -1) {
    // We already have this migration and we should revert back.
    var direction = 'down';
    migrations = migrations.slice(0, current.length);
    migrations = migrations.slice(position+1, migrations.length);
    migrations = migrations.reverse();

  } else {
    migrations = migrations.slice(0, position+1);
    migrations = migrations.slice(current.length, migrations.length);
    direction = 'up';
  }

  applySet(direction)(migrations, (err) => {
    if(err)
      return cb(err);

    saver(all.slice(0, position+1), cb);
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

  return {
    up,
    to
  }
}