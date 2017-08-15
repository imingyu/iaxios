var watch = require('watch');
var path = require('path');
var rollup = require('rollup');

console.log(`waiting...`);
watch.watchTree(path.resolve(__dirname, '../src'), function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
    } else {
        console.log(`start build`);
        rollup.rollup(require(path.resolve(__dirname, '../rollup.config'))).then(result => {
            console.log('build success.')
        }).catch(error => {
            console.error('build error.', error)
        })
    }
})