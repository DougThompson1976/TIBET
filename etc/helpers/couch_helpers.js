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

/* eslint indent:0, object-curly-newline:0 */

(function() {

'use strict';

var helpers;


/**
 * Canonical `helper` object for internal utility functions.
 */
helpers = {};


/**
 * Computes the common parameters needed by nano and/or other interfaces to
 * CouchDB. This includes the CouchDB URL, the target database name, and the
 * target design doc application name.
 * @param {Object} options A parameter block with at least a 'requestor'.
 * @return {Object} An object with db_url, db_name, and db_app values.
 */
helpers.getCouchParameters = function(options) {
    var opts,
        requestor,
        cfg_root,
        result,
        db_url,
        db_scheme,
        db_host,
        db_port,
        db_user,
        db_pass,
        db_name,
        db_app;

    opts = options || {};

    requestor = opts.requestor;
    if (!requestor) {
        throw new Error(
            'Invalid call to helper function. No requestor provided.');
    }

    cfg_root = opts.cfg_root || 'tds.couch.';

    db_url = opts.db_url || helpers.getCouchURL(opts);

    db_scheme = opts.db_scheme ||
        requestor.getcfg(cfg_root + '.scheme') || 'http';
    db_host = opts.db_host ||
        requestor.getcfg(cfg_root + '.host') || '127.0.0.1';
    db_port = opts.db_port ||
        requestor.getcfg(cfg_root + '.port') === undefined ? '5984' :
            requestor.getcfg(cfg_root + '.port');

    db_user = opts.db_user || process.env.COUCH_USER;
    db_pass = opts.db_pass || process.env.COUCH_PASS;

    db_name = opts.db_name || process.env.COUCH_DATABASE;
    if (!db_name) {
        db_name = requestor.getcfg(cfg_root + '.db_name') ||
            requestor.getcfg('npm.name');
    }

    if (requestor.prompt && opts.confirm !== false) {
        result = requestor.prompt.question('Database name [' + db_name + '] ? ');
        if (result && result.length > 0) {
            db_name = result;
        }
    }

    db_app = opts.db_app || process.env.COUCH_APPNAME;
    if (!db_app) {
        db_app = requestor.getcfg(cfg_root + '.db_app') || 'app';
    }

    return {
        db_url: db_url,
        db_scheme: db_scheme,
        db_host: db_host,
        db_port: db_port,
        db_user: db_user,
        db_pass: db_pass,
        db_name: db_name,
        db_app: db_app
    };
};


/**
 * Computes the proper CouchDB URL for use with nano and other CouchDB
 * interfaces. The computed URL will include user and password information as
 * needed based on COUCH_USER and COUCH_PASS environment settings. All other
 * data is pulled from tds configuration parameters.
 * @param {Object} options A parameter block with at least a 'requestor'.
 * @return {String} The database url.
 */
helpers.getCouchURL = function(options) {
    var opts,
        requestor,
        cfg_root,
        result,
        db_scheme,
        db_host,
        db_port,
        db_user,
        db_pass,
        db_url;

    opts = options || {};

    requestor = opts.requestor;
    if (!requestor) {
        throw new Error(
            'Invalid call to helper function. No requestor provided.');
    }

    cfg_root = opts.cfg_root || 'tds.couch';

    db_url = opts.db_url || process.env.COUCH_URL;
    if (!db_url) {
        //  Build up from config or defaults as needed.
        db_scheme = opts.db_scheme ||
            requestor.getcfg(cfg_root + '.scheme') || 'http';
        db_host = opts.db_host ||
            requestor.getcfg(cfg_root + '.host') || '127.0.0.1';
        db_port = opts.db_port ||
            requestor.getcfg(cfg_root + '.port') === undefined ? '5984' :
                requestor.getcfg(cfg_root + '.port');

        db_user = opts.db_user || process.env.COUCH_USER;
        db_pass = opts.db_pass || process.env.COUCH_PASS;

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

    if (requestor.prompt && opts.confirm !== false) {
        result = requestor.prompt.question('CouchDB base [' +
            helpers.maskCouchAuth(db_url) + '] ? ');
        if (result && result.length > 0) {
            db_url = result;
        }

        requestor.log('using base url \'' +
            helpers.maskCouchAuth(db_url) + '\'.');
    }

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
    newurl = match[1] + '//' + match[4];

    return newurl;
};


module.exports = helpers;

}());