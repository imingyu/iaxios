var watch = require('watch');
var path = require('path');
var rollup = require('rollup');

var config = require(path.resolve(__dirname, '../rollup.config'))

console.log(`waiting...`);
watch.watchTree(path.resolve(__dirname, '../src'), function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
    } else {
        console.log(`building...`);
        rollup.rollup(config).then(result => {
            result.write(config);
            console.log('build success.')
        }).catch(error => {
            console.error('build error.', error);
        });
    }
})