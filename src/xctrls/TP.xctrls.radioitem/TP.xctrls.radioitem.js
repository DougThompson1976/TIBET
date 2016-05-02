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
 * @type {TP.xctrls.radioitem}
 * @summary Manages radioitem XControls.
 */

//  ------------------------------------------------------------------------

TP.xctrls.TemplatedTag.defineSubtype('xctrls:radioitem');

TP.xctrls.radioitem.addTraits(TP.core.TogglingUIElementNode);

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineAttribute(
    'valuePElem',
    {value: TP.cpc('*[tibet|pelem="value"]', TP.hc('shouldCollapse', true))});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('allowsMultiples',
function() {

    /**
     * @method allowsMultiples
     * @summary Returns false since radio items, by their very nature, don't
     *     allow multiple selection.
     * @returns {Boolean} Whether or not the receiver allows multiple selection.
     */

    return false;
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('getLabelText',
function() {

    /**
     * @method getLabelText
     * @summary Returns the text of the label of the receiver.
     * @returns {String} The receiver's label text.
     */

    var labelValue;

    //  Go after child text of 'xctrls:label'
    labelValue = this.get('string(./xctrls:label)');

    return labelValue;
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('$getMarkupValue',
function() {

    /**
     * @method $getMarkupValue
     * @summary Returns the 'value' of the receiver as authored by user in the
     *     markup. Many times this is represented as a 'value' attribute in the
     *     markup and serves as the default.
     * @returns {String} The markup value of the receiver.
     */

    var textValue;

    //  Go after child text of 'xctrls:value'
    textValue = this.get('string(./xctrls:value)');

    return textValue;
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('$getPrimitiveValue',
function() {

    /**
     * @method $getPrimitiveValue
     * @summary Returns the low-level primitive value stored by the receiver in
     *     internal storage.
     * @returns {String} The primitive value of the receiver.
     */

    var textValue;

    //  Go after child text of 'xctrls:value'
    textValue = this.get('string(./xctrls:value)');

    return textValue;
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('$getVisualToggle',
function() {

    /**
     * @method $getVisualToggle
     * @summary Returns the low-level primitive 'toggle value' used by the
     *     receiver to display a 'checked' state.
     * @returns {Boolean} The low-level primitive 'toggle value' of the
     *     receiver.
     */

    return this.$isInState('pclass:checked');
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('setAttrDisabled',
function(beDisabled) {

    /**
     * @method setAttrDisabled
     * @summary The setter for the receiver's disabled state.
     * @param {Boolean} beDisabled Whether or not the receiver is in a disabled
     *     state.
     * @returns {Boolean} Whether the receiver's state is disabled.
     */

    var valuePElem;

    valuePElem = this.get('valuePElem');

    if (TP.isTrue(beDisabled)) {
        valuePElem.setAttribute('disabled', true, false);
        valuePElem.setAttribute('pclass:disabled', 'true', false);
    } else {
        valuePElem.removeAttribute('disabled');
        valuePElem.removeAttribute('pclass:disabled');
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineMethod('$setVisualToggle',
function(aToggleValue) {

    /**
     * @method $setVisualToggle
     * @summary Sets the low-level primitive 'toggle value' used by the receiver
     *     to display a 'checked' state.
     * @param {Boolean} aToggleValue Whether or not to display the receiver's
     *     'checked' state.
     * @returns {TP.xctrls.radioitem} The receiver.
     */

    this.$isInState('pclass:checked', aToggleValue);

    return this;
});

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Inst.defineHandler('UIDidDeactivate',
function(aSignal) {

    /**
     * @method handleUIDidDeactivate
     * @summary This method is invoked as the radioitem is clicked.
     * @param {TP.sig.UIDidDeactivate} aSignal The signal that caused this
     *     handler to trip.
     */

    this.toggleValue();

    return;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================