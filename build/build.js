var path = require('path');
var rollup = require('rollup');
var config = require(path.resolve(__dirname, '../rollup.config'))

rollup.rollup(config).then(result => {
    result.write(config);
    console.log('build success.')
}).catch(error => {
    console.error('build error.', error);
});