(function() {
    'use strict';

    module.exports = function(make, resolve, reject) {
        var options;

        //  Reparse to capture any zip/brotli configuration flags.
        options = make.reparse(make.cfg('make.compression.parse_options'));

        make.helpers.rollup_lib(make, {
            config: 'login'
        }).then(function() {
            return make.helpers.rollup_lib(make, {
                config: 'login',
                minify: true,
                zip: options.zip,
                brotli: options.brotli
            });
        }).then(resolve, reject);
    };

}());
