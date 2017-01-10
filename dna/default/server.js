/**
 * @overview An optional server for TIBET development and deployment. The TIBET
 *     Data Server (TDS) provides a number of features to make development
 *     faster and more fluid including support for live sourcing and storing
 *     client-side changes back to the server. Additional middleware specific to
 *     working with CouchDB, including support for the CouchDB changes feed,
 *     lets you create powerful CouchDB-backed applications with minimal effort.
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     open source waivers to keep your derivative work source code private.
 */

/* eslint-disable no-console */

(function() {

    'use strict';

    var app,                // Express application instance.
        argv,               // The argument list.
        certFile,           // Name of the certificate file.
        certKey,            // Name of the key file for certs.
        certPath,           // Directory containing cert data.
        env,                // Current execution environment.
        express,            // Express web framework.
        fs,                 // File system module.
        http,               // Web server baseline.
        https,              // Secure server baseline.
        httpsOpts,          // Options for HTTPS server.
        logger,             // Configured logger instance.
        meta,               // Logger metadata.
        minimist,           // Argument processing.
        options,            // Common options block.
        path,               // Path utility module.
        plugins,            // TDS server plugin list to load.
        port,               // Port to listen on.
        protocol,           // HTTP or HTTPS.
        TDS,                // TIBET Data Server baseline.
        useHttps;           // Should this be an HTTPS server.

    //  ---
    //  Baseline require()'s
    //  ---

    express = require('express');
    http = require('http');
    https = require('https');
    minimist = require('minimist');
    fs = require('fs');
    path = require('path');

    //  Always bring in the baseline TDS, even if we don't load the 'tds' plugin
    //  (which loads any tds.plugins.tds list which might be defined). This
    //  gives access to utilities like getcfg etc.
    TDS = require('tibet/etc/tds/tds_base');

    //  ---
    //  APP/TDS Config
    //  ---

    //  Create app instance and capture the environment data from it.
    app = express();
    env = app.get('env');

    //  Parse command line arguments, leveraging TDS default parse options.
    /* eslint-disable object-curly-newline */
    argv = minimist(process.argv.slice(2), TDS.PARSE_OPTIONS) || {_: []};
    /* eslint-enable object-curly-newline */

    //  Map the defaulted environment from Express into our argument list. This
    //  will be used by the TDS initialization which may access both.
    argv.env = argv.env || env;

    //  Configure the TDS's underlying TIBET Package instance. This instance is
    //  how we access all of TIBET's configuration data and functionality.
    TDS.initPackage(argv);

    //  Write the server announcement string.
    TDS.announceTIBET(argv.env);

    //  Map TDS and app to each other so they have easy access to configuration
    //  data or other functionality.
    app.TDS = TDS;
    TDS.app = app;

    //  Ensure we update the HTTPS settings before we load any plugins.
    useHttps = TDS.isValid(argv.https) ? argv.https : TDS.getcfg('tds.https');
    TDS.setcfg('tds.https', useHttps);

    //  ---
    //  Middleware
    //  ---

    //  Note that TDS properties are adjusted by environment so this can cause a
    //  different configuration between development and prod (no mocks etc).
    plugins = TDS.getcfg('tds.plugins.core');
    if (!plugins) {
        plugins = [
            'body-parser',
            'logger',
            'compression',
            'reconfig',
            'public-static',
            'session',
            'security',
            'view-engine',
            'authenticate',
            'private-static',
            'user',
            'routes',
            'tds',
            'proxy',
            'fallback',
            'errors'];
    }

    //  Shared options which allow modules to essentially share values like the
    //  logger, authentication handler, etc.
    options = {
        app: app,
        argv: argv,
        env: env
    };

    require('./plugins/preload')(options);

    plugins.forEach(function(plugin) {
        var fullpath;

        fullpath = path.join(__dirname, 'plugins', plugin);

        require(fullpath)(options);
    });

    //  Capture logger reference now that plugins have loaded.
    logger = options.logger;
    if (!logger) {
        console.error('Missing logger middleware or export.');
        /* eslint-disable no-process-exit */
        process.exit(1);
        /* eslint-enable no-process-exit */
    }

    //  ---
    //  Backstop
    //  ---

    //  Always maintain at least the uncaught exception handler. If the consumer
    //  puts one onto the shared options object use that, otherwise use default.
    process.on('uncaughtException', options.uncaughtException || function(err) {
        var stack;

        //  These happen due to mal-ordered middleware but they log and we
        //  shouldn't be killing the server over it.
        if (err.message && err.message.indexOf(
            'headers after they are sent') !== -1) {
            return;
        }

        //  Configure common error reporting metadata so we style properly.
        meta = {
            comp: 'TDS',
            type: 'tds',
            name: 'server',
            style: 'error'
        };

        if (err.message && err.message.indexOf('EACCES') !== -1 && port <= 1024) {
            //  These happen due to port defaults below 1024 (which require perms)
            logger.error('Possible permission error for server port: ' + port, meta);
        } else if (err.message && err.message.indexOf('EADDRINUSE') !== -1) {
            //  These happen because you forget you're already running one.
            logger.error('Server start failed. Port is busy.', meta);
        } else if (app.get('env') === 'development') {
            stack = err.stack || '';
            logger.error('Uncaught: \n' + stack.replace(/\\n/g, '\n'), meta);
        } else {
            logger.error('Uncaught: \n' + err.message, meta);
        }

        logger.flush(true);

        if (TDS.cfg('tds.stop_onerror')) {
            /* eslint-disable no-process-exit */
            process.exit(1);
            /* eslint-enable no-process-exit */
        }
    });

    //  ---
    //  Run That Baby!
    //  ---

    require('./plugins/prestart')(options);

    //  Lots of options for where to get a port number but try to leverage TDS
    //  first. Our registered IANA port is the last option and is hard-coded.
    port = argv.port || TDS.cfg('tds.port') || TDS.cfg('port') ||
        process.env.npm_package_config_port ||
        process.env.PORT ||
        1407;   //  registered TIBET Data Server port.

    //  Update to set the current runtime value to reflect actual port.
    TDS.setcfg('tds.port', port);

    //  Default to https for the site and require it to be forced off via flag.

    if (useHttps) {
        protocol = 'https';

        certPath = TDS.getcfg('tds.cert.path') || 'etc';
        certKey = TDS.getcfg('tds.cert.key') || 'ssl.key';
        certFile = TDS.getcfg('tds.cert.file') || 'ssl.crt';

        httpsOpts = {
            key: fs.readFileSync(path.join(certPath, certKey)),
            cert: fs.readFileSync(path.join(certPath, certFile))
        };

        http.createServer(app).listen(port);

        port = argv.https_port ||
            TDS.cfg('tds.https_port') || TDS.cfg('https_port') ||
            process.env.HTTPS_PORT ||
            443;   //  default https port
        https.createServer(httpsOpts, app).listen(port);

    } else {
        protocol = 'http';
        http.createServer(app).listen(port);
    }

    require('./plugins/poststart')(options);

    TDS.announceStart(logger, protocol, port);
}());
