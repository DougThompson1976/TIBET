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
 * @type {TP.sherpa.extruder}
 */

//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('sherpa.extruder');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineAttribute('$mouseHandler');

TP.sherpa.extruder.Inst.defineAttribute('$currentDNDTarget');

TP.sherpa.extruder.Inst.defineAttribute('$extruderStyleElement');
TP.sherpa.extruder.Inst.defineAttribute('$extrudedDescendantsRule');

TP.sherpa.extruder.Inst.defineAttribute('xRotation');
TP.sherpa.extruder.Inst.defineAttribute('yRotation');
TP.sherpa.extruder.Inst.defineAttribute('spread');

TP.sherpa.extruder.Inst.defineAttribute('targetTPElem');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('init',
function() {

    /**
     * @method init
     * @summary Initialize the instance.
     * @returns {TP.core.Sherpa} The receiver.
     */

    this.callNextMethod();

    this.set('xRotation', 0);
    this.set('yRotation', 0);

    this.set('spread', 50);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('activateMouseHandler',
function() {

    var topLevelElem,
        doc,
        handler,

        thisArg,

        lastMouseMoveEvent,
        initialMousePosition,

        initialX,
        initialY,

        mouse;

    topLevelElem = TP.unwrap(this.get('targetTPElem'));

    doc = TP.nodeGetDocument(topLevelElem);

    thisArg = this;

    lastMouseMoveEvent = TP.core.Mouse.get('lastMove');
    initialMousePosition = TP.eventGetPageXY(lastMouseMoveEvent);

    initialX = initialMousePosition.at(0);
    initialY = initialMousePosition.at(1);

    mouse = {};
    mouse.start = {x: initialX, y: initialY};

    function forward(v1, v2) {
        return v1 >= v2 ? true : false;
    }

    handler = function(e) {

        var currentMousePosition,

            currentX,
            currentY,

            scaleFactor,

            computedX,
            computedY;

        currentMousePosition = TP.eventGetPageXY(e);
        currentX = currentMousePosition.at(0);
        currentY = currentMousePosition.at(1);

        if (!mouse.last) {
            mouse.last = mouse.start;
        } else {
            if (forward(mouse.start.x, mouse.last.x) !==
                forward(mouse.last.x, currentX)) {
                mouse.start.x = mouse.last.x;
            }
            if (forward(mouse.start.y, mouse.last.y) !==
                forward(mouse.last.y, currentY)) {
                mouse.start.y = mouse.last.y;
            }
        }

        scaleFactor = 2;

        computedX = thisArg.get('xRotation') +
                    parseInt((mouse.start.y - currentY) / scaleFactor, 10);

        computedY = thisArg.get('yRotation') -
                    parseInt((mouse.start.x - currentX) / scaleFactor, 10);

        thisArg.set('xRotation', computedX);
        thisArg.set('yRotation', computedY);

        thisArg.updateTargetElementStyle();

        mouse.last.x = currentX;
        mouse.last.y = currentY;
    };

    doc.addEventListener('mousemove', handler, true);

    this.set('$mouseHandler', handler);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('deactivateMouseHandler',
function() {

    var topLevelElem,
        doc,
        handler;

    topLevelElem = TP.unwrap(this.get('targetTPElem'));

    doc = TP.nodeGetDocument(topLevelElem);

    handler = this.get('$mouseHandler');

    doc.removeEventListener('mousemove', handler, true);

    this.set('$mouseHandler', null);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('extrude',
function() {

    var win,
        doc,
        body,

        extruderStyleElement,

        descendantRule;

    win = TP.sys.getUICanvas().getNativeWindow();
    doc = win.document;

    body = doc.body;

    this.set('targetTPElem', TP.wrap(body));

    this.setupTargetElement();

    extruderStyleElement = this.get('$extruderStyleElement');

    if (!TP.isElement(extruderStyleElement)) {

        extruderStyleElement = TP.documentAddCSSElement(
            doc,
            TP.uc('~TP.sherpa.extruder/TP.sherpa.extruder.css').getLocation(),
            true);

        this.set('$extruderStyleElement', extruderStyleElement);

        descendantRule = TP.styleSheetGetStyleRulesMatching(
                                extruderStyleElement.sheet,
                                '.extruded *');

        this.set('$extrudedDescendantsRule', descendantRule.first());
    } else {
        extruderStyleElement.disabled = false;
    }

    this.updateTargetElementStyle();
    this.updateExtrudedDescendantStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('extrudeIn',
function() {

    this.set('spread', this.get('spread') - 5);
    this.updateExtrudedDescendantStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('extrudeOut',
function() {

    this.set('spread', this.get('spread') + 5);
    this.updateExtrudedDescendantStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('rotateDown',
function() {

    this.set('xRotation', this.get('xRotation') - 5);
    this.updateTargetElementStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('rotateLeft',
function() {

    this.set('yRotation', this.get('yRotation') - 5);
    this.updateTargetElementStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('rotateRight',
function() {

    this.set('yRotation', this.get('yRotation') + 5);
    this.updateTargetElementStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('rotateUp',
function() {

    this.set('xRotation', this.get('xRotation') + 5);
    this.updateTargetElementStyle();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('setupTargetElement',
function() {

    var topLevelElem,
        prevValue;

    topLevelElem = TP.unwrap(this.get('targetTPElem'));

    prevValue = TP.elementPopStyleProperty(topLevelElem, 'transform');

    //  NB: We use isValid(), not isEmpty(), here since an empty String is a
    //  valid CSS value.
    if (TP.isValid(prevValue)) {
        TP.elementSetStyleProperty(topLevelElem, 'transform', prevValue);
    }

    TP.elementAddClass(topLevelElem, 'extruded');

    TP.elementSetAttribute(topLevelElem, 'tibet:ctrl', 'sherpa:extruder', true);
    TP.elementSetAttribute(topLevelElem, 'dnd:accept', 'tofu', true);

    this.observe(this.get('targetTPElem'),
                    TP.ac('TP.sig.DOMDNDTargetOver',
                            'TP.sig.DOMDNDTargetOut'));

    this.observe(TP.ANY, 'TP.sig.DOMDNDTerminate');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('updateExtrudedDescendantStyle',
function() {

    this.get('$extrudedDescendantsRule').style.transform =
                'translate3d(0px, 0px, ' + this.get('spread') + 'px)';

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('updateTargetElementStyle',
function() {

    var xRotation,
        yRotation,

        skewY,

        topLevelElem;

    xRotation = this.get('xRotation');
    yRotation = this.get('yRotation');

    /* eslint-disable no-extra-parens */
    skewY = (this.get('yRotation') / 40) * 10;

    topLevelElem = TP.unwrap(this.get('targetTPElem'));

    TP.elementGetStyleObj(topLevelElem).transform =
        ' rotateX(' + xRotation + 'deg)' +
        ' rotateY(' + yRotation + 'deg)' +
        ' skewY(' + (-1) * skewY + 'deg)';
    /* eslint-enable no-extra-parens */

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineHandler('DOMDNDTargetOver',
function(aSignal) {

    var targetTPElem,
        targetElem;

    targetTPElem = aSignal.getDOMTarget();
    targetElem = TP.unwrap(targetTPElem);

    this.set('$currentDNDTarget', targetElem);

    TP.elementPushAndSetStyleProperty(targetElem, 'background', 'yellow');

    // TP.info('got to target over: ' + TP.lid(targetElem));

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineHandler('DOMDNDTargetOut',
function(aSignal) {

    var targetTPElem,
        targetElem;

    targetTPElem = aSignal.getDOMTarget();
    targetElem = TP.unwrap(targetTPElem);

    TP.elementPopAndSetStyleProperty(targetElem, 'background');

    this.set('$currentDNDTarget', null);

    // TP.info('got to target out: ' + TP.lid(targetElem));

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineHandler('DOMDNDTerminate',
function(aSignal) {

    var targetElem;

    targetElem = this.get('$currentDNDTarget');

    if (TP.isElement(targetElem)) {
        TP.elementPopAndSetStyleProperty(targetElem, 'background');
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('teardownTargetElement',
function() {

    var topLevelElem;

    topLevelElem = TP.unwrap(this.get('targetTPElem'));

    TP.elementPushAndSetStyleProperty(topLevelElem, 'transform', '');

    TP.elementRemoveClass(topLevelElem, 'extruded');

    TP.elementRemoveAttribute(topLevelElem, 'tibet:ctrl');
    TP.elementRemoveAttribute(topLevelElem, 'dnd:accept');

    this.ignore(this.get('targetTPElem'),
                    TP.ac('TP.sig.DOMDNDTargetOver',
                            'TP.sig.DOMDNDTargetOut'));

    this.ignore(TP.ANY, 'TP.sig.DOMDNDTerminate');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.extruder.Inst.defineMethod('unextrude',
function() {

    this.teardownTargetElement();

    this.get('$extruderStyleElement').disabled = true;

    this.set('targetTPElem', null);

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================