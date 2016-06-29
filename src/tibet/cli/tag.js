//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet tag' command. This command creates new tag source files
 *     in a target directory, creating the directory if necessary. Files
 *     containing handlebars templates are processed with an object containing
 *     the tagname and any other argument values for the command. It also
 *     updates the appropriate package/config locations to contain entries for
 *     the newly created files.
 */
//  ========================================================================

/* eslint indent:0 */

(function() {

'use strict';

var CLI,
    Parent,
    Cmd,
    path,
    helpers;

CLI = require('./_cli');
path = require('path');
helpers = require('../../../etc/cli/config_helpers');

//  ---
//  Type Construction
//  ---

Parent = require('./_cmd');

Cmd = function() {};
Cmd.prototype = new Parent();

//  Augment our prototype with XML config methods.
helpers.extend(Cmd, CLI);

//  ---
//  Instance Attributes
//  ---

/**
 * The command execution context. This command can only be done inside the TIBET
 * library or a TIBET project.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.INSIDE;

/**
 * The command name for this type.
 * @type {string}
 */
Cmd.NAME = 'tag';

/**
 * Where do we look for compiled tag source templates?
 * @type {String}
 */
Cmd.prototype.COMPILED_TAG_ROOT = '../templates/compiledtag/';

/**
 * Where do we look for templated tag source templates?
 * @type {String}
 */
Cmd.prototype.TEMPLATED_TAG_ROOT = '../templates/templatedtag/';

/**
 * Command argument parsing options.
 * @type {Object}
 */
Cmd.prototype.PARSE_OPTIONS = CLI.blend(
    /* eslint-disable quote-props */
    {
        'boolean': ['compiled'],
        'string': ['package', 'config', 'dir', 'name', 'template', 'style'],
        'default': {
            compiled: false,
            template: ''
        }
    },
    Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */

/**
 * The command usage string.
 * @type {string}
 */
Cmd.prototype.USAGE =
    'tibet tag [--name] [[<root>.]<namespace>:]<tagname> [--package <pkgname>] [--config <cfgname>] [--dir <dirname>] [--compiled] [--template <uri|markup>] [--style <uri>|NO_RESULT]';


//  ---
//  Instance Methods
//  ---

/**
 * Processes command line and default options to resolve the final parameters to
 * use for command execution.
 *
 * The defaults for various parameters are as follows
 *
 * name             application             library
 * ----             -----------             -------
 * nsroot           'APP'                   'TP'
 * nsname           appname                 cannot default
 * tagname          cannot default          cannot default
 *
 * name             tagname                 tagname
 * package          '~app_cfg/{{appname}}.xml'   '~lib_cfg/lib_namespaces.xml'
 * config           'scripts'              '<nsname>'
 * dir              '~app_src/tags'        '~lib_src/<nsname>'
 * compiled         false                   false
 * template         ''                      ''
 * style            '~app_src/tags/.'      '~lib/styles'
 *
 * @returns {Object} The options specific to running this command.
 */
Cmd.prototype.configure = function() {
    var inProj,
        opts,
        appname,
        tagname,
        tnparts;

    opts = {};

    if (CLI.inProject()) {
        appname = CLI.cfg('npm.name');
    } else {
        //  outside of a project, appname means nothing.
        appname = null;
    }

    opts.appname = appname;

    //  Command is at 0, tagname should be [1] (or the value of the 'name' flag).
    tagname = this.options.name || this.options._[1];

    //  Have to get at least one non-option argument (the tagname).
    if (!tagname) {
        this.usage();
        throw new Error();
    }

    if (CLI.inProject()) {
        inProj = true;
    } else {
        inProj = false;
    }

    CLI.blend(opts, this.options);

    tnparts = tagname.split(/[\.:]/g);
    switch (tnparts.length) {
        case 3:
            opts.nsroot = tnparts[0];
            opts.nsname = tnparts[1];
            opts.tagname = tnparts[2];
            break;

        case 2:
            opts.nsroot = inProj ? 'APP' : 'TP';
            opts.nsname = tnparts[0];
            opts.tagname = tnparts[1];
            break;

        case 1:
            opts.nsroot = inProj ? 'APP' : 'TP';
            if (inProj) {
                opts.nsname = opts.appname;
            } else {
                this.error('Cannot default namespace for lib tag: ' + tagname);
                return null;
            }
            opts.tagname = tnparts[0];
            break;

        default:
            break;
    }

    //  Note that, if the original property exists on the 'this.options' object,
    //  we remove it from 'opts' (it got copied over in the 'blend' above) to
    //  avoid confusion.

    if (!(opts.pkgname = this.options.package)) {
        opts.pkgname = inProj ?
                        '~app_cfg/' + CLI.getcfg('npm.name') + '.xml' :
                        '~lib_cfg/lib_namespaces.xml';
    } else {
        delete opts.package;
    }

    if (!(opts.cfgname = this.options.config)) {
        opts.cfgname = inProj ? 'scripts' : opts.nsname;
    } else {
        delete opts.config;
    }

    if (!(opts.dirname = this.options.dir)) {
        opts.dirname = inProj ? '~app_src/tags' : '~lib_src/' + opts.nsname;
        opts.dirname = path.join(opts.dirname,
            opts.nsname + '.' + opts.tagname);
    } else {
        delete opts.dir;
    }

    //  'compiled' is default by the config machinery
    //  'template' is default by the config machinery
    //  'style' is default by the config machinery

    return opts;
};

//  ---

/**
 * Runs the specific command in question.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.execute = function() {

    var fs,         // The file system module.
        hb,         // The handlebars module. Used to inject data in dna files.
        find,       // The findit module. Used to traverse and process files.
        sh,         // The shelljs module. Used for cloning dna etc.
        cmd,        // Closure'd variable for this references.

        opts,

        code,       // Result code. Set if an error occurs in nested callbacks.
        src,        // The directory to the tag template we're using.
        err,        // Error string returned by shelljs.error() test function.
        finder,     // The find event emitter we'll handle find events on.
        target,     // The target directory name (based on appname).

        oldFile,
        newFile;

    cmd = this;

    opts = this.options;

    fs = require('fs');
    sh = require('shelljs');

    if (opts.compiled) {
        src = path.join(module.filename, this.COMPILED_TAG_ROOT);
    } else {
        src = path.join(module.filename, this.TEMPLATED_TAG_ROOT);
    }

    //  Verify source directory for template files.
    if (!sh.test('-d', src)) {
        this.error('Error finding source directory ' + src);
        return 1;
    }

    //  Verify target directory exists, or create it as needed.
    target = CLI.expandPath(opts.dirname);
    if (!sh.test('-d', target)) {
        sh.mkdir(target);
        err = sh.error();
        if (err) {
            this.error('Error creating target directory: ' + err);
            return 1;
        }
    }

    find = require('findit');
    hb = require('handlebars');

    cmd.written = [];
    finder = find(src);
    code = 0;

    finder.on('file', function(file) {
        var content,  // File content after template injection.
            data,     // File data.
            template; // The compiled template content.

        cmd.verbose('Processing file: ' + file);

        //  If we read a css or less file from the template dir we need to
        //  verify that we should use it as opposed to one specified on the
        //  command line.
        if (['.css', '.less', '.sass'].indexOf(path.extname(file)) !== -1) {
            if (opts.style) {
                //  Rely on configuration map to point to the template.
                return;
            }
        }

        if (['.xhtml', '.svg'].indexOf(path.extname(file)) !== -1) {
            if (opts.template) {
                if (/^</.test(opts.template.trim())) {

                    newFile = opts.nsroot + '.' + opts.nsname + '.' +
                        opts.tagname;
                    //  Sniff to see if the template may be raw SVG and adjust
                    //  extension accordingly
                    if (/^<svg/.test(opts.template.trim())) {
                        newFile = newFile + '.svg';
                    } else {
                        newFile = newFile + '.xhtml';
                    }

                    newFile = path.join(CLI.expandPath('~app_src/tags'),
                        newFile);

                    try {
                        fs.writeFileSync(newFile, opts.template);
                        return;
                    } catch (e) {
                        cmd.error('Error writing file ' + newFile + ': ' +
                            e.message);
                        code = 1;
                        return;
                    }
                } else {
                    //  Pointer to a URI. Rely on config mapping.
                    return;
                }
            }
        }

        try {
            data = fs.readFileSync(file, {encoding: 'utf8'});
            if (!data) {
                throw new Error('Empty');
            }
        } catch (e) {
            cmd.error('Error reading ' + file + ': ' + e.message);
            code = 1;
            return;
        }

        try {
            template = hb.compile(data);
            if (!template) {
                throw new Error('InvalidTemplate');
            }
        } catch (e) {
            cmd.error('Error compiling template ' + file + ': ' +
                e.message);
            code = 1;
            return;
        }

        try {
            content = template(opts);
            if (!content) {
                throw new Error('InvalidContent');
            }
        } catch (e) {
            cmd.error('Error injecting template data in ' + file +
                ': ' + e.message);
            code = 1;
            return;
        }

        //  Work through the root/ns/tag portions to build out the new file name
        //  we should be creating/writing.
        oldFile = path.join(target, file.replace(src, ''));
        if (/__nsroot__/.test(oldFile)) {
            newFile = oldFile.replace(/__nsroot__/g, opts.nsroot);
            oldFile = newFile;
        }
        if (/__nsname__/.test(oldFile)) {
            newFile = oldFile.replace(/__nsname__/g, opts.nsname);
            oldFile = newFile;
        }
        if (/__tagname__/.test(oldFile)) {
            newFile = oldFile.replace(/__tagname__/g, opts.tagname);
            oldFile = newFile;
        }

        if (sh.test('-e', newFile)) {
            cmd.error('Error writing file ' + newFile + ': file exists.');
            code = 1;
            return;
        }

        cmd.verbose('Writing file: ' + newFile);
        cmd.written.push(newFile);
        try {
            fs.writeFileSync(newFile, content);
        } catch (e) {
            cmd.error('Error writing file ' + newFile + ': ' + e.message);
            code = 1;
            return;
        }
    });

    finder.on('end', function() {

        //  Once all files have been generated/processed update the config.
        if (!cmd.updateConfigFile(cmd.written, opts)) {
            return 1;
        }

        if (code === 0) {
            cmd.info('New tag: \'' +
                (opts.nsroot + '.' + opts.nsname + '.' + opts.tagname) +
                '\' added successfully.');
        }
    });
};

//  ---

Cmd.prototype.updateConfigFile = function(files, opts) {
    var cfgNode,
        dirty,
        value,
        fqtagname,
        templatePath;

    fqtagname = opts.nsroot + '.' + opts.nsname + '.' + opts.tagname;

    cfgNode = this.readConfigNode(opts.pkgname, opts.cfgname, true);
    if (!cfgNode) {
        throw new Error('Unable to find ' + opts.pkgname + '#' + opts.cfgname);
    }

    //  ---
    //  scripts
    //  ---

    value = opts.dirname + '/' + fqtagname + '.js';
    if (!this.hasXMLEntry(cfgNode, 'script', 'src', value)) {
        dirty = true;
        this.addXMLEntry(
                cfgNode,
                '    ',
                '<script src="' + value + '"/>',
                '');
    }

    if (opts.style) {
        value = 'path.' + fqtagname + '.style';
        if (!this.hasXMLEntry(cfgNode, 'property', 'name', value)) {
            dirty = true;
            this.addXMLEntry(
                cfgNode,
                '\n    ',
                '<property name="' + value + '"' +
                    ' value="' + opts.style + '"/>',
                '');
        }
    }

    //  Only point to a different location for template is either a URI or we're
    //  about to write a .svg file (since that won't default for a tag).
    if (opts.template) {
        if (/^</.test(opts.template.trim()) === true) {
            if (/^<svg/.test(opts.template.trim()) !== true) {
                templatePath = null;
            } else {
                templatePath = opts.dirname + '/' + fqtagname + '.svg';
            }
        } else {
            templatePath = opts.template;
        }

        if (templatePath) {
            value = 'path.' + fqtagname + '.template';
            if (!this.hasXMLEntry(cfgNode, 'property', 'name', value)) {
                dirty = true;
                this.addXMLEntry(
                    cfgNode,
                    '\n    ',
                    '<property name="' + value + '"' +
                        ' value="' + templatePath + '"/>',
                    '');
            }
        }
    }

    if (dirty) {
        this.addXMLLiteral(cfgNode, '\n');
        this.writeConfigNode(opts.pkgname, cfgNode);
    }
    dirty = false;

    //  ---
    //  tests
    //  ---

    cfgNode = this.readConfigNode(opts.pkgname, 'tests', true);
    if (!cfgNode) {
        throw new Error('Unable to find ' + opts.pkgname + '#' + opts.cfgname);
    }

    value = opts.dirname + '/' + fqtagname + '_test.js';
    if (!this.hasXMLEntry(cfgNode, 'script', 'src', value)) {
        dirty = true;
        this.addXMLEntry(
                cfgNode,
                '    ',
                '<script src="' + value + '"/>',
                '');
    }

    if (dirty) {
        this.addXMLLiteral(cfgNode, '\n');
        this.writeConfigNode(opts.pkgname, cfgNode);
    }

    return true;
};

module.exports = Cmd;

}());
