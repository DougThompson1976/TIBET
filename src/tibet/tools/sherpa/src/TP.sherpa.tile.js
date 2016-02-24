//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

/**
 * @type {TP.sherpa.tile}
 */

//  ------------------------------------------------------------------------

TP.sherpa.Element.defineSubtype('tile');

TP.sherpa.tile.Inst.defineAttribute(
        'header',
        {value: TP.cpc('> .header', TP.hc('shouldCollapse', true))});

TP.sherpa.tile.Inst.defineAttribute(
        'headerText',
        {value: TP.cpc('> .header > .header_text', TP.hc('shouldCollapse', true))});

TP.sherpa.tile.Inst.defineAttribute(
        'minimizeMark',
        {value: TP.cpc('> .header > .minimize_mark', TP.hc('shouldCollapse', true))});

TP.sherpa.tile.Inst.defineAttribute(
        'closeMark',
        {value: TP.cpc('> .header > .close_mark', TP.hc('shouldCollapse', true))});

TP.sherpa.tile.Inst.defineAttribute(
        'body',
        {value: TP.cpc('> .body', TP.hc('shouldCollapse', true))});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.tile.Inst.defineHandler('MinimizeTile',
function(aSignal) {

    this.toggle('hidden');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.tile.Inst.defineHandler('CloseTile',
function(aSignal) {

    this.teardown();
    this.detach();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.tile.Inst.defineMethod('setHeader',
function(newContent, aRequest) {

    return this.get('headerText').setTextContent(newContent);
});

//  ------------------------------------------------------------------------

TP.sherpa.tile.Inst.defineMethod('setRawContent',
function(newContent, aRequest) {

    /**
     * @method setRawContent
     * @summary Sets the content of the receiver to the content provided
     *     without performing any content processing on it.
     * @param {Object} newContent The content to write into the receiver. This
     *     can be a String, a Node, or an Object capable of being converted into
     *     one of those forms.
     * @param {TP.sig.Request} aRequest An optional request object which defines
     *     further parameters.
     * @returns {TP.core.Node} The result of setting the content of the
     *     receiver.
     */

    return this.get('body').setRawContent(newContent, aRequest);
});

//  ------------------------------------------------------------------------

TP.sherpa.tile.Inst.defineMethod('setup',
function() {

    /**
     * @method setup
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.tile.Inst.defineMethod('teardown',
function() {

    /**
     * @method teardown
     */

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
