//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

/**
 * @type {TP.xctrls.hint}
 * @summary Manages hint XControls.
 */

//  ------------------------------------------------------------------------

TP.xctrls.TemplatedTag.defineSubtype('xctrls:hint');

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  This tag has no associated CSS. Note how this property is TYPE_LOCAL, by
//  design.
TP.xctrls.hint.defineAttribute('themeURI', TP.NO_RESULT);

//  This type captures no signals - it lets all signals pass through.
TP.xctrls.hint.Type.defineAttribute('opaqueCapturingSignalNames', null);

//  ------------------------------------------------------------------------

TP.xctrls.hint.Type.defineMethod('$dispatchHintSignal',
function(anEvent) {

    /**
     * @method $dispatchHintSignal
     * @summary Dispatches a TP.sig.UIHint signal based on information in the
     *     supplied event.
     * @param {Event} anEvent The native Event that is causing a TP.sig.UIHint
     *     signal to be dispatched.
     * @returns {TP.xctrls.hint} The receiver.
     */

    var sig,

        targetElem,
        targetTPElem,

        hintElem,
        textContentNode,

        textContent;

    //  Wrap the Event into a Signal and the event's *resolved* target into a
    //  TP.core.ElementNode wrapper. Note that we use the resolved target here
    //  because the mouse over might have happened on something like an
    //  'xctrls:label' and we want the core control element, which will be the
    //  parent in that case.
    sig = TP.wrap(anEvent);

    targetElem = sig.getResolvedTarget();

    targetTPElem = TP.wrap(targetElem);

    //  Grab the xctrls:hint element under the signal target
    hintElem = TP.byCSSPath('xctrls|hint', targetTPElem, true);

    //  Couldn't find a hint element. Go up the ancestor chain looking for an
    //  'on:mouseover' containing the 'OpenTooltip' signal name.
    if (TP.notValid(hintElem)) {
        targetElem = TP.nodeAncestorMatchingCSS(
                            targetElem, '*[on|mouseover*="OpenTooltip"]');

        if (!TP.isElement(targetElem)) {
            return this;
        }

        targetTPElem = TP.wrap(targetElem);

        //  Grab the xctrls:hint element under the signal target
        hintElem = TP.byCSSPath('xctrls|hint', targetTPElem, true);
    }

    //  Grab it's text content and use that as the hint's message.
    textContentNode = hintElem.getFirstChildContentNode();
    if (TP.isValid(textContentNode)) {
        textContent = TP.str(textContentNode);
    }

    targetTPElem.signal('TP.sig.UIHint', TP.hc('msg', textContent));

    return this;
});

//  ------------------------------------------------------------------------
//  Tag Phase Support
//  ------------------------------------------------------------------------

TP.xctrls.hint.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        parentElem,

        hintID;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  Grab the parent element of the element we're processing.

    parentElem = elem.parentNode;
    if (TP.isElement(parentElem)) {
        //  If it's real, then install a listener on it that will call our
        //  UIHint dispatch method.
        parentElem.addEventListener('mouseover',
                                    TP.xctrls.hint.$dispatchHintSignal,
                                    false);

        hintID = TP.lid(elem, true);

        //  Also, set 'on:mouseover' and 'on:mouseout' attributes that will send
        //  OpenTooltip/CloseTooltip signals respectively.
        TP.elementSetAttribute(
            parentElem,
            'on:mouseover',
            '{signal: OpenTooltip, payload: {contentID: ' + hintID + '}}',
            true);

        TP.elementSetAttribute(
            parentElem,
            'on:mouseout',
            '{signal: CloseTooltip}',
            true);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.hint.Type.defineMethod('tagDetachDOM',
function(aRequest) {

    /**
     * @method tagDetachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        parentElem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception
        return;
    }

    //  Grab the parent element of the element we're processing.

    parentElem = elem.parentNode;
    if (TP.isElement(parentElem)) {
        //  If it's real, then remove the listener that we installed in the
        //  attach method that call our UIHints dispatch method.
        parentElem.removeEventListener('mouseover',
                                        TP.xctrls.hint.$dispatchHintSignal,
                                        false);

        //  Also, remove the 'on:mouseover' and 'on:mouseout' attributes that we
        //  set in the attach method.
        TP.elementRemoveAttribute(parentElem, 'on:mouseover', true);

        TP.elementRemoveAttribute(parentElem, 'on:mouseout', true);
    }

    return;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
