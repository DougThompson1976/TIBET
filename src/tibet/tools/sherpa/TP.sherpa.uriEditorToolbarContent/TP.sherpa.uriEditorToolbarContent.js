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
 * @type {TP.sherpa.uriEditorToolbarContent}
 */

//  ------------------------------------------------------------------------

TP.sherpa.TemplatedTag.defineSubtype('uriEditorToolbarContent');

TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('$editor');
TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('$editorURI');

TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('applyButton',
    TP.cpc('> button[action="apply"]', TP.hc('shouldCollapse', true)));

TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('detachMark',
    TP.cpc('> .detach_mark', TP.hc('shouldCollapse', true)));

TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('pushButton',
    TP.cpc('> button[action="push"]', TP.hc('shouldCollapse', true)));

TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('revertButton',
    TP.cpc('> button[action="revert"]', TP.hc('shouldCollapse', true)));

TP.sherpa.uriEditorToolbarContent.Inst.defineAttribute('refreshButton',
    TP.cpc('> button[action="refresh"]', TP.hc('shouldCollapse', true)));

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.uriEditorToolbarContent.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have an Element to work from
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception.
        return;
    }

    tpElem = TP.wrap(elem);

    tpElem.setup();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.uriEditorToolbarContent.Type.defineMethod('tagDetachDOM',
function(aRequest) {

    /**
     * @method tagDetachDOM
     * @summary Tears down runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem;

    //  Make sure that we have an Element to work from
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception.
        return;
    }

    tpElem = TP.wrap(elem);

    tpElem.ignore(tpElem.$get('$editor'), 'DirtyChange');

    //  this makes sure we maintain parent processing - but we need to do it
    //  last because it nulls out our wrapper reference.
    this.callNextMethod();

    return;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.uriEditorToolbarContent.Inst.defineHandler('DirtyChange',
function(aSignal) {

    /**
     * @method handleDirtyChange
     * @summary Handles when the editor has been dirtied and we need to update
     *     ourself based on that change.
     * @param {TP.sig.DirtyChange} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.uriEditorToolbarContent} The receiver.
     */

    //  Our editor changed - refresh our controls.
    this.refreshControls();

    aSignal.stopPropagation();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.uriEditorToolbarContent.Inst.defineMethod('refreshControls',
function(editorIsDirty, uriIsDirty) {

    /**
     * @method refreshControls
     * @summary Refreshes the toolbar buttons based on the supplied dirty flags.
     * @param {Boolean} [editorIsDirty] Whether or not the editor is dirty. If
     *     not supplied, this defaults by querying the editor directly.
     * @param {Boolean} [uriIsDirty] Whether or not the URI the editor is
     *     editing is dirty. If not supplied, this defaults by querying the URI
     *     directly.
     * @returns {TP.sherpa.uriEditorToolbarContent} The receiver.
     */

    var editorTPElem,
        isDirty;

    editorTPElem = TP.byId(this.getAttribute('tibet:ctrl'),
                            this.getNativeDocument());

    isDirty = editorTPElem.isDirty();
    if (isDirty) {
        this.get('applyButton').removeAttribute('disabled');
        this.get('revertButton').removeAttribute('disabled');
    } else {
        this.get('applyButton').setAttribute('disabled', true);
        this.get('revertButton').setAttribute('disabled', true);
    }

    isDirty = editorTPElem.isSourceDirty();
    if (isDirty) {
        this.get('pushButton').removeAttribute('disabled');
        this.get('refreshButton').removeAttribute('disabled');
    } else {
        this.get('pushButton').setAttribute('disabled', true);
        this.get('refreshButton').setAttribute('disabled', true);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.uriEditorToolbarContent.Inst.defineMethod('setup',
function() {

    /**
     * @method setup
     * @summary Perform the initial setup for the receiver.
     * @returns {TP.sherpa.uriEditorToolbarContent} The receiver.
     */

    var editorTPElem,
        uri;

    //  If the editor is set here, maybe because this toolbar was already in use
    //  someplace. In any case, we want to ignore signals from it before we
    //  reset it.
    if (TP.isValid(this.$get('$editor'))) {
        this.ignore(this.$get('$editor'), 'DirtyChange');
    }

    //  NB: We need to cache references to our editor and it's URI - they might
    //  get detached before we do.

    editorTPElem = TP.byId(this.getAttribute('tibet:ctrl'),
                            this.getNativeDocument());
    this.$set('$editor', editorTPElem, false);

    uri = editorTPElem.get('sourceURI');
    this.$set('$editorURI', uri);

    this.observe(editorTPElem, 'DirtyChange');

    this.refreshControls();

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
