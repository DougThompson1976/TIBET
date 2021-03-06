//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet package' command. Front-end to the Package object found
 *     in _Package.js which provides utilities for processing TIBET package
 *     files and their contents. This command also serves as a supertype for
 *     other commands whose operations focus on processing file lists produced
 *     from TIBET packages such as 'tibet rollup' and 'tibet lint'.
 */
//  ========================================================================

/* eslint indent:0, consistent-this:0 */

/*
 * STANDARD OPTIONS:
 *
 *      package     The path of the top-level package to begin processing with.
 *                  The default is ~app_cfg/main.xml for application content.
 *      config      The name of the top-level package config to process.
 *                  Defaults to the default config for the package.
 *      all         True to expand all configs recursively. Default is false.
 *                  If this is true then config is ignored since all configs in
 *                  the package (and descendant packages) will be processed.
 *      silent      Silence normal logging. Defaults to the value set for 'all'.
 *                  If 'all' is true we default this to true to suppress
 *                  warnings about duplicate assets.
 *      phase       Package phase? Default depends on context (app vs. lib)
 *      context     alias for phase in this command (app, lib, all)
 *
 * OTHER OPTIONS:
 *
 *      Note that other options are passed through to the Package instance which
 *      does the actual expand/list processing. See tibet_package.js for more
 *      info on the options available through that component.
 */

(function() {

'use strict';

var CLI,
    path,
    find,
    dom,
    serializer,
    Cmd;


CLI = require('./_cli');
path = require('path');
find = require('findit');
dom = require('xmldom');
serializer = new dom.XMLSerializer();


//  ---
//  Type Construction
//  ---

Cmd = function() {
    //  empty
};
Cmd.Parent = require('./_cmd');
Cmd.prototype = new Cmd.Parent();


//  ---
//  Type Attributes
//  ---

/**
 * The context viable for this command.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.INSIDE;

/**
 * The command name for this type.
 * @type {string}
 */
Cmd.NAME = 'package';

//  ---
//  Instance Attributes
//  ---

/**
 * Command argument parsing options.
 * @type {Object}
 */

/* eslint-disable quote-props */
Cmd.prototype.PARSE_OPTIONS = CLI.blend(
    {
        'boolean': ['all', 'scripts', 'resources', 'images', 'nodes', 'missing',
            'inlined', 'unlisted'],
        'string': ['package', 'config', 'include', 'exclude', 'phase', 'profile'],
        default: {
            scripts: true,
            resources: true,
            images: true,
            missing: false,
            unlisted: false
        }
    },
    Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */


/**
 * The command usage string.
 * @type {string}
 */
Cmd.prototype.USAGE =
    'tibet package [--package <package>] [--config <cfg>] [--all] [--missing]\n' +
    '\t[--unlisted] [--include <asset names>] [--exclude <asset names>]\n' +
    '\t[--scripts] [--resources] --[images] [--phase <app|lib|all>] [--nodes]';


/**
 * The package instance which this instance is using to process package data.
 * @type {Package}
 */
Cmd.prototype.package = null;


/**
 * The final options used to drive the underlying Package object.
 * @type {Object}
 */
Cmd.prototype.pkgOpts = null;


//  ---
//  Instance Methods
//  ---

/**
 * Process inbound configuration flags and provide for adjustment via the
 * finalizePackageOptions call. On completion of this routine the receiver's
 * package options are fully configured.
 * @returns {Object} The package options after being fully configured.
 */
Cmd.prototype.configurePackageOptions = function(options) {

    this.pkgOpts = options || this.options;

    // If we're doing an unlisted or missing file scan we need to
    // override/assign values to the other parameters to ensure we get a full
    // list of known assets from the package being scanned.
    if (this.options.missing || this.options.unlisted) {
        this.info('scanning for missing/unlisted files...');
        this.options.images = true;
        this.options.scripts = true;
        this.options.resources = true;
        this.options.phase = 'all';
        this.options.include = null;
        this.options.exclude = null;

        //  When working with a specific config focus on that config, otherwise
        //  when only looking at a package we try to find everything in the
        //  package that might be missing.
        if (CLI.isEmpty(this.options.config)) {
            this.options.all = true;
        } else {
            this.options.all = false;
        }
    }

    // If silent isn't explicitly set but we're doing a full expansion turn
    // silent on so we skip duplicate resource warnings.
    if (CLI.notValid(this.options.silent) && this.options.all) {
        this.pkgOpts.silent = true;
    }

    //  Default the context based on project vs. library.
    if (CLI.notValid(this.pkgOpts.context)) {
        if (CLI.inProject()) {
            this.pkgOpts.context = 'app';
        } else if (CLI.inLibrary()) {
            this.pkgOpts.context = 'lib';
        }
    }

    //  Default the phase based on context.
    if (CLI.notValid(this.pkgOpts.phase)) {
        this.pkgOpts.phase = this.pkgOpts.context;
    }

    // Set boot phase defaults. If we don't manage these then most app package
    // runs will quietly filter out all their content nodes.
    this.pkgOpts.boot = this.pkgOpts.boot || {};
    switch (this.options.phase) {
        case 'lib':
        case 'one':
            this.pkgOpts.boot.phase_one = true;
            this.pkgOpts.boot.phase_two = false;
            break;
        case 'app':
        case 'two':
            this.pkgOpts.boot.phase_one = false;
            this.pkgOpts.boot.phase_two = true;
            break;
        default:
            this.pkgOpts.boot.phase_one = true;
            this.pkgOpts.boot.phase_two = true;
            break;
    }

    if (CLI.notValid(this.pkgOpts.boot.inlined)) {
        this.pkgOpts.boot.inlined = this.options.inlined || false;
    }

    // Give subtypes a hook to make any specific adjustments to
    // the package options they need.
    this.finalizePackageOptions();

    return this.pkgOpts;
};


/**
 * Top-level processing of the package to produce an asset list. For this type
 * and subtypes of the package command you should look to the "executeForEach"
 * method for the actual node-by-node processing logic.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.execute = function() {

    var list;       // The result list of asset references.

    this.configurePackageOptions();

    list = this.getPackageAssetList();

    this.executeForEach(list);

    return 0;
};


/**
 * Processes a list of package asset nodes. The specific processing is often
 * overridden by subtypes such as rollup and lint to iterate on the list
 * produced by the 'execute' method. The default behavior is to simply output
 * the node text to the log.
 * @param {Array.<Node>} list An array of package nodes.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executeForEach = function(list) {
    var cmd,
        finder,
        code,
        root,
        excludeDirs,
        excludeFiles,
        pouch,
        attrs,
        files,
        missing,
        unlisted;

    cmd = this;

    //  ---
    //  standard listing
    //  ---

    if (!this.options.unlisted && !this.options.missing) {
        list.forEach(function(item) {
            if (cmd.pkgOpts.nodes) {
                attrs = Array.prototype.slice.call(item.attributes);
                attrs.forEach(function(attr) {
                    item.setAttribute(attr.name,
                        CLI.getVirtualPath(attr.value));
                });
                cmd.info(serializer.serializeToString(item));
            } else {
                cmd.info(CLI.getVirtualPath(item));
            }
        });
        return;
    }

    //  ---
    //  missing file check
    //  ---

    if (this.options.missing) {

        //  Simple...just verify every path is real...
        missing = list.filter(function(item) {
            return !CLI.sh.test('-e', item);
        });

        if (missing.length > 0) {
            missing.forEach(function(item) {
                cmd.warn('Package entry not found: ' + item);
            });

            this.error('' + missing.length +
                ' package referenced files missing.');
        } else {
            this.info(
                'All package-referenced files found in project.');
        }
    }

    //  Are we done? No need to scan file system if we're just running a missing
    //  check.
    if (!this.options.unlisted) {
        if (missing.length > 0) {
            throw new Error();
        } else {
            return 0;
        }
    }

    //  ---
    //  unlisted
    //  ---

    /*
     * A bit more complicated. We need to scan the file system to come up with a
     * list of files that seem like they should be listed in the application
     * package for it to boot/roll up properly. Then we compare that to the list
     * of actual entries in the package.
     */

    excludeDirs = [];
    excludeDirs.push(/\/\..*/);
    excludeDirs.push(/node_modules/);

    excludeFiles = [];
    excludeFiles.push(/\/\..*/);
    excludeFiles.push(/\.css$/);
    excludeFiles.push(/\.less$/);
    excludeFiles.push(/\.sass$/);
    excludeFiles.push(/\.xhtml$/);

    if (CLI.inProject()) {
        root = CLI.expandPath('~app');

        excludeDirs.push(/~app_build/);
        excludeDirs.push(/~lib/);
        excludeDirs.push(/~app_boot/);
        excludeDirs.push(/~app_cfg/);
        excludeDirs.push(/~app_cmd/);
        excludeDirs.push(/~app_log/);

        pouch = CLI.cfg('tds.pouch') || 'pouch';
        excludeDirs.push(new RegExp(pouch));

    } else {
        root = CLI.expandPath('~lib');

        excludeDirs.push(/~lib_boot/);
        excludeDirs.push(/~lib_cli/);
        excludeDirs.push(/~lib_cmd/);
        excludeDirs.push(/~lib_dna/);
        excludeDirs.push(/~lib_cfg/);
        excludeDirs.push(/~lib_etc/);
        excludeDirs.push(/~lib_deps/);
    }

    code = 0;
    files = [];

    finder = find(root);

    finder.on('error', function(e) {
        cmd.error('Error processing project files: ' + e);
        code = 1;
    });

    // Ignore links. (There shouldn't be any...but just in case.).
    finder.on('link', function(link) {
        cmd.warn('Ignoring link: ' + link);
    });

    // Ignore hidden directories and the node_modules directory.
    finder.on('directory', function(dir, stat, stop) {
        var base,
            virtual;

        base = path.basename(dir);
        if (base.charAt(0) === '.' || base === 'node_modules') {
            stop();
            return;
        }

        if (CLI.notEmpty(excludeDirs)) {
            virtual = CLI.getVirtualPath(dir);
            excludeDirs.forEach(function(exclusion) {
                if (exclusion.test(dir) || exclusion.test(virtual)) {
                    stop();
                }
            });
        }
    });

    finder.on('file', function(file) {
        var virtual,
            stop;

        if (!file.match(/\.(js|jscript)$/)) {
            return;
        }

        stop = false;

        if (CLI.notEmpty(excludeFiles)) {
            virtual = CLI.getVirtualPath(file);
            excludeFiles.forEach(function(exclusion) {
                if (exclusion.test(file) || exclusion.test(virtual)) {
                    stop = true;
                }
            });
        }

        if (stop) {
            return;
        }

        files.push(file);
    });

    finder.on('end', function() {
        var packaged;

        if (code !== 0) {
            throw new Error();
        }

        //  File lists and package entries come in fully-expanded form but that
        //  makes comparisons harder from a filtering perspective (easier to
        //  filter out ~lib_build than some hard-coded root path).
        files = files.map(function(file) {
            return CLI.getVirtualPath(file);
        });

        packaged = list.map(function(file) {
            return CLI.getVirtualPath(file);
        });

        unlisted = files.filter(function(item) {
            return packaged.indexOf(item) === -1;
        });

        if (unlisted.length > 0) {

            if (cmd.options.verbose) {
                unlisted.forEach(function(item) {
                    cmd.log('Unlisted file found: ' + item);
                });
            }

            cmd.info('' + unlisted.length + ' files not referenced in package.');
        } else {
            cmd.info(
                'All files referenced at least once in package.');
        }

        //  In case we had missing check as well we won't have exited with error
        //  state since we held off to do the unlisted check. Deal with that.
        if (missing.length > 0) {
            throw new Error();
        } else {
            return 0;
        }
    });
};


/**
 * Perform any last-minute changes to the package options before creation of the
 * internal Package instance. Intended to be overridden but custom subcommands.
 */
Cmd.prototype.finalizePackageOptions = function() {

    //  Tell the package helper our config should win.
    this.pkgOpts.forceConfig = true;

    if (!this.pkgOpts.package) {
        if (this.options.profile) {
            this.pkgOpts.package = this.options.profile.split('#')[0];
            this.pkgOpts.config = this.options.profile.split('#')[1];
        } else {
            this.pkgOpts.package = CLI.getcfg('boot.package') ||
                CLI.getcfg('boot.default_package') ||
                CLI.PACKAGE_FILE;
        }
    }

    this.debug('pkgOpts: ' + CLI.beautify(JSON.stringify(this.pkgOpts)));
};


/**
 * Return the list of assets for the receiver based on its current package
 * options. The package options are determined by configurePackageOptions and
 * the finalizePackageOptions call it invokes.
 * @returns {Array} The package options.
 */
Cmd.prototype.getPackageAssetList = function() {

    var Package,    // The tibet_package.js export.
        list;       // The result list of asset references.

    Package = require('../../../etc/common/tibet_package.js');
    this.package = new Package(this.pkgOpts);

    if (this.pkgOpts.all) {
        this.package.expandAll();
        list = this.package.listAllAssets();
    } else {
        this.package.expandPackage();
        list = this.package.listPackageAssets();
    }

    return list;
};


module.exports = Cmd;

}());
