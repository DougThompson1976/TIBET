/**
 * @overview TIBET platform makefile. Key targets here focus on packaging the
 *     various portions of the platform for inclusion in TIBET applications.
 * @author Scott Shattuck (ss), William J. Edney (wje)
 * @copyright Copyright (C) 1999-2014 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     source code privacy waivers to keep your TIBET-based source code private.
 */

(function() {

'use strict';

var sh = require('shelljs');
var path = require('path');
var nodeCLI = require('shelljs-nodecli');
var helpers = require('tibet/src/tibet/cli/_make_helpers');

//  ---
//  targets
//  ---

/**
 * Canonical `targets` object for exporting the various target functions.
 */
var targets = {};

/**
 */
targets.build = function(make) {
    make.log('building packages....');

    if (!sh.test('-d', './lib/src')) {
        sh.mkdir('./lib/src');
    }

    targets.clean().then(
        targets.build_deps).then(
        targets.build_tibet).then(
        function() {
            targets.build.resolve();
        },
        function() {
            targets.build.reject();
        });
};

/**
 * Run lint and test commands to verify the code is in good shape.
 */
targets.check = function(make) {
    var result;

    make.log('checking for lint...');

    result = sh.exec('tibet lint');
    if (result.code !== 0) {
        targets.check.reject();
        return;
    }

    make.log('running unit tests...');

    result = sh.exec('tibet test');
    if (result.code !== 0) {
        targets.check.reject();
        return;
    }

    targets.check.resolve();
};

/**
 */
targets.clean = function(make) {
    make.log('removing build artifacts...');

    if (sh.test('-d', './lib/src')) {
        sh.rm('-rf', './lib/src/*');
    }

    targets.clean.resolve();
};

/**
 */
targets.changes = function(make) {
    make.log('building CHANGES file...');

    targets.changes.resolve();
};

/**
 */
targets.docs = function(make) {
    make.log('generating docs...');

    targets.docs.resolve();
};

/**
 */
targets.release = function(make) {
    make.log('prepping release...');

    targets.release.resolve();
};

// ---
// Externals
// ---

/**
 */
targets.build_deps = function(make) {
    make.log('building dependency packages....');

    if (!sh.test('-d', './lib/src')) {
        sh.mkdir('./lib/src');
    }

    targets.rollup_codemirror().then(
        targets.rollup_d3).then(
        targets.rollup_diff).then(
        targets.rollup_forge).then(
        targets.rollup_jquery).then(
        targets.rollup_pouchdb).then(
        targets.rollup_q).then(
        targets.rollup_xpath).then(
        function() {
            targets.build_deps.resolve();
        },
        function() {
            targets.build_deps.reject();
        });
};

/**
 */
targets.rollup_codemirror = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'codemirror'));
    sh.exec('npm install -d');

    sh.exec('mkdir ../../deps/codemirror');
    sh.exec('cp -f -R lib ../../deps/codemirror/');

    sh.exec('mkdir ../../deps/codemirror/mode');
    sh.exec('cp -f -R mode/javascript ../../deps/codemirror/mode');
    sh.exec('cp -f -R mode/xml ../../deps/codemirror/mode');
    sh.exec('cp -f -R mode/css ../../deps/codemirror/mode');

    sh.exec('mkdir ../../deps/codemirror/addon');
    sh.exec('mkdir ../../deps/codemirror/addon/search');
    sh.exec('cp -f -R addon/search/searchcursor.js ' +
            '../../deps/codemirror/addon/search');

    targets.rollup_codemirror.resolve();
};

/**
 */
targets.rollup_d3 = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'd3'));
    sh.exec('npm install -d');
    sh.exec('make');
    sh.exec('cp -f d3.min.js ../../deps/d3-tpi.min.js');

    targets.rollup_d3.resolve();
};

/**
 */
targets.rollup_diff = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'diff'));
    sh.exec('cp -f diff.js  ../../deps/diff-tpi.js');

    targets.rollup_diff.resolve();
};

/**
 */
targets.rollup_jquery = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'jquery'));

    // TODO: build and copy jquery build output to the proper location(s)

    targets.rollup_jquery.resolve();
};

/**
 */
targets.rollup_forge = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'node-forge'));
    sh.exec('npm install -d');
    sh.exec('npm run minify');
    sh.exec('cp -f js/forge.min.js ../../deps/forge-tpi.min.js');

    targets.rollup_forge.resolve();
};

/**
 */
targets.rollup_pouchdb = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'pouchdb'));
    sh.exec('npm install -d');
    sh.exec('npm run build');
    sh.exec('cp -f dist/pouchdb-nightly.min.js ../../deps/pouchdb-tpi.min.js');

    targets.rollup_pouchdb.resolve();
};

/**
 */
targets.rollup_q = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'q'));
    sh.exec('npm install -d');
    sh.exec('cp -f q.min.js  ../../deps/q-tpi.min.js');

    targets.rollup_q.resolve();
};

/**
 */
targets.rollup_xpath = function(make) {
    var npmdir;

    npmdir = path.join(__dirname, 'node_modules');
    sh.cd(path.join(npmdir, 'xpath'));
    sh.exec('cp -f xpath.js ../../deps/xpath-tpi.js');

    targets.rollup_xpath.resolve();
};

//  ---
//  TIBET
//  ---

/**
 */
targets.build_tibet = function(make) {
    make.log('building TIBET packages....');

    if (!sh.test('-d', './lib/src')) {
        sh.mkdir('./lib/src');
    }

    targets.rollup_init().then(
        targets.rollup_hook).then(
        targets.rollup_base).then(
        targets.rollup_full).then(
        function() {
            targets.build_tibet.resolve();
        },
        function() {
            targets.build_tibet.reject();
        });
};

/**
 * NOTE that if you change the 'init' here so the final file name changes
 * from tibet_init you need to update tibet_cfg.js to have the new value for
 * the 'tibetinit' flag. Also adjust the offset if the file target moves.
 */
targets.rollup_init = function(make) {
    helpers.rollup(make,
        'init',
        '~lib_cfg/TIBET.xml',
        'init',
        false,
        false,
        targets.rollup_init);

    helpers.rollup(make,
        'init',
        '~lib_cfg/TIBET.xml',
        'init',
        false,
        true,
        targets.rollup_init);
};

/**
 */
targets.rollup_hook = function(make) {
    helpers.rollup(make,
        'hook',
        '~lib_cfg/TIBET.xml',
        'hook',
        false,
        false,
        targets.rollup_hook);

    helpers.rollup(make,
        'hook',
        '~lib_cfg/TIBET.xml',
        'hook',
        false,
        true,
        targets.rollup_hook);
};

/**
 */
targets.rollup_base = function(make) {
    helpers.rollup(make,
        'base',
        '~lib_cfg/TIBET.xml',
        'base',
        true,
        false,
        targets.rollup_base);

    helpers.rollup(make,
        'base',
        '~lib_cfg/TIBET.xml',
        'base',
        true,
        true,
        targets.rollup_base);
};

/**
 */
targets.rollup_full = function(make) {
    helpers.rollup(make,
        'full',
        '~lib_cfg/TIBET.xml',
        'full',
        true,
        false,
        targets.rollup_full);

    helpers.rollup(make,
        'full',
        '~lib_cfg/TIBET.xml',
        'full',
        true,
        true,
        targets.rollup_full);
};

/**
 */
targets.test_cli = function(make) {
    var result;

    make.log('starting mocha...');
    result = nodeCLI.exec('mocha', '--ui bdd', '--reporter dot',
            './test/mocha/cli_test.js');

    if (result.code !== 0) {
        targets.test_cli.reject();
        return;
    }

    try {
        targets.test_cli.resolve();
    } catch (e) {
        targets.test_cli.reject(e);
    }
};

//  ---
//  Export
//  ---

module.exports = targets;

}());
