import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import commonJS from 'rollup-plugin-commonjs';

export default {
    entry: 'src/index.js',
    dest: 'dist/iaxios.js',
    format: 'umd',
    moduleName: 'iaxios',
    sourceMap: true,
    external: ['axios', 'qs'],
    plugins: [
        json(),
        resolve(),
        babel(),
        commonJS({
            namedExports: {
                'node_modules/axios/index.js': ['axios']
            }
        })
    ]
};