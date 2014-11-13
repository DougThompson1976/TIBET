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
 */

//  ========================================================================
//  TP.core.ApplicationTag
//  ========================================================================

/**
 * @type {TP.core.ApplicationTag}
 * @synopsis TP.core.ApplicationTag is the common supertype of the
 *     TP.tibet.app and TP.tibet.sherpa tag types.
 */

//  ------------------------------------------------------------------------

TP.core.ElementNode.defineSubtype('ApplicationTag');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.ApplicationTag.Inst.defineMethod('getApplicationType',
function() {

    /**
     * @name getApplicationType
     * @synopsis Returns the application type that the singleton Application
     *     instance will be created from.
     * @description This method looks for a 'tibet:appctrl' attribute on the
     *     receiver and, if present, will try to resolve the value of that
     *     attribute to a TIBET type. If the attribute is missing or a type
     *     cannot be found, the standard TP.core.Application type will be
     *     returned
     * @returns {TP.lang.RootObject.<TP.core.Application>} A
     *     TP.core.Application subtype type object to create the singleton
     *     Application object from or TP.core.Application if none can be found.
     */

    var typeName,
        type;

    if (TP.notEmpty(typeName = this.getAttribute('tibet:appctrl'))) {
        if (TP.isType(type = TP.sys.require(typeName))) {
            return type;
        } else {
            TP.ifWarn() ?
                TP.warn('Unable to load application controller type: ' +
                            typeName,
                        TP.LOG) : 0;
        }
    }

    return TP.sys.require('TP.core.Application');
});

//  ========================================================================
//  TP.tibet.app
//  ========================================================================

/**
 * @type {TP.tibet.app}
 * @synopsis TP.tibet.app represents the 'non-Sherpa' application tag. It is
 *     usually generated by the TP.tibet.root tag type if Sherpa is not loaded
 *     or disabled.
 */

//  ------------------------------------------------------------------------

TP.core.ApplicationTag.defineSubtype('tibet:app');

//  ------------------------------------------------------------------------

TP.tibet.app.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @name tagAttachDOM
     * @synopsis Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    // TODO: The UICANVAS should be set to be the UIROOT here.

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.tibet.app.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @name tagCompile
     * @synopsis Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @description In this type, this method generates either a 'tibet:app' or
     *     a 'tibet:sherpa' tag, depending on whether or not the current boot
     *     environment is set to 'development' or not.
     * @param {TP.sig.ShellRequest} aRequest The request containing command
     *     input for the shell.
     * @returns {null}
     */

    var elem,
        name,
        newElem;

    //  Make sure that we have an element to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    if (TP.notEmpty(elem.getAttribute('tibet:appctrl'))) {
        return this.callNextMethod();
    }

    name = TP.sys.cfg('project.name');

    newElem = TP.xhtmlnode(
        '<div tibet:sourcetag="tibet:app">' +
            '<h1 class="tag-defaulted">' +
                'Application type for: ' + name + ' not found. ' +
                '&lt;tibet:root/&gt; defaulted to &lt;tibet:app/&gt;' +
            '</h1>' +
        '</div>');

    TP.elementReplaceWith(elem, newElem);

    return;
});

//  ========================================================================
//  TP.tibet.root
//  ========================================================================

/**
 * @type {TP.tibet.root}
 * @synopsis TP.tibet.root represents the tag placed in 'UIROOT' pages (i.e. the
 *     root page of the system). Depending on whether the Sherpa project is
 *     loaded/disabled, this tag will generate either a 'tibet:app' tag or a
 *     'tibet:sherpa' tag to handle the main UI.
 */

//  ------------------------------------------------------------------------

TP.core.ElementNode.defineSubtype('tibet:root');

//  ------------------------------------------------------------------------

TP.tibet.root.Type.defineMethod('tagCompile',
function(aRequest) {

    /**
     * @name tagCompile
     * @synopsis Convert the receiver into a format suitable for inclusion in a
     *     markup DOM.
     * @description In this type, this method generates either a 'tibet:app' or
     *     a 'tibet:sherpa' tag, depending on whether or not the current boot
     *     environment is set to 'development' or not.
     * @param {TP.sig.ShellRequest} aRequest The request containing command
     *     input for the shell.
     * @returns {Element} The new element.
     */

    var elem,

        cfg,
        opts,

        profile,
        type,
        name,

        newElem;

    //  Make sure that we have an element to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    //  Build up a list of tag names to check. We'll use the first one we have a
    //  matching type for.
    opts = TP.ac();

    cfg = TP.sys.cfg('tibet.apptag');
    if (TP.notEmpty(cfg)) {
        opts.push(cfg);
    }

    cfg = TP.sys.cfg('project.name');
    if (TP.notEmpty(cfg)) {
        opts.push(cfg + ':app');
    }

    profile = TP.sys.cfg('boot.profile');

    //  If the system is configured to run the sherpa, then push its tag into
    //  the list for consideration.
    if (TP.sys.cfg('tibet.sherpa') === true) {
        opts.unshift('tibet:sherpa');
    }

    //  When in doubt at least render something :)
    opts.push('tibet:app');

    //  Keep string for error reporting.
    cfg = opts.join();

    while (TP.notValid(type) && TP.notEmpty(name = opts.shift())) {
        type = TP.sys.getTypeByName(name, false);
    }

    if (TP.notValid(type)) {
        this.raise('TypeNotFound', 'Expected one of: ' + cfg);
        return;
    }

    newElem = TP.elementBecome(elem, name);

    //  We're changing out the tag entirely, so remove any evidence via the
    //  tibet:sourcetag reference.
    TP.elementRemoveAttribute(newElem, 'tibet:sourcetag', true);

    return newElem;
});

//  ========================================================================
//  TP.core.TemplatedApplication
//  ========================================================================

TP.core.ApplicationTag.defineSubtype('TP.core.TemplatedApplicationTag');

TP.core.TemplatedApplicationTag.addTraitsFrom(TP.core.TemplatedNode);

TP.core.TemplatedApplicationTag.executeTraitResolution();

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
