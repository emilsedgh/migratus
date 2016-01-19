# Why Another migration tool?

There are some flaws in the existing migration libraries:
- Some of them depend on specific ORM's.
- Some of them store the state on the filesystem
- Some of them clash in specific scenarios

# What are migratus features?

- It's Very small
- It's abstract. Does not make assumptions about your enviroment and database. (And therefore allows you to store your state in your database)
- It has a very simple programatic API (only a couple of methods)

# How does it work?

You can take a look at the example file provided. But basically:

## Installation
`npm install migratus`

## Setting up

``` javascript
var migratus = require('migratus')(options);
```

Where `options` is:
```javascript
{
  loader:loaderFunction,
  saver:saverFunction,
  directory:'/path/to/directory'
}
```
`saver` `(function)` will be called in form of `(state, callback)`. It will store the `state` object and call the `callback` in form of `(err)` when saving is done.

`loader` `(function)` gets a callback and calls the callback in form of `(err, state)`. `state` being the latest state of the database, previously saved by a `saver` function.

`directory` `(string)` is the directory that migrations are stored in

## Migrate to the latest migration

```javascript
migratus.up(callback)
```

`callback` is a callback function which will be called when migration is done in form of `(err)`

## Migrate to a specific migration
```javascript
migratus.to(name, callback)
```

`name` is the name of the specific migration
`callback` will be called when migration is done in form of `(err)`

# Migrations
Each migration is a simple node module with two exported functions, `up` and `down`.

## Example

```javascript
var pg = require('pg');
var con = 'postgres://username:password@localhost/database';

module.exports.up = function(cb) {
  pg.connect(con, function(err, client, done) {
    client.query('ALTER TABLE foo ADD COLUMN bar', function(err) {
      done();
      cb(err);
    });
  });
}

module.exports.down = function(cb) {
  pg.connect(con, function(err, client, done) {
    client.query('ALTER TABLE foo DROP COLUMN bar', function(err) {
      done();
      cb(err);
    });
  });
}
```

# Creating migrations

A very small cli tool is provided to help you create new migration files

```bash
node_modules/migratus/bin/create [--template /path/to/template] migration name
```

It will create a new migration file using provided template (optional) with migration name.

If you have defined $EDITOR, it will be opened automatically to the created migration file