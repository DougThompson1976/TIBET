//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet init' command. Ensures any local tibet repositories are
 *     linked into place (for TIBET developers ;)) and that npm install is run
 *     to ensure any other dependencies are installed.
 */
//  ========================================================================

/* eslint indent:0 */

(function() {

'use strict';

var CLI,
    Cmd,
    path;


CLI = require('./_cli');
path = require('path');

//  ---
//  Type Construction
//  ---

Cmd = function() {};
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
Cmd.NAME = 'init';

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
        'boolean': ['link'],
        'default': {
        }
    },
    Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */


/**
 * The command usage string.
 * @type {string}
 */
Cmd.prototype.USAGE = 'tibet init [--link]';


//  ---
//  Instance Methods
//  ---

/**
 * Runs the command. For this type the goal is to provide easy startup of the
 * local TIBET server.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.execute = function() {

    var sh,     // The shelljs module.
        child,  // The child_process module.
        cmd,    // Closure'd var providing access to the command object.
        dna,
        lnflags,
        lnerr,
        rmerr;

    cmd = this;

    sh = require('shelljs');
    child = require('child_process');

    // We can only start if we're in a top-level Node.js project directory.
    if (!sh.test('-f', 'package.json')) {
        this.error(
            'Cannot init. No package.json found. Are you in a project?');
        return 1;
    }

    lnflags = '-s';
    if (this.options.force) {
        lnflags += 'f';
    }

    // If the node_modules directory doesn't exist (but we know there's a
    // package.json due to earlier check) it means 'npm install' was never run.
    // We have to do that before we can try to start the server.
    if (sh.test('-e', 'node_modules')) {
        if (!this.options.force) {
            this.warn('Project already initialized. ' +
                'Use --force to re-initialize.');
            return 1;
        }
        this.warn('--force specified...removing and rebuilding node_modules.');
        rmerr = sh.rm('-rf', 'node_modules');
        if (rmerr) {
            this.error('Error removing node_modules directory: ' + rmerr);
            return 1;
        }
    }

    dna = this.getcfg('tibet.dna');
    if (CLI.notEmpty(dna)) {
        dna = dna.slice(dna.lastIndexOf(path.sep) + 1);
        cmd.info('Initializing new \'' + dna + '\' project ' +
            this.getcfg('npm.name') + '...');
    } else {
        cmd.info('Initializing new project...');
    }

    if (this.options.link === true) {

        // For reasons largely due to how the CLI needs to operate (and
        // until the code is part of the global npm package install) we
        // also need an internal link to the tibet 5.0 platform.
        cmd.log('linking TIBET into project via `npm link tibet`.');

        child.exec('npm link tibet', function(linkerr, linkstdout, linkstderr) {
            if (linkerr) {
                cmd.error('Failed to initialize: ' + linkstderr);
                cmd.warn(
                    '`git clone` TIBET 5.x, `npm link .` it, and retry.');
                throw new Error();
            }

            // Ensure npm install is run once we're sure the things that
            // need to be 'npm link'd into place have been. If we don't
            // do this last it'll just fail.
            cmd.log('installing dependencies via `npm install`, be patient.');

            child.exec('npm install', function(err, stdout, stderr) {
                if (err) {
                    cmd.error('Failed to initialize: ' + stderr);
                    throw new Error();
                }

                //  We also link TIBET library code into the TIBET-INF location
                //  to avoid pointing down into node_modules or having
                //  node_modules be a location potentially pushed to a remote
                //  deployment target.
                sh.ln(lnflags, path.join(
                    CLI.expandPath(CLI.getAppHead()), 'node_modules/tibet'),
                    path.join(
                    CLI.expandPath(CLI.getAppRoot()), 'TIBET-INF/tibet'));
                lnerr = sh.error();
                if (lnerr) {
                    cmd.error('Error linking library launch directory: ' +
                        lnerr);
                } else {
                    cmd.log('TIBET development dependency linked.');
                }
/*
                cmd.log('performing initial `tibet build`.');
                child.exec('tibet build', function(err, stdout, stderr) {
                    if (err) {
                        cmd.error('Failed to initialize: ' + stderr);
                        throw new Error();
                    }

                    cmd.log('project initialized successfully.');
                    cmd.info('Use `tibet start` to run your app.');
                });
*/
            });
        });

    } else {

        cmd.log('installing project dependencies via `npm install`.');

        child.exec('npm install', function(err, stdout, stderr) {
            if (err) {
                cmd.error('Failed to initialize: ' + stderr);
                throw new Error();
            }

            //  We also link TIBET library code into the TIBET-INF location to
            //  avoid pointing down into node_modules or having node_modules be
            //  a location potentially pushed to a remote deployment target.
            sh.ln(lnflags, path.join(
                CLI.expandPath(CLI.getAppHead()), 'node_modules/tibet'),
                path.join(
                CLI.expandPath(CLI.getAppRoot()), 'TIBET-INF/tibet'));
            lnerr = sh.error();
            if (lnerr) {
                cmd.error('Error linking library launch directory: ' +
                    lnerr);
            } else {
                cmd.log('TIBET development dependency linked.');
            }

            cmd.log('performing initial `tibet build`.');
            child.exec('tibet build', function(childErr, childStdout, childStderr) {
                if (childErr) {
                    cmd.error('Failed to initialize: ' + stderr);
                    throw new Error();
                }

                cmd.log('project initialized successfully.');
                cmd.info('Use `tibet start` to run your app.');
            });
        });
    }
};

module.exports = Cmd;

}());

