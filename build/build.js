var path = require('path');
var rollup = require('rollup');

rollup.rollup(require(path.resolve(__dirname, '../rollup.config'))).then(result => {
    console.log('build success.')
}).catch(error => {
    console.error('build error.', error)
});