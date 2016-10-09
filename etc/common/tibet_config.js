//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview A PhantomJS-friendly configuration loader used by tibet_color (and
 *     perhaps eventually tibet_package) to load TIBET configuration data.
 */
//  ========================================================================

/* global TP:true */
/* eslint no-console:0, indent:0 */

(function() {

    var path,
        sh,
        Config;

    /**
     * A configuration loader capable of loading information even within the
     * somewhat limited environment provided by PhantomJS (which uses its own
     * require() call etc).
     * @param {Object} options Configuration options which assist the receiver
     *     in computing paths and locating configuration resources.
     * @return {Config} A newly constructed config instance.
     */
    Config = function(options) {
        var origTP,
            my,
            env,
            head,
            app;

        this.options = options || {};

        this.cfg = {};
        this.npm = {};
        this.tibet = {};
        this.tds = {};

        my = this;

        origTP = global.TP;

        TP = {};
        TP.sys = {};
        TP.sys.setcfg = function(property, value) {
            var name;

            name = property; // property.replace(/\./g, '_');
            my.cfg[name] = value;
        };
        this.setcfg = TP.sys.setcfg;

        // For get requests we rely on the instance copy.
        TP.sys.getcfg = function(property) {
            return my.getcfg(property);
        };
        TP.sys.cfg = TP.sys.getcfg;

        //  File loading varies by whether we're invoked from the phantom side
        //  or from within Node.
        if (typeof phantom !== 'undefined') {

            //  NOTE param values from phantom are quoted string so we slice off
            require(this.options['lib-root'].slice(1, -1) + '/src/tibet/boot/tibet_cfg');
            require(this.options['lib-root'].slice(1, -1) + '/etc/tds/tds_cfg')(TP.sys.setcfg);

            try {
                this.npm = require(this.options['app-head'].slice(1, -1) +
                    '/' + Config.NPM_FILE);
            } catch (e) {
                // Make sure we default to some value.
                this.npm = this.npm || {};
            }
            try {
                this.tibet = require(this.options['app-root'].slice(1, -1) +
                    '/' + Config.PROJECT_FILE);
            } catch (e) {
                // Make sure we default to some value.
                this.tibet = this.tibet || {};
            }
            try {
                this.tds = require(this.options['app-head'].slice(1, -1) +
                    '/' + Config.SERVER_FILE);
            } catch (e) {
                // Make sure we default to some value.
                this.tds = this.tds || {};
            }

            TP = origTP;

        } else {

            path = require('path');
            sh = require('shelljs');

            /**
             * Removes a module from the npm require cache.
             */
            require.uncache = function(moduleName) {
                // Run over the cache looking for the files
                // loaded by the specified module name
                require.searchCache(moduleName, function(mod) {
                    delete require.cache[mod.id];
                });
            };

            /**
             * Runs over the npm cache to search for a cached module.
             */
            require.searchCache = function(moduleName, callback) {
                // Resolve the module identified by the specified name
                var module;

                module = require.resolve(moduleName);

                // Check if the module has been resolved and found within
                // the cache
                if (module && (module = require.cache[module]) !== undefined) {
                    // Recursively go over the results
                    (function run(mod) {
                        // Go over each of the module's children and
                        // run over it
                        mod.children.forEach(function(child) {
                            run(child);
                        });

                        // Call the specified callback providing the
                        // found module
                        callback(mod);
                    }(module));
                }
            };

            //  NOTE below we uncache to be sure we get a clean/refreshed load
            //  for each Config instance created.

            require.uncache('../../src/tibet/boot/tibet_cfg');
            require('../../src/tibet/boot/tibet_cfg');

            require.uncache('../../etc/tds/tds_cfg');
            require('../../etc/tds/tds_cfg')(TP.sys.setcfg);

            head = this.getAppHead();
            app = this.getAppRoot();

            try {
                this.npm = require(path.join(head, Config.NPM_FILE));
            } catch (e) {
                // Make sure we default to some value.
                this.npm = this.npm || {};
            }
            try {
                this.tibet = require(path.join(app, Config.PROJECT_FILE));
            } catch (e) {
                // Make sure we default to some value.
                this.tibet = this.tibet || {};
            }
            try {
                this.tds = require(path.join(head, Config.SERVER_FILE));
            } catch (e) {
                // Make sure we default to some value.
                this.tds = this.tds || {};
            }
        }

        //  Blend in the values from npm and TIBET configuration files.
        this.overlayProperties(this.npm, 'npm');

        //  TIBET project file (mostly client but some shared values).
        this.overlayProperties(this.tibet);

        //  Process the TDS configuration data last. We do this in two steps to load
        //  any default section followed by any data that's environment-specific.
        if (this.tds) {
            if (this.tds.default) {
                this.overlayProperties(this.tds.default, 'tds');
            }

            env = this.getcfg('env') || this.options.env || 'development';
            if (this.tds[env]) {
                this.overlayProperties(this.tds[env], 'tds');
            }
        }

        return this;
    };

    /**
     * The name of the npm package file.
     * @type {string}
     */
    Config.NPM_FILE = 'package.json';


    /**
     * The filename used to assist in locating a project root directory.
     * @type {string}
     */
    Config.PROJECT_FILE = 'tibet.json';


    /**
     * The configuration file used for the TIBET server, which keeps settings
     * for the server separate from those used for the client.
     * @type {string}
     */
    Config.SERVER_FILE = 'tds.json';


    /**
     * A simple alternative to TP.sys.getcfg() used in the boot system and elsewhere
     * in TIBET. This version will look in command line options followed by any
     * loaded TIBET configuration data for the property in question.
     * @param {string} property The name of the property to look up.
     * @returns {Object} The property value.
     */
    Config.prototype.getcfg = function(property) {
        var name,
            keys,
            key,
            cfg,
            my;

        if (!property) {
            return this.cfg;
        }

        // Make simple access as fast as possible.
        if (this.cfg.hasOwnProperty(property)) {
            return this.cfg[property];
        }

        // Secondary check is for prefixed lookups.
        if (/\./.test(property)) {
            // Simple conversions from dotted to underscore should be checked first.
            name = property.replace(/\./g, '_');
            if (this.cfg.hasOwnProperty(name)) {
                return this.cfg[name];
            }
        } else {
            name = property;
        }

        //  Didn't find it yet. Try it as a prefix of some length.
        cfg = {};
        my = this;

        keys = Object.keys(this.cfg);
        keys.forEach(function(aKey) {
            //  Test both underscore and dotted formats (just in case)
            if (aKey.indexOf(property) === 0 || aKey.indexOf(name) === 0) {
                cfg[aKey] = my.cfg[aKey];
            }
        });

        //  What we return now depends on how many keys we ran across.
        keys = Object.keys(cfg);
        switch (keys.length) {
            case 0:
                //  No matches.
                return;
            case 1:
                //  Exact match or a solo prefix match.
                key = keys[0];
                if (key === name) {
                    return my.cfg[key];
                } else {
                    return cfg;
                }
            default:
                //  Multiple matches. Must have been a prefix.
                return cfg;
        }
    };


    /**
     * Returns the initial application root also referred to as the 'app head'.
     * This is the location where the package.json file is found for the current
     * context. This value is always computed and never set via property values.
     * The virtual path for this root is '~' or '~/'.
     * @returns {String} The application's 'head' location.
     */
    Config.prototype.getAppHead = function() {
        var cwd,
            checks,
            len,
            i,
            check,
            dir,
            file;

        if (this.app_head) {
            return this.app_head;
        }

        // One tricky aspect is that we don't want to confuse lib root and app
        // head. That means for the app head computation we don't work from the
        // module filename, but only from the current working directory.

        cwd = process.cwd();

        // Don't allow this value to be computed for a nested node_modules dir.
        if (/node_modules/.test(cwd)) {
            cwd = cwd.slice(0, cwd.indexOf('node_modules'));
        }

        checks = [
            [cwd, Config.NPM_FILE]
        ];

        len = checks.length;
        for (i = 0; i < len; i++) {
            check = checks[i];
            dir = check[0];
            file = check[1];

            while (dir.length > 0) {
                if (sh.test('-f', path.join(dir, file))) {
                    this.app_head = dir;
                    break;
                }
                dir = dir.slice(0, dir.lastIndexOf(path.sep));
            }

            if (this.app_head) {
                break;
            }
        }

        return this.app_head;
    };


    /**
     * Returns the application root directory. If path.app_root is set via command
     * line options that value is used. When not provided app_root typically
     * defaults to app_head since the majority of application structures don't
     * separate the two (TIBET's couchapp dna is an exception).
     * @returns {String} The application root.
     */
    Config.prototype.getAppRoot = function() {
        var head,
            tibet,
            approot,
            fullpath,
            list;

        // Return cached value if available.
        if (this.app_root) {
            return this.app_root;
        }

        // Check command line options and tibet.json configuration data. NOTE that
        // we can't use getcfg() here due to ordering/bootstrapping considerations.
        if (this.options && this.options.app_root) {
            this.app_root = this.options.app_root;
            return this.app_root;
        } else if (this.tibet.path && this.tibet.path.app_root) {
            this.app_root = this.tibet.path.app_root;
            return this.app_root;
        }

        head = this.getAppHead();
        if (!head) {
            return;
        }

        //  Found the project file for NPM, now to find the TIBET
        //  project file, which is allowed to be in either the same
        //  location or in an immediate subdirectory.
        tibet = Config.PROJECT_FILE;
        approot = head;
        fullpath = path.join(head, tibet);
        if (!sh.test('-f', fullpath)) {
            //  Not found in the immediate location of package file
            //  so try to locate it in a direct subdirectory.
            list = sh.ls(head);
            list.some(function(file) {
                var full;

                full = path.join(head, file);
                if (!sh.test('-d', full)) {
                    fullpath = null;
                    return false;
                }

                approot = file;
                fullpath = path.join(full, tibet);
                return sh.test('-f', fullpath);
            });
        }

        if (!fullpath) {
            this.error('getAppRoot failed to find app root relative to:' + head, true);
            return;
        }

        if (!this.isAbsolutePath(approot)) {
            approot = path.join('~/', approot);
        }
        this.app_root = approot;

        return this.app_root;
    };


    /**
     * Returns the library root directory, the path where the tibet library is
     * found. The search is a bit complex because we want to give precedence to
     * option settings and application-specific settings rather than simply working
     * from the assumption that we're using the library containing the current CLI.
     * @returns {String} The library root.
     */
    Config.prototype.getLibRoot = function() {
        var app_root,
            moduleDir,
            tibet_dir,
            tibet_inf,
            tibet_lib,
            offset,
            checks,
            check,
            i,
            len,
            dir,
            file;

        // Return cached value if available.
        if (this.lib_root) {
            return this.lib_root;
        }

        // Check command line options and tibet.json configuration data. NOTE that
        // we can't use getcfg() here due to ordering/bootstrapping considerations.
        if (this.options && this.options.lib_root) {
            this.lib_root = this.options.lib_root;
            return this.lib_root;
        } else if (this.tibet.path && this.tibet.path.lib_root) {
            this.lib_root = this.tibet.path.lib_root;
            return this.lib_root;
        }

        // Our base options here are a little different. We want to use app root as
        // our first choice followed by the module directory where the CLI is
        // running. This latter path gives us a fallback when we're being run
        // outside a project, or in a non-node project.
        app_root = this.getAppRoot();
        moduleDir = module.filename.slice(0, module.filename.lastIndexOf('/'));

        // Our file checks are looking for the library so we need to leverage the
        // standard boot settings for tibet_dir, tibet_inf, and tibet_lib just as
        // the boot system would.

        if (this.options && this.options.tibet_dir) {
            tibet_dir = this.options.tibet_dir;
        } else if (this.tibet.boot && this.tibet.boot.tibet_dir) {
            tibet_dir = this.tibet.boot.tibet_dir;
        } else if (this.tibet.path && this.tibet.path.npm_dir) {
            tibet_dir = this.tibet.path.npm_dir;
        } else {
            // Hard-coded fallback, but we don't have a choice if no other setting
            // is provided.
            tibet_dir = 'node_modules';
        }

        if (this.options && this.options.tibet_inf) {
            tibet_inf = this.options.tibet_inf;
        } else if (this.tibet.boot && this.tibet.boot.tibet_inf) {
            tibet_inf = this.tibet.boot.tibet_inf;
        } else if (this.tibet.path && this.tibet.path.tibet_inf) {
            tibet_inf = this.tibet.path.tibet_inf;
        } else {
            // Hard-coded fallback, but we don't have a choice if no other setting
            // is provided.
            tibet_inf = 'TIBET-INF';
        }

        if (this.options && this.options.tibet_lib) {
            tibet_lib = this.options.tibet_lib;
        } else if (this.tibet.boot && this.tibet.boot.tibet_lib) {
            tibet_lib = this.tibet.boot.tibet_lib;
        } else if (this.tibet.path && this.tibet.path.tibet_lib) {
            tibet_lib = this.tibet.path.tibet_lib;
        } else {
            tibet_lib = 'tibet'; // lowercase due to npm being default install
        }

        // How far is this file from the library root?
        offset = '../../..';

        checks = [
            [moduleDir, path.join(offset, tibet_lib.toUpperCase())],
            [moduleDir, path.join(offset, tibet_lib)]
        ];

        if (app_root) {
            //  Frozen variant. This comes first so it's found only if we're
            //  unable to find the node_modules directory which should exist.
            checks.unshift([app_root, path.join(tibet_inf, tibet_lib)]);

            // NOTE node_modules does not float with app_root, it's always found
            // at the application head.
            if (tibet_dir === 'node_modules') {
                checks.unshift([this.getAppHead(),
                    path.join(tibet_dir, tibet_lib)]);

            } else {
                checks.unshift([app_root, path.join(tibet_dir, tibet_lib)]);
            }
        }

        len = checks.length;
        for (i = 0; i < len; i++) {
            check = checks[i];
            dir = check[0];
            file = check[1];

            // NOTE we're using -d here since we're doing a directory check.
            if (sh.test('-d', path.join(dir, file))) {
                if (dir === moduleDir) {
                    // Have to adjust dir by offset but we need to watch for
                    // upper/lower case issues depending on whether we're dealing
                    // with a Git clone vs. an npm install (which is always
                    // lowercase).
                    if (file.indexOf(tibet_lib) === -1) {
                        tibet_lib = tibet_lib.toUpperCase();
                    }
                    dir = path.join(dir, offset, tibet_lib);
                } else {
                    // Have to adjust dir without offset
                    dir = path.join(dir, file);
                }
                this.lib_root = dir;
                break;
            }
        }

        if (!this.lib_root) {
            // Usually means a) running outside a project, b) didn't call the TIBET
            // library 'tibet' or 'TIBET'. Just default based on current file path.
            this.lib_root = path.join(module.filename, offset);
        }

        return this.lib_root;
    };


    /**
     * Returns the package configuration data from the NPM_FILE.
     * @returns {Object} Returns the npm package.json content.
     */
    Config.prototype.getPackageConfig = function() {
        return this.npm;
    };


    /**
     * Returns the project configuration data from the PROJECT_FILE.
     * @returns {Object} Returns the tibet.json content.
     */
    Config.prototype.getProjectConfig = function() {
        return this.tibet;
    };


    /**
     * Returns the project configuration data from the SERVER_FILE.
     * @returns {Object} Returns the tds.json content.
     */
    Config.prototype.getServerConfig = function() {
        return this.tds;
    };


    /**
     * Returns true if the path provided appears to be an aboslute path. Note that
     * this will return true for TIBET virtual paths since they are absolute paths
     * when expanded.
     * @param {string} aPath The path to be tested.
     * @returns {Boolean} True if the path is absolute.
     */
    Config.prototype.isAbsolutePath = function(aPath) {
        if (aPath.indexOf('~') === 0) {
            return true;
        }

        if (aPath.indexOf('/') === 0) {
            return true;
        }

        if (/^[a-zA-Z]+:/.test(aPath)) {
            return true;
        }

        return false;
    };


    /**
     * Recursively traverses a potentially nested set of properties and values and
     * ensures they are set as the current config values. Typically called with the
     * tibet.json and tds.json content to overlay tibet_cfg baseline settings.
     * @param {Object} dict The dictionary of key/value pairs in primitive object
     *     form.
     * @param {String} prefix An optional prefix for any properties being set.
     */
    Config.prototype.overlayProperties = function(dict, prefix) {
        var my;

        my = this;

        if (!dict) {
            return;
        }

        Object.keys(dict).forEach(function(key) {
            var value,
                name;

            value = dict[key];
            if (prefix) {
                name = prefix + '.' + key;
            } else {
                name = key;
            }

            if (Object.prototype.toString.call(value) === '[object Object]') {
                my.overlayProperties(value, name);
            } else {
                my.setcfg(name, value);
            }
        });
    };


    //  ---
    //  Exports
    //  ---

    module.exports = Config;
}());
