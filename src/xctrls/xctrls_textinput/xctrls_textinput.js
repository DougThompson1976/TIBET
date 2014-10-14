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
 * @type {TP.xctrls.textinput}
 * @synopsis Manages textinput XControls.
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('xctrls:textinput');

TP.xctrls.textinput.addTraitsFrom(TP.xctrls.Element,
                                    TP.core.TemplatedNode);
TP.xctrls.textinput.Type.resolveTrait('tagCompile', TP.core.TemplatedNode);

//  Resolve the traits right away as type methods of this type are called during
//  content processing when we only have type methods involved.
TP.xctrls.textinput.executeTraitResolution();

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.xctrls.textinput.Inst.defineAttribute(
        'valuePElem',
        {'value': TP.cpc('*[tibet|pelem="value"]', true)});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.textinput.Inst.defineMethod('blur',
function() {

    /**
     * @name blur
     * @returns {TP.xctrls.textinput} The receiver.
     * @abtract Blurs the receiver for keyboard input.
     * @todo
     */

    var valuePElem;

    this.callNextMethod();

    valuePElem = this.get('valuePElem');
    valuePElem.blur();

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.textinput.Inst.defineMethod('focus',
function(moveAction) {

    /**
     * @name focus
     * @synopsis Focuses the receiver for keyboard input.
     * @param {Constant} moveAction The type of 'move' that the user requested.
     *     This can be one of the following:
     *          TP.FIRST
     *          TP.LAST
     *          TP.NEXT
     *          TP.PREVIOUS
     *          TP.FIRST_IN_GROUP
     *          TP.LAST_IN_GROUP
     *          TP.FIRST_IN_NEXT_GROUP
     *          TP.FIRST_IN_PREVIOUS_GROUP
     *          TP.FOLLOWING
     *          TP.PRECEDING.
     * @returns {TP.xctrls.textinput} The receiver.
     * @todo
     */

    var valuePElem;

    this.callNextMethod();

    valuePElem = this.get('valuePElem');
    valuePElem.focus();

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.textinput.Inst.defineMethod('getDisplayValue',
function() {

    /**
     * @name getDisplayValue
     * @synopsis Gets the display, or visual, value of the receiver's node. This
     *     is the value the HTML, or other UI tag, is actually displaying to the
     *     user at the moment.
     * @returns {Object} The visual value of the receiver's UI node.
     */

    var valuePElem;

    valuePElem = this.get('valuePElem');

    return valuePElem.value;
});

//  ------------------------------------------------------------------------

TP.xctrls.textinput.Inst.defineMethod('setAttrDisabled',
function(beDisabled) {

    /**
     * @name setAttrDisabled
     * @synopsis The setter for the receiver's disabled state.
     * @param {Boolean} beDisabled Whether or not the receiver is in a disabled
     *     state.
     * @returns {Boolean} Whether the receiver's state is disabled.
     */

    var valuePElem;

    valuePElem = this.get('valuePElem');

    if (TP.isTrue(beDisabled)) {
        valuePElem.setAttribute('disabled', true);
        valuePElem.setAttribute('pclass:disabled', 'true');
    } else {
        valuePElem.removeAttribute('disabled');
        valuePElem.removeAttribute('pclass:disabled');
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.xctrls.textinput.Inst.defineMethod('setDisplayValue',
function(aValue) {

    /**
     * @name setDisplayValue
     * @synopsis Sets the display, or visual, value of the receiver's node. The
     *     value provided to this method is typically already formatted using
     *     the receiver's display formatters (if any). You don't normally call
     *     this method directly, instead call setValue() and it will ensure
     *     proper display formatting.
     * @param {Object} aValue The value to set.
     * @returns {TP.xctrls.textinput} The receiver.
     */

    var valuePElem;

    valuePElem = this.get('valuePElem');

    valuePElem.value = aValue;

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
