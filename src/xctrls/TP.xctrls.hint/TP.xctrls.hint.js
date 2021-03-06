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
        targetID,

        targetTPElem,

        hintTPElem,
        textContentNode,

        textContent;

    //  Wrap the Event into a Signal and the event's *resolved* target into a
    //  TP.core.ElementNode wrapper. Note that we use the resolved target here
    //  because the mouse over might have happened on something like an
    //  'xctrls:label' and we want the core control element, which will be the
    //  parent in that case.
    sig = TP.wrap(anEvent);

    targetElem = sig.getResolvedTarget();
    targetID = TP.elementGetAttribute(targetElem, 'id', true);

    targetTPElem = TP.wrap(targetElem);

    //  Grab the xctrls:hint element under the signal target. Note we supply
    //  true to try to 'autocollapse' an Array of 1 result into just the result.
    hintTPElem = TP.byCSSPath('xctrls|hint', targetTPElem, true);

    //  If there was more than one, then the query was invalid. Return true.
    if (TP.isArray(hintTPElem)) {
        //  TODO: Raise an exception
        return this;
    }

    //  Couldn't find a hint element. Go up the ancestor chain looking for an
    //  'on:mouseover' containing the 'OpenTooltip' signal name.
    if (TP.notValid(hintTPElem)) {
        targetElem = TP.nodeAncestorMatchingCSS(
                            targetElem, '*[on|mouseover*="OpenTooltip"]');

        if (TP.isElement(targetElem)) {
            targetTPElem = TP.wrap(targetElem);

            //  Grab the xctrls:hint element under the signal target
            hintTPElem = TP.byCSSPath('xctrls|hint', targetTPElem, true);
        } else {

            //  Couldn't find one by traversing the ancestor chain. See if an
            //  xctrls:hint exists with a 'for=' attribute containing the target
            //  ID.
            hintTPElem = TP.byCSSPath('*[for="' + targetID + '"]',
                                        sig.getDocument(),
                                        true);
        }

        if (TP.notValid(hintTPElem)) {
            return this;
        }
    }

    //  Grab it's text content and use that as the hint's message.
    textContentNode = hintTPElem.getFirstChildContentNode();
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
        forElem,

        hintID;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  If we have a 'for' attribute, see if there is an Element that matches
    //  that ID.
    if (TP.elementHasAttribute(elem, 'for', true)) {
        forElem = TP.byId(TP.elementGetAttribute(elem, 'for', true),
                            TP.nodeGetDocument(elem),
                            false);
    }

    //  If there wasn't an element matching the 'for' element, grab the parent
    //  element of the element we're processing.
    if (!TP.isElement(forElem)) {
        forElem = elem.parentNode;
    }

    if (TP.isElement(forElem)) {
        //  If it's real, then install a listener on it that will call our
        //  UIHint dispatch method.
        forElem.addEventListener('mouseover',
                                    TP.xctrls.hint.$dispatchHintSignal,
                                    false);

        hintID = TP.lid(elem, true);

        //  Also, set 'on:mouseover' and 'on:mouseout' attributes that will send
        //  OpenTooltip/CloseTooltip signals respectively.
        TP.elementSetAttribute(
            forElem,
            'on:mouseover',
            '{signal: OpenTooltip, payload: {contentID: ' + hintID + '}}',
            true);

        TP.elementSetAttribute(
            forElem,
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
        forElem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception
        return;
    }

    //  If we have a 'for' attribute, see if there is an Element that matches
    //  that ID.
    if (TP.elementHasAttribute(elem, 'for', true)) {
        forElem = TP.byId(TP.elementGetAttribute(elem, 'for', true),
                            TP.nodeGetDocument(elem),
                            false);
    }

    //  If there wasn't another 'for' element, grab the parent element of the
    //  element we're processing.
    if (!TP.isElement(forElem)) {
        forElem = elem.parentNode;
    }

    if (TP.isElement(forElem)) {
        //  If it's real, then remove the listener that we installed in the
        //  attach method that call our UIHints dispatch method.
        forElem.removeEventListener('mouseover',
                                        TP.xctrls.hint.$dispatchHintSignal,
                                        false);

        //  Also, remove the 'on:mouseover' and 'on:mouseout' attributes that we
        //  set in the attach method.
        TP.elementRemoveAttribute(forElem, 'on:mouseover', true);

        TP.elementRemoveAttribute(forElem, 'on:mouseout', true);
    }

    return;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
