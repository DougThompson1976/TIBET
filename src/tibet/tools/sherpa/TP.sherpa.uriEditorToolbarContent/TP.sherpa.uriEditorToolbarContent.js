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
        tpElem,

        editorTPElem,
        uri;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have an Element to work from
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception.
        return;
    }

    tpElem = TP.wrap(elem);

    //  NB: We need to cache references to our editor and it's URI - they might
    //  get detached before we do.

    editorTPElem = TP.byId('inspectorEditor', TP.doc(elem));
    tpElem.$set('$editor', editorTPElem, false);

    uri = editorTPElem.get('sourceURI');
    tpElem.$set('$editorURI', uri);

    //  TODO: Fix this - Arrays of Change signals don't seem to work (maybe
    //  don't expand the name??)
    // tpElem.observe(editorTPElem, TP.ac('DirtyChange', 'SourceURIChange'));

    tpElem.observe(editorTPElem, 'DirtyChange');

    tpElem.refreshControls();

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

    this.refreshControls(
            aSignal.at(TP.NEWVAL),
            aSignal.getSource().get('sourceURI').isDirty());

    aSignal.stopPropagation();

    return this;
}, {
    origin: 'inspectorEditor'
});

//  ------------------------------------------------------------------------

TP.sherpa.uriEditorToolbarContent.Inst.defineMethod('refreshControls',
function(editorIsDirty, uriIsDirty) {

    /**
     * @method tagDetachDOM
     * @summary Tears down runtime machinery for the element in aRequest.
     * @param {Boolean} [editorIsDirty] Whether or not the editor is dirty. If
     *     not supplied, this defaults by querying the editor directly.
     * @param {Boolean} [uriIsDirty] Whether or not the URI the editor is
     *     editing is dirty. If not supplied, this defaults by querying the URI
     *     directly.
     * @returns {TP.sherpa.uriEditorToolbarContent} The receiver.
     */

    var editorTPElem,
        isDirty;

    editorTPElem = TP.byId('inspectorEditor', this.getNativeDocument());

    isDirty = TP.ifInvalid(editorIsDirty, editorTPElem.isDirty());
    if (isDirty) {
        this.get('applyButton').removeAttribute('disabled');
        this.get('revertButton').removeAttribute('disabled');
    } else {
        this.get('applyButton').setAttribute('disabled', true);
        this.get('revertButton').setAttribute('disabled', true);
    }

    isDirty = TP.ifInvalid(uriIsDirty, editorTPElem.get('sourceURI').isDirty());
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
//  end
//  ========================================================================
