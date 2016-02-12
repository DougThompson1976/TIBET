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
 * @type {TP.sherpa.logview}
 */

//  ------------------------------------------------------------------------

TP.sherpa.Element.defineSubtype('logview');

TP.sherpa.logview.Inst.defineAttribute(
        'body',
        {value: TP.cpc('.body', TP.hc('shouldCollapse', true))});

TP.sherpa.logview.Inst.defineAttribute(
        'entryList',
        {value: TP.cpc('#entryList', TP.hc('shouldCollapse', true))});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.logview.Inst.defineMethod('setup',
function() {

    /**
     * @method setup
     */

    this.setRawContent('<ul id="entryList"></ul>');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.logview.Inst.defineMethod('addLogEntry',
function(dataRecord) {

    var cssClass,
        content;

    cssClass = TP.ifInvalid(dataRecord.at('cssClass'), '');

    content = '<li><span class="' + cssClass + '">' +
                dataRecord.at('output') +
                '</span></li>';

    return this.get('entryList').addRawContent(content);
});

//  ------------------------------------------------------------------------

TP.sherpa.logview.Inst.defineMethod('addRawContent',
function(newContent, aRequest) {

    return this.get('body').addRawContent(newContent, aRequest);
});

//  ------------------------------------------------------------------------

TP.sherpa.logview.Inst.defineMethod('setRawContent',
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
//  end
//  ========================================================================
