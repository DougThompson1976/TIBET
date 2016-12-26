//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview Common shared utility functions for TIBET-style 'make' operations.
 *     See the make.js command file for more information on 'tibet make'.
 */
//  ========================================================================

/* eslint indent:0 */

(function() {

'use strict';

var CLI,
    hb,
    fs,
    sh,
    path,
    Promise,
    zlib,
    helpers;


CLI = require('../../src/tibet/cli/_cli');
fs = require('fs');
hb = require('handlebars');
sh = require('shelljs');
path = require('path');
Promise = require('bluebird');
zlib = require('zlib');


/**
 * Canonical `helper` object for internal utility functions.
 */
helpers = {};


/**
 * Computes the common parameters needed by nano and/or other interfaces to
 * CouchDB. This includes the CouchDB URL, the target database name, and the
 * target design doc application name.
 * @return {Object} An object with db_url, db_name, and db_app values.
 */
helpers.getCouchParameters = function(make) {
    var db_url,
        db_name,
        db_app,
        result;

    if (!make) {
        throw new Error(
            'Invalid call to helper function. No task provided.');
    }

    db_url = helpers.getCouchURL(make);

    db_name = process.env.COUCH_DATABASE;
    if (!db_name) {
        db_name = make.CLI.getcfg('tds.couch.db_name') || make.getProjectName();
    }

    result = make.prompt.question('Database name [' + db_name + '] ? ');
    if (result && result.length > 0) {
        db_name = result;
    }

    db_app = process.env.COUCH_APPNAME;
    if (!db_app) {
        db_app = make.CLI.getcfg('tds.couch.app_name') || 'app';
    }

    return {
        db_url: db_url,
        db_name: db_name,
        db_app: db_app
    };
};


/**
 * Computes the proper CouchDB URL for use with nano and other CouchDB
 * interfaces. The computed URL will include user and password information as
 * needed based on COUCH_USER and COUCH_PASS environment settings. All other
 * data is pulled from tds configuration parameters.
 */
helpers.getCouchURL = function(make) {
    var db_scheme,
        db_host,
        db_port,
        db_url,
        db_user,
        db_pass,
        result;

    if (!make) {
        throw new Error(
            'Invalid call to helper function. No task provided.');
    }

    db_url = process.env.COUCH_URL;
    if (!db_url) {
        //  Build up from config or defaults as needed.
        db_scheme = make.CLI.getcfg('tds.couch.scheme') || 'http';
        db_host = make.CLI.getcfg('tds.couch.host') || '127.0.0.1';
        db_port = make.CLI.getcfg('tds.couch.port') === undefined ?
            '5984' : make.CLI.getcfg('tds.couch.port');

        db_user = process.env.COUCH_USER;
        db_pass = process.env.COUCH_PASS;

        db_url = db_scheme + '://';
        if (db_user && db_pass) {
            db_url += db_user + ':' + db_pass + '@' + db_host;
        } else {
            db_url += db_host;
        }

        if (db_port) {
            db_url += ':' + db_port;
        }
    }

    result = make.prompt.question('CouchDB base [' +
        helpers.maskCouchAuth(db_url) + '] ? ');
    if (result && result.length > 0) {
        db_url = result;
    }
    make.log('using base url \'' + helpers.maskCouchAuth(db_url) + '\'.');

    return db_url;
};


/**
 * Returns a version of the url provided with any user/pass information masked
 * out. This is used for prompts and logging.
 * @param {String} url The URL to mask.
 * @returns {String} The masked URL.
 */
helpers.maskCouchAuth = function(url) {
    var regex,
        match,
        newurl;

    //  scheme://(user):(pass)@hostetc...
    regex = /(.*)\/\/(.*):(.*)@(.*)/;

    if (!regex.test(url)) {
        return url;
    }

    match = regex.exec(url);
    newurl = match[1] + '//$COUCH_USER:$COUCH_PASS@' + match[4];

    return newurl;
};


/**
 *
 * @param {Cmd} make The make command handle which provides access to logging
 *     and other CLI functionality specific to make operation.
 * @param {Hash} options An object whose keys must include:
 *     pkg - the package file path
 *     config - the package config id to be rolled up
 */
helpers.package_check = function(make, options) {

    var result,
        cmd,
        pkg,
        config,
        phase,
        deferred;

    if (CLI.notValid(options)) {
        throw new Error('InvalidOptions');
    }

    if (CLI.notValid(options.pkg)) {
        throw new Error('InvalidPackage');
    }

    if (CLI.notValid(options.config)) {
        throw new Error('InvalidConfig');
    }

    pkg = options.pkg;
    config = options.config;
    phase = options.phase;

    deferred = Promise.pending();

    make.log('verifying package#config');

    // The big path construction here is to locate the tibet command relative to
    // the current module. This is necessary for the npm prepublish step (used
    // by TravisCI etc) so they can build tibet without having it installed yet.
    cmd = path.join(module.filename, '..', '..', '..', 'bin', 'tibet') +
        ' package --missing' +
        (pkg ? ' --package \'' + pkg : '') +
        (config ? '\' --config ' + config : '') +
        (phase ? ' --phase ' + phase : '') +
        (CLI.options.debug ? ' --debug' : '') +
        (CLI.options.verbose ? ' --verbose' : '') +
        (CLI.options.color ? '' : ' --no-color') +
        (CLI.options.silent ? '' : ' --no-silent');

    make.log('executing ' + cmd);
    result = sh.exec(cmd, {
        silent: CLI.options.silent !== false
    });

    if (result.code !== 0) {
        make.error('Error in package:');
        make.error('' + result.output);
        deferred.reject(result.output);
        return deferred.promise;
    } else {
        deferred.resolve(result.output);
        return deferred.promise;
    }
};


/**
 *
 * @param {Cmd} make The make command handle which provides access to logging
 *     and other CLI functionality specific to make operation.
 * @param {Hash} options An object whose keys must include:
 *     pkg - the package file path
 *     config - the package config id to be rolled up
 */
helpers.resource_build = function(make, options) {

    var result,
        cmd,
        pkg,
        config,
        phase,
        lines,
        msg,
        deferred;

    if (CLI.notValid(options)) {
        throw new Error('InvalidOptions');
    }

    if (CLI.notValid(options.pkg)) {
        throw new Error('InvalidPackage');
    }

    if (CLI.notValid(options.config)) {
        throw new Error('InvalidConfig');
    }

    pkg = options.pkg;
    config = options.config;
    phase = options.phase;

    deferred = Promise.pending();

    make.log('generating resources');

    // The big path construction here is to locate the tibet command relative to
    // the current module. This is necessary for the npm prepublish step (used
    // by TravisCI etc) so they can build tibet without having it installed yet.
    cmd = path.join(module.filename, '..', '..', '..', 'bin', 'tibet') +
        ' resource --build' +
        (pkg ? ' --package \'' + pkg : '') +
        (config ? '\' --config ' + config : '') +
        (phase ? ' --phase ' + phase : '') +
        (CLI.options.debug ? ' --debug' : '') +
        (CLI.options.verbose ? ' --verbose' : '') +
        (CLI.options.color ? '' : ' --no-color') +
        (CLI.options.silent ? '' : ' --no-silent');

    make.log('executing ' + cmd);
    result = sh.exec(cmd, {
        silent: CLI.options.silent !== false
    });

    if (result.code !== 0) {
        //  Output for rollup is potentially massive. The actual error will be
        //  the line(s) which start with 'Error processing rollup:'
        lines = result.output.split('\n');
        lines = lines.filter(function(line) {
            return line.trim().length !== 0;
        });
        msg = lines[lines.length - 1];
        make.error(msg);

        deferred.reject(msg);
        return deferred.promise;
    } else {
        deferred.resolve(result.output);
        return deferred.promise;
    }
};


/**
 * A common utility used by rollup operations to avoid duplication of the
 * logic behind building specific rollup products.
 * @param {Cmd} make The make command handle which provides access to logging
 *     and other CLI functionality specific to make operation.
 * @param {Hash} options An object whose keys must include:
 *     pkg - the package file path
 *     config - the package config id to be rolled up
 *
 *     Additional keys are:
 *     dir - the target directory for the rollup output [.]
 *     headers - true to add headers between files [false]
 *     minify - true to minify the content of files [false]
 *     root - name of output artifact file [config id]
 */
helpers.rollup = function(make, options) {

    var result,
        cmd,
        ext,
        file,
        pkg,
        config,
        phase,
        lines,
        msg,
        dir,
        prefix,
        root,
        headers,
        minify,
        deferred;

    if (CLI.notValid(options)) {
        throw new Error('InvalidOptions');
    }

    if (CLI.notValid(options.pkg)) {
        throw new Error('InvalidPackage');
    }

    if (CLI.notValid(options.config)) {
        throw new Error('InvalidConfig');
    }

    pkg = options.pkg;
    config = options.config;
    phase = options.phase || 'two';

    prefix = options.prefix || '';
    dir = options.dir || '.';

    if (CLI.isValid(options.headers)) {
        headers = options.headers;
    } else {
        headers = false;
    }

    if (CLI.isValid(options.minify)) {
        minify = options.minify;
    } else {
        minify = false;
    }

    deferred = Promise.pending();

    root = options.root || options.config;

    make.log('rolling up ' + prefix + root);

    // The big path construction here is to locate the tibet command relative to
    // the current module. This is necessary for the npm prepublish step (used
    // by TravisCI etc) so they can build tibet without having it installed yet.
    cmd = path.join(module.filename, '..', '..', '..', 'bin', 'tibet') +
        ' rollup --package \'' + pkg +
        '\' --config ' + config +
        ' --phase ' + phase +
        (CLI.options.debug ? ' --debug' : '') +
        (CLI.options.verbose ? ' --verbose' : '') +
        (CLI.options.color ? '' : ' --no-color') +
        (CLI.options.silent ? '' : ' --no-silent') +
        (headers ? '' : ' --no-headers') +
        (minify ? ' --minify' : '');

    make.log('executing ' + cmd);
    result = sh.exec(cmd, {
        silent: CLI.options.silent !== false
    });

    if (result.code !== 0) {
        //  Output for rollup is potentially massive. The actual error will be
        //  the line(s) which start with 'Error processing rollup:'
        lines = result.output.split('\n');
        lines = lines.filter(function(line) {
            return line.trim().length !== 0;
        });
        msg = lines[lines.length - 1];
        make.error(msg);

        deferred.reject(msg);
        return deferred.promise;
    }

    if (minify) {
        ext = '.min.js';
    } else {
        ext = '.js';
    }

    file = path.join(dir, prefix + root + ext);

    try {
        make.log('writing ' + result.output.length + ' chars to: ' + file);
        result.output.to(file);

        if (!options.zip) {
            deferred.resolve();
            return deferred.promise;
        }
    } catch (e) {
        make.error('Unable to write to: ' + file);
        make.error('' + e.message);
        deferred.reject(e);
        return deferred.promise;
    }

    // gzip as well...
    if (options.zip) {
        file = file + '.gz';
        make.log('creating zipped output in ' + file);
        return Promise.promisify(zlib.gzip)(result.output).then(
            function(zipresult) {
                try {
                    fs.writeFileSync(file, zipresult);
                    make.log('compressed to: ' + zipresult.length + ' bytes');
                    deferred.resolve();
                    return deferred.promise;
                } catch (e) {
                    make.error('Unable to write to: ' + file);
                    make.error('' + e.message);
                    deferred.reject(e);
                    return deferred.promise;
                }
            },
            function(error) {
                make.error('Unable to compress: ' + file.slice(0, -3));
                make.error('' + error);
                deferred.reject(error);
                return deferred.promise;
            });
    } else {
        deferred.resolve();
        return deferred.promise;
    }
};

/**
 * Performs a template interpolation on a source file, writing the output to a
 * target file. The underlying templating engine used is the handlebars engine.
 * @param {Cmd} make The make command handle which provides access to logging
 *     and other CLI functionality specific to make operation.
 * @param {Hash} options An object whose keys must include:
 *     source - the file path to the source template text.
 *     target - the file path to the target file.
 *     data - the object containing templating data.
 */
helpers.template = function(make, options) {

    var content,  // File content after template injection.
        source,   // The source file path.
        target,   // The target file path.
        text,     // File text.
        data,     // File injection data.
        template, // The compiled template content.
        deferred; // Promise support object for returns.

    if (CLI.notValid(options)) {
        throw new Error('InvalidOptions');
    }

    if (CLI.notValid(options.source)) {
        throw new Error('InvalidSourceFile');
    }

    if (CLI.notValid(options.target)) {
        throw new Error('InvalidTargetFile');
    }

    if (CLI.notValid(options.data)) {
        throw new Error('InvalidData');
    }

    source = CLI.expandPath(options.source);
    target = CLI.expandPath(options.target);
    data = options.data;

    deferred = Promise.pending();

    make.trace('Processing file: ' + source);
    try {
        text = fs.readFileSync(source, {encoding: 'utf8'});
        if (!text) {
            throw new Error('Empty');
        }
    } catch (e) {
        make.error('Error reading ' + source + ': ' + e.message);
        deferred.reject(e.message);
        return deferred.promise;
    }

    try {
        template = hb.compile(text);
        if (!template) {
            throw new Error('InvalidTemplate');
        }
    } catch (e) {
        make.error('Error compiling template ' + source + ': ' +
            e.message);
        deferred.reject(e.message);
        return deferred.promise;
    }

    try {
        content = template(data);
        if (!content) {
            throw new Error('InvalidContent');
        }
    } catch (e) {
        make.error('Error injecting template data in ' + source +
            ': ' + e.message);
        deferred.reject(e.message);
        return deferred.promise;
    }

    if (text === content) {
        make.trace('Ignoring static file: ' + source);
    } else {
        make.trace('Updating file: ' + target);
        try {
            fs.writeFileSync(target, content);
        } catch (e) {
            make.error('Error writing file ' + target + ': ' + e.message);
            deferred.reject(e.message);
            return deferred.promise;
        }
    }

    deferred.resolve();
    return deferred.promise;
};

module.exports = helpers;

}());
