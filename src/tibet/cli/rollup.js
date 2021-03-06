//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet rollup' command. This command inherits from 'tibet
 *     package' and works with a list of package asset nodes to process them
 *     into compressed and concatenated form for faster loading. See the tibet
 *     package command for more information on options.
 */
//  ========================================================================

/* eslint indent:0, consistent-this:0 */

(function() {

'use strict';

var CLI,
    sh,
    fs,
    esprima,
    esmangle,
    escodegen,
    Cmd;


CLI = require('./_cli');
sh = require('shelljs');
fs = require('fs');

esprima = require('esprima');
esmangle = require('esmangle');
escodegen = require('escodegen');

//  ---
//  Type Construction
//  ---

// NOTE we don't inherit from _cmd, but from package.
Cmd = function() {
    //  empty
};
Cmd.Parent = require('./package');
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
Cmd.NAME = 'rollup';

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
        'boolean': ['all', 'scripts', 'styles', 'images', 'nodes', 'headers',
            'minify'],
        'string': ['package', 'config', 'include', 'exclude', 'phase'],
        'default': {
            color: false,
            headers: true,
            'package': CLI.inProject() ? '~app_cfg/main' : '~lib_cfg/TIBET',
            'phase': CLI.inProject() ? 'two' : 'one',
            config: 'base'
        }
    },
    Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */


/**
 * The command usage string.
 * @type {string}
 */
Cmd.prototype.USAGE = 'tibet rollup [package-opts] [--headers] [--minify]';


//  ---
//  Instance Methods
//  ---

/**
 * Produces a compressed package of code ready for inclusion in a production
 * package. Note that virtually everything defaults when running in a typical
 * TIBET application context. For processing the TIBET platform you must at
 * least provide a package name (since the platform doesn't keep its tibet.xml
 * in the typical application location under TIBET-INF).
 * @param {Array.<Node>} list An array of package asset nodes.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executeForEach = function(list) {
    var pkg,
        cmd,
        cfg,
        minifyOpts; // Options for minify

    cmd = this;
    pkg = this.package;

    cfg = pkg.getProjectConfig();

    if (CLI.inProject() && !CLI.isInitialized()) {
        return CLI.notInitialized();
    }

    minifyOpts = CLI.ifUndefined(cfg.escodegen, {});
    this.debug('minifyOpts: ' + CLI.beautify(JSON.stringify(minifyOpts)));

    list.forEach(function(item) {
        var ast,
            mangled,
            src,
            code,
            virtual;

        // If this doesn't work it's a problem for any 'script' output.
        src = item.getAttribute('src') || item.getAttribute('href');

        if (src) {
            virtual = pkg.getVirtualPath(src);

            cmd.debug('Rolling up: ' + virtual);

            if (!sh.test('-e', src)) {
                throw new Error('NotFound: ' + src);
            }

            // Don't minify .min.js files, assume they're done. Also respect
            // either command-line option or element attribute to that effect.
            if (/\.min\.js$/.test(src) ||
                CLI.notEmpty(item.getAttribute('no-minify')) ||
                !cmd.options.minify) {
                code = fs.readFileSync(src, {encoding: 'utf8'});
            } else {
                try {
                    code = fs.readFileSync(src, {encoding: 'utf8'});

                    // Parse, reorg/mangle, & then re-generate JS code.
                    ast = esprima.parse(code);
                    mangled = esmangle.mangle(ast);
                    code = escodegen.generate(mangled, minifyOpts);

                    if (code && code[code.length - 1] !== ';') {
                        code += ';';
                    }
                } catch (e) {
                    cmd.error('Error minifying ' + src + ': ' + e.message);
                    throw e;
                }
            }

            if (cmd.options.headers) {
                pkg.log('TP.boot.$$srcPath = \'' + virtual + '\';');
            }

            if (cmd.options.debug !== true) {
                pkg.log(code);
            }

        } else {

            if (cmd.options.headers) {
                pkg.log('TP.boot.$$srcPath = \'\';');
            }

            if (cmd.options.debug !== true) {
                pkg.log(item.textContent);
            }
        }
    });
};


/**
 * Perform any last-minute changes to the package options before creation of the
 * internal Package instance. Intended to be overridden by custom subcommands.
 */
Cmd.prototype.finalizePackageOptions = function() {

    // Force nodes to be true for this particular subcommand. Better to handle
    // the unwrapping ourselves so we have complete access to all
    // metadata and/or child node content.
    this.pkgOpts.nodes = true;

    //  Never try to roll up image or resource tags. Images are binary (so
    //  should be more appcache level) and resources are inlined via the
    //  resource command/config.
    this.pkgOpts.images = false;
    this.pkgOpts.resources = false;

    this.debug('pkgOpts: ' + CLI.beautify(JSON.stringify(this.pkgOpts)));
};


/**
 * Returns a list of options/flags/parameters suitable for command completion.
 * @returns {Array.<string>} The list of options for this command.
 */
Cmd.prototype.getCompletionOptions = function() {
    var list,
        plist;

        list = Cmd.Parent.prototype.getCompletionOptions.call(this);
        plist = Cmd.Parent.prototype.getCompletionOptions();

        return CLI.subtract(plist, list);
};


module.exports = Cmd;

}());
