module.exports.up = cb => {
  console.log('Updgrading 1');
  cb();
}

module.exports.down= cb => {
  console.log('Downgrading 1');
  cb();
}