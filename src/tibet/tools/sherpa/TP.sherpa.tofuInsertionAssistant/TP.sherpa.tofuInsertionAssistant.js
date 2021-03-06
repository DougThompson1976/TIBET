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
 * @type {TP.sherpa.tofuInsertionAssistant}
 */

//  ------------------------------------------------------------------------

TP.core.CustomTag.defineSubtype('sherpa.tofuInsertionAssistant');

//  Note how this property is TYPE_LOCAL, by design.
TP.sherpa.tofuInsertionAssistant.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineAttribute('head',
    TP.cpc('> .head', TP.hc('shouldCollapse', true)));

TP.sherpa.tofuInsertionAssistant.Inst.defineAttribute('body',
    TP.cpc('> .body', TP.hc('shouldCollapse', true)));

TP.sherpa.tofuInsertionAssistant.Inst.defineAttribute('foot',
    TP.cpc('> .foot', TP.hc('shouldCollapse', true)));

TP.sherpa.tofuInsertionAssistant.Inst.defineAttribute('generatedTag',
    TP.cpc('> .foot > #generatedTag', TP.hc('shouldCollapse', true)));

TP.sherpa.tofuInsertionAssistant.Inst.defineAttribute('data');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineHandler('DialogCancel',
function(anObject) {

    /**
     * @method handleDialogCancel
     * @summary Handles when the user has 'canceled' the dialog (i.e. wants to
     *     proceed without taking any action).
     * @param {TP.sig.DialogCancel} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.tsh.CommandAssistant} The receiver.
     */

    var modelURI;

    //  We observed the model URI when we were set up - we need to ignore it now
    //  on our way out.
    modelURI = TP.uc('urn:tibet:tofuInsertionAssistant_source');
    this.ignore(modelURI, 'ValueChange');

    //  Focus and set the cursor to the end of the Sherpa's input cell after
    //  1000ms
    setTimeout(
        function() {
            var consoleGUI;

            consoleGUI =
                TP.bySystemId('SherpaConsoleService').get('$consoleGUI');

            consoleGUI.focusInput();
            consoleGUI.setInputCursorToEnd();
        }, 1000);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineHandler('DialogOk',
function(anObject) {

    /**
     * @method handleDialogOk
     * @summary Handles when the user has 'ok-ed' the dialog (i.e. wants to
     *     proceed by taking the default action).
     * @param {TP.sig.DialogOk} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.tsh.CommandAssistant} The receiver.
     */

    var modelURI,

        result,
        data,
        info,

        val,

        tagName,
        tagType,

        autodefineMissingTags,

        tagParts,
        tagXmlns,
        currentDefaultXmlns,

        targetElem,
        targetTPElem,

        newTPElem,
        newElem;

    //  We observed the model URI when we were set up - we need to ignore it now
    //  on our way out.
    modelURI = TP.uc('urn:tibet:tofuInsertionAssistant_source');
    this.ignore(modelURI, 'ValueChange');

    result = TP.uc('urn:tibet:tofuInsertionAssistant_source').
                                                getResource().get('result');

    if (TP.notValid(result)) {
        return this;
    }

    if (TP.notValid(data = result.get('data'))) {
        return this;
    }

    info = TP.hc(data).at('info');

    //  If the user entered a tag name, make sure it is prefixed, defaulting to
    //  'html:' if they didn't supply it. This takes precedence over the
    //  'chosen' (from the list) tag name.
    if (TP.notEmpty(val = info.at('enteredTagName'))) {
        tagName = val;

        if (!TP.regex.HAS_COLON.test(tagName)) {
            tagName = 'html:' + tagName;
        }

        //  Make sure that if the tagName resolves to a type, that that type is
        //  a subtype of TP.core.ElementNode
        tagType = TP.sys.getTypeByName(tagName);

        if (TP.isType(tagType)) {

            //  If the resolved type is not a subtype of TP.core.ElementNode,
            //  then it's an error. Warn the user and return.
            if (!TP.isSubtypeOf(tagType, TP.core.ElementNode)) {
                TP.alert('Type matching tag: ' +
                            tagName +
                            ' is not an Element.' +
                            ' Element not inserted.');

                return this;
            }
        }

    } else if (TP.notEmpty(val = info.at('chosenTagName'))) {
        //  After checking for an entered tag name, see if one was chosen from
        //  the list.
        tagName = val;
    } else {

        //  No entered tag name and nothing chosen. Can't proceed - exit here.
        //  TODO: Need an error message here.
        return this;
    }

    targetElem = this.get('data').at('insertionPoint');
    if (!TP.isElement(targetElem)) {
        //  No insertion point? Exit here.
        //  TODO: Raise an exception
        return this;
    }

    //  If the tagName has a colon, then we try to match its namespace to the
    //  namespace of the insertion target. If they're the same, then we insert
    //  an Element with that tag name, minus its prefix.
    if (TP.regex.HAS_COLON.test(tagName)) {

        //  Grab the namespace of the inserted tag.
        tagParts = tagName.split(':');
        tagXmlns = TP.w3.Xmlns.getPrefixURI(tagParts.first());

        //  Grab the namespaces of the element at the insertion point.
        currentDefaultXmlns = TP.elementGetDefaultXMLNS(targetElem);

        //  If they're the same, then strip off the prefix, but add an
        //  'xmlns="..."' with that namespace so that the element goes into the
        //  correct namespace.
        if (tagXmlns === currentDefaultXmlns) {
            tagName = tagName.slice(tagName.indexOf(':') + 1);
            tagName += ' xmlns="' + currentDefaultXmlns + '"';
        }
    }

    targetTPElem = TP.wrap(targetElem);

    //  If the user has entered a tag that we don't know about, we force the
    //  system to autodefine missing tags here.
    autodefineMissingTags = TP.sys.cfg('sherpa.autodefine_missing_tags');
    TP.sys.setcfg('sherpa.autodefine_missing_tags', true);

    //  Go ahead and insert the content.
    newTPElem = targetTPElem.insertContent(
                        '<' + tagName + '/>',
                        info.at('insertionPosition'));

    //  Put the autodefine setting back to what it was.
    TP.sys.setcfg('sherpa.autodefine_missing_tags', autodefineMissingTags);

    newElem = TP.unwrap(newTPElem);
    newElem[TP.INSERTION_POSITION] = info.at('insertionPosition');
    newElem[TP.SHERPA_MUTATION] = TP.INSERT;

    //  Set up a timeout to delete those flags after a set amount of time
    setTimeout(
        function() {
            delete newElem[TP.INSERTION_POSITION];
            delete newElem[TP.SHERPA_MUTATION];
        }, TP.sys.cfg('sherpa.mutation_flag_clear_timeout', 5000));

    //  Focus and set the cursor to the end of the Sherpa's input cell after
    //  1000ms
    setTimeout(
        function() {
            var consoleGUI;

            consoleGUI =
                TP.bySystemId('SherpaConsoleService').get('$consoleGUI');

            consoleGUI.focusInput();
            consoleGUI.setInputCursorToEnd();
        }, 1000);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineHandler('ValueChange',
function(aSignal) {

    /**
     * @method handleValueChange
     * @summary Handles when the user changes the value of the underlying model.
     * @param {ValueChange} aSignal The signal that caused this handler to trip.
     * @returns {TP.tsh.CommandAssistant} The receiver.
     */

    var result,
        data,
        typeInfo,
        str;

    result = TP.uc('urn:tibet:tofuInsertionAssistant_source').getResource().get('result');

    if (TP.notValid(result)) {
        return this;
    }

    if (TP.notValid(data = result.get('data'))) {
        return this;
    }

    typeInfo = TP.hc(data).at('info');

    str = this.generateTag(typeInfo);
    this.get('generatedTag').setTextContent(str);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineMethod('generateTag',
function(info) {

    /**
     * @method generateTag
     * @summary Generates the tag text that will be used to create a new Element
     *     and insert it if user dismisses the assistant by clicking 'ok'.
     * @param {TP.core.Hash} info The hash containing the tag information.
     * @returns {TP.sherpa.tofuInsertionAssistant} The receiver.
     */

    var str,

        val;

    str = '<';

    if (TP.notEmpty(val = info.at('enteredTagName'))) {
        str += val;
    } else if (TP.notEmpty(val = info.at('chosenTagName'))) {
        str += val;
    } else {
        return '';
    }

    if (TP.notEmpty(val = info.at('tagAttrs'))) {
        val.forEach(
            function(attrInfo) {
                var hash;

                hash = TP.hc(attrInfo);

                str +=
                    ' ' + hash.at('tagAttrName') +
                    '=' +
                    '"' + hash.at('tagAttrValue') + '"' +
                    ' ';
            });

        str = str.slice(0, -1);
    }

    str += '/>';

    return str;
});

//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineMethod('generatePathData',
function(anElement) {

    /**
     * @method generatePathData
     * @summary Generates the data that will be used to display the path from
     *     the top-level of the Element's document down through the descendant
     *     chain to the supplied Element.
     * @param {Element} anElement The element to generate the path to.
     * @returns {TP.sherpa.tofuInsertionAssistant} The receiver.
     */

    var targetTPElem,

        nodes,

        info;

    targetTPElem = TP.wrap(anElement);

    //  Get the supplied element's ancestor chain and build a list from that.
    nodes = targetTPElem.getAncestors();

    //  Unshift the supplied element onto the front.
    nodes.unshift(targetTPElem);

    //  Reverse the list so that the top-most anscestor is first and the
    //  supplied element is last.
    nodes.reverse();

    info = TP.ac();

    //  Concatenate the filtered child elements onto the list.
    nodes.perform(
        function(aNode) {
            var node;

            node = TP.canInvoke(aNode, 'getNativeNode') ?
                                    aNode.getNativeNode() :
                                    aNode;

            if (!TP.isElement(node)) {
                return;
            }

            info.push(TP.elementGetFullName(node));
        });

    return info;
});

//  ------------------------------------------------------------------------

TP.sherpa.tofuInsertionAssistant.Inst.defineMethod('setData',
function(anObj) {

    /**
     * @method setData
     * @summary Sets the receiver's data object to the supplied object.
     * @param {Object} aDataObject The object to set the receiver's internal
     *     data to.
     * @returns {TP.sherpa.tofuInsertionAssistant} The receiver.
     */

    var typesURI,
        typesObj,

        appTagNames,

        typeData,

        modelObj,
        newInsertionInfo,

        modelURI,

        insertionPosition,
        insertionPointElem,

        breadcrumbTPElem,
        breadcrumbData;

    this.$set('data', anObj);

    //  ---

    typesURI = TP.uc('urn:tibet:tagtypelist');

    typesObj = TP.ac();

    appTagNames = TP.ac();

    //  Application tags
    APP.getSubNamespaceNames().perform(
        function(aSubnamespaceName) {

            var localName;

            //  Need to slice off the 'APP.'
            localName = aSubnamespaceName.slice(4);

            //  We don't want types in the 'APP.meta' namespace.
            if (localName !== 'meta') {
                appTagNames.push(APP[localName].getTypeNames());
            }
        });

    appTagNames = appTagNames.flatten();

    typesObj.push(TP.GROUPING_PREFIX + ' - app tags');
    typeData = appTagNames.collect(
                    function(name) {
                        return TP.sys.getTypeByName(name);
                    });
    typeData = typeData.filter(
                    function(aType) {
                        return TP.isKindOf(aType, TP.core.ElementNode);
                    });
    typeData = typeData.collect(
                    function(aType) {
                        return aType.getCanonicalName();
                    });
    typeData.sort();
    typesObj.push(typeData);

    //  TIBET tags
    typesObj.push(TP.GROUPING_PREFIX + ' - tibet tags');
    typeData = TP.ac(
                TP.tibet.content,
                TP.tibet.data,
                TP.tibet.service);
    typeData = typeData.collect(
                    function(aType) {
                        return aType.getCanonicalName();
                    });
    typeData.sort();
    typesObj.push(typeData);

    //  XControls tags
    typesObj.push(TP.GROUPING_PREFIX + ' - xctrls tags');

    typeData = TP.ac(
                TP.xctrls.button,
                TP.xctrls.buttonitem,
                TP.xctrls.checkitem,
                TP.xctrls.hint,
                TP.xctrls.list,
                TP.xctrls.panelbox,
                TP.xctrls.popup,
                TP.xctrls.radioitem,
                TP.xctrls.tabbar,
                TP.xctrls.table,
                TP.xctrls.textitem);

    typeData = typeData.collect(
                    function(item) {
                        return item.getCanonicalName();
                    });
    typeData.sort();
    typesObj.push(typeData);

    //  XHTML tags
    typesObj.push(TP.GROUPING_PREFIX + ' - xhtml tags');
    typeData = TP.html.Attrs.getSubtypes(true);
    typeData = typeData.collect(
                    function(item) {
                        return item.getCanonicalName();
                    });
    typeData.sort();
    typesObj.push(typeData);

    //  SVG tags
    typesObj.push(TP.GROUPING_PREFIX + ' - svg tags');
    typeData = TP.svg.Shape.getSubtypes(true);
    typeData = typeData.collect(
                    function(item) {
                        return item.getCanonicalName();
                    });
    typeData.sort();
    typesObj.push(typeData);


    //  Flatten the types information and make sure it's not an origin set.
    typesObj = typesObj.flatten();
    typesObj.isOriginSet(false);

    typesObj = typesObj.collect(
                function(entry) {
                    return TP.ac(entry, entry);
                });

    //  Set the resource of the types URI to the computed object containing our
    //  types, telling the URI to go ahead and signal change to kick things off.
    typesURI.setResource(typesObj, TP.hc('signalChange', true));

    //  ---

    //  Build the model object.
    modelObj = TP.hc();

    //  Register a hash to be placed at the top-level 'info' slot in the model.
    newInsertionInfo = TP.hc();
    modelObj.atPut('info', newInsertionInfo);

    //  The data for the chosen tag or entered tag names
    newInsertionInfo.atPut('chosenTagName', '');
    newInsertionInfo.atPut('enteredTagName', '');

    //  If we were handed an insertion position, then use it. Otherwise, default
    //  it to TP.BEFORE_END
    insertionPosition = anObj.at('insertionPosition');
    if (TP.isEmpty(insertionPosition)) {
        insertionPosition = TP.BEFORE_END;
    }
    newInsertionInfo.atPut('insertionPosition', insertionPosition);

    newInsertionInfo.atPut('tagAttrs', TP.ac());

    //  Set up a model URI and observe it for change ourself. This will allow us
    //  to regenerate the tag representation as the model changes.
    modelURI = TP.uc('urn:tibet:tofuInsertionAssistant_source');
    this.observe(modelURI, 'ValueChange');

    //  Construct a JSONContent object around the model object so that we can
    //  bind to it using the more powerful JSONPath constructs
    modelObj = TP.core.JSONContent.construct(TP.js2json(modelObj));

    //  Set the resource of the model URI to the model object, telling the URI
    //  that it should observe changes to the model (which will allow us to get
    //  notifications from the URI which we're observing above) and to go ahead
    //  and signal change to kick things off.
    modelURI.setResource(
        modelObj,
        TP.hc('observeResource', true, 'signalChange', true));

    insertionPointElem = anObj.at('insertionPoint');
    newInsertionInfo.atPut('insertionPoint', insertionPointElem);

    //  If we were handed an Element as an insertion point, then we generate the
    //  data that will show a path to it.
    if (TP.isElement(insertionPointElem)) {
        breadcrumbData = this.generatePathData(insertionPointElem);
    } else {
        breadcrumbData = TP.ac();
    }

    //  Set the value of the breadcrumb to that data.
    breadcrumbTPElem = TP.byId('tofuInsertionAssistant_InsertionBreadcrumb',
                                this.getNativeNode());
    breadcrumbTPElem.setValue(breadcrumbData);

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
