/**
 * @overview The 'tibet version' command. Dumps the current version of TIBET.
 * @author Scott Shattuck (ss)
 * @copyright Copyright (C) 1999-2014 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     open source waivers to keep your derivative work source code private.
 */

(function() {

'use strict';

var CLI = require('./_cli');


//  ---
//  Type Construction
//  ---

var Parent = require('./_cmd');

var Cmd = function(){};
Cmd.prototype = new Parent();


//  ---
//  Instance Attributes
//  ---

/**
 * The command execution context.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.ANY;


/**
 * The command help string.
 * @type {string}
 */
Cmd.prototype.HELP =
'Displays the current version of TIBET. Also available as the\n' +
'--version flag on the \'tibet\' command (tibet --version).\n';


/**
 * The command usage string.
 * @type {string}
 */
Cmd.prototype.USAGE = 'tibet version';


//  ---
//  Instance Methods
//  ---

/**
 * Perform the actual command processing logic.
 * @return {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.execute = function() {

    try {
        this.info(CLI.config.npm.version);
    } catch (e) {
        this.error('Unable to determine TIBET version.');
    }
};


module.exports = Cmd;

}());
