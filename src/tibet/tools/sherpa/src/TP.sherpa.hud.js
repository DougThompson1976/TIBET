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
 * @type {TP.sherpa.hud}
 */

//  ------------------------------------------------------------------------

TP.sherpa.Element.defineSubtype('hud');

TP.sherpa.hud.addTraits(TP.core.TemplatedNode);

TP.sherpa.hud.Type.resolveTrait('tagCompile', TP.core.TemplatedNode);

TP.sherpa.hud.Inst.resolveTraits(
        TP.ac('$setAttribute', 'removeAttribute', 'select', 'signal'),
        TP.xctrls.Element);

TP.sherpa.hud.Inst.resolveTraits(
        TP.ac('haloCanBlur', 'haloCanFocus'),
        TP.sherpa.hud);

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.hud.Inst.defineMethod('isVisible',
function() {

    return !TP.bc(this.getAttribute('hidden'));
});

//  ------------------------------------------------------------------------

TP.sherpa.hud.Inst.defineMethod('setup',
function() {

    /**
     * @method setup
     */

    /*
    var toolbarElem;

    //  Set up the console output toolbar
    toolbarElem = TP.byId('SherpaConsoleOutputToolbar', this.getNativeWindow());
    this.observe(toolbarElem,
        'TP.sig.DOMClick',
        function(aSignal) {
            TP.byId('SherpaConsole', this.getNativeWindow()).
                    toggleOutputMode(
                        TP.elementGetAttribute(aSignal.getTarget(), 'mode'));
        }.bind(this));
    */

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.hud.Inst.defineMethod('setAttrHidden',
function(beHidden) {

    /**
     * @method setAttrHidden
     * @abstract
     * @returns {TP.sherpa.hud} The receiver.
     */

    var drawerElement,

        //toolbarElem,

        drawerFinishedFunc;

    if (TP.bc(this.getAttribute('hidden')) === beHidden) {
        return this;
    }

    drawerElement = TP.byId('south', this.getNativeWindow(), false);

    if (TP.isTrue(beHidden)) {

        //  We remove our 'south's 'no_transition' class so that it no longer
        //  'immediately snaps' like it needs to do during user interaction.
        TP.elementRemoveClass(drawerElement, 'no_transition');

        TP.elementGetStyleObj(drawerElement).height = '';

        /*
        toolbarElem = TP.byId('SherpaConsoleOutputToolbar',
                                        this.getNativeWindow());
        toolbarElem.toggle('hidden');
        toolbarElem = TP.byId('SherpaConsoleCommandToolbar',
                                        this.getNativeWindow());
        toolbarElem.toggle('hidden');
        */

        this.hideAllHUDDrawers();

        this.getNativeWindow().focus();
    } else {

        (drawerFinishedFunc = function(aSignal) {
            drawerFinishedFunc.ignore(
                drawerElement, 'TP.sig.DOMTransitionEnd');

            //  We add our 'south's 'no_transition' class so that during
            //  user interaction, resizing this drawer will be immediate.
            TP.elementAddClass(drawerElement, 'no_transition');

            /*
            toolbarElem = TP.byId('SherpaConsoleOutputToolbar',
                                            this.getNativeWindow());
            toolbarElem.toggle('hidden');
            toolbarElem = TP.byId('SherpaConsoleCommandToolbar',
                                            this.getNativeWindow());
            toolbarElem.toggle('hidden');
            */

        }.bind(this)).observe(drawerElement, 'TP.sig.DOMTransitionEnd');

        this.showAllHUDDrawers();
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.sherpa.hud.Inst.defineMethod('hideAllHUDDrawers',
function() {

    /**
     * @method hideAllHUDDrawers
     * @returns {TP.sherpa.hud} The receiver.
     * @abstract
     */

    var win,

        hudDrawers,
        centerElem;

    win = this.getNativeWindow();
    hudDrawers = TP.wrap(TP.byCSSPath('.framing', win));

    hudDrawers.perform(
        function(aHUDDrawer) {
            aHUDDrawer.setAttrHidden(true);
        });

    centerElem = TP.byId('center', win, false);

    TP.elementAddClass(centerElem, 'fullscreen');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.hud.Inst.defineMethod('showAllHUDDrawers',
function() {

    /**
     * @method showAllHUDDrawers
     * @returns {TP.sherpa.hud} The receiver.
     * @abstract
     */

    var win,

        hudDrawers,
        centerElem;

    win = this.getNativeWindow();
    hudDrawers = TP.wrap(TP.byCSSPath('.framing', win));

    hudDrawers.perform(
        function(aHUDDrawer) {
            aHUDDrawer.setAttrHidden(false);
        });

    centerElem = TP.byId('center', win, false);

    TP.elementRemoveClass(centerElem, 'fullscreen');

    return this;
});

//  ========================================================================
//  TP.sherpa.huddrawer
//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('sherpa:huddrawer');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
