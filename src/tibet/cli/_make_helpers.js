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

(function() {

'use strict';

var CLI = require('./_cli');
var sh = require('shelljs');
var path = require('path');
var Q = require('q');

/**
 * Canonical `helper` object for internal utility functions.
 */
var helpers = {};


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

    var result;
    var cmd;
    var ext;
    var file;
    var pkg;
    var config;
    var dir;
    var prefix;
    var root;
    var headers;
    var minify;
    var deferred;

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

    deferred = Q.defer();

    root = options.root || options.config;

    make.log('rolling up ' + prefix + root);

    cmd = 'tibet rollup --package \'' + pkg +
        '\' --config ' + config +
        (headers ? '' : ' --no-headers') +
        (minify ? ' --minify' : '');

    make.log('executing ' + cmd);
    result = sh.exec(cmd, {
        silent: (CLI.options.silent !== false)
    });

    if (result.code !== 0) {
        make.error('Error processing rollup.');
        deferred.reject(result.output);
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
        deferred.resolve();
        return deferred.promise;
    } catch (e) {
        make.error('Unable to write to: ' + file);
        deferred.reject(e);
        return deferred.promise;
    }
};

module.exports = helpers;

}());
