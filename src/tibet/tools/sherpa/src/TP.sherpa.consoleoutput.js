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
 * @type {TP.sherpa.consoleoutputoutput}
 */

//  ------------------------------------------------------------------------

TP.sherpa.TemplatedTag.defineSubtype('consoleoutput');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have an Element to work from
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception.
        return;
    }

    //  Set up some instance variables for this instance of console output.
    TP.wrap(elem).set('outputCoalesceRecords', TP.hc());

    return;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineAttribute('rawOutEntryTemplate');

TP.sherpa.consoleoutput.Inst.defineAttribute('outputCoalesceRecords');
TP.sherpa.consoleoutput.Inst.defineAttribute('outputCoalesceTimer');

TP.sherpa.consoleoutput.Inst.defineAttribute(
        'wrapper',
        {value: TP.cpc('> .wrapper', TP.hc('shouldCollapse', true))});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  Output management methods
//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('clear',
function() {

    this.get('wrapper').empty();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('getInputStats',
function(aSignal) {

    /**
     * @method getInputStats
     * @param {TP.sig.ShellRequest} aSignal The request that the status is being
     *     updated for.
     * @returns {TP.sherpa.consoleoutput} The receiver.
     */

    var val,
        str;

    //  TODO: Isn't aSignal the same as our signal and, if not, is that an
    //  error?

    //  ---
    //  execution statistics, when available
    //  ---

    //  update the last command execution time
    val = aSignal.get('evaltime');
    str = TP.ifInvalid(val, '0');

    val = aSignal.get('tagtime');
    str += ' | ' + TP.ifInvalid(val, '0');

    val = aSignal.get('exectime');
    str += ' | ' + TP.ifInvalid(val, '0');

    return str;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('getOutputTypeInfo',
function(aSignal) {

    /**
     * @method getOutputTypeInfo
     * @param {TP.sig.ShellRequest} aSignal The request that the status is being
     *     updated for.
     * @returns {TP.sherpa.consoleoutput} The receiver.
     */

    var val,
        str,
        values,
        len,
        startTN,
        wasSame,
        i;

    //  TODO: Isn't aSignal the same as our signal and, if not, is that an
    //  error?

    //  if no action pending then display current result type/id
    if (TP.canInvoke(aSignal, 'getResult')) {
        val = aSignal.getResult();
    }

    if (aSignal.isFailing() || aSignal.didFail()) {
        return 'undefined';
    }

    if (TP.isValid(val)) {

        str = '' + TP.tname(val);

        if (TP.isCollection(val)) {
            if (TP.isEmpty(val)) {
                str += '()';
            } else {

                if (TP.canInvoke(val, 'getValues')) {
                    values = val.getValues();
                } else {
                    // Probably a native collection like HTMLCollection etc.
                    values = TP.ac();
                    len = val.length;
                    for (i = 0; i < len; i++) {
                        values.push(val[i]);
                    }
                }

                len = values.getSize();
                startTN = TP.tname(values.at(0));
                wasSame = true;

                for (i = 1; i < len; i++) {
                    if (TP.tname(values.at(i)) !== startTN) {
                        wasSame = false;
                        break;
                    }
                }

                if (TP.isTrue(wasSame)) {
                    str += '(' + startTN + ')';
                } else {
                    str += '(Object)';
                }

                str += ' (' + len + ')';
            }
        }

        if (TP.isEmpty(str) || str === 'ready') {
            str = 'Object';
        }
    } else if (TP.isNull(val)) {
        str = 'null';
    } else {
        str = 'undefined';
    }

    return str;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('createOutputEntry',
function(uniqueID, dataRecord) {

    /**
     * @method createOutputEntry
     */

    var doc,

        hid,
        hidstr,

        cmdText,

        cssClass,

        inputData,

        resp,
        entryStr,

        insertionPoint,

        outElem;

    doc = this.getNativeDocument();

    if (!TP.isElement(outElem = doc.getElementById(uniqueID))) {

        hid = dataRecord.at('hid');
        hidstr = TP.isEmpty(hid) ? '' : '!' + hid;

        cssClass = dataRecord.at('cssClass');
        cssClass = TP.isEmpty(cssClass) ? '' : cssClass;

        cmdText = TP.ifInvalid(dataRecord.at('cmdText'), '');

        //  If there's ACP in the text, we need to escape it before feeding it
        //  into the template transformation machinery.
        if (TP.regex.HAS_ACP.test(cmdText)) {
            cmdText = cmdText.replace(/\{\{/g, '\\{{').
                                replace(/\}\}/g, '\\}}');
        }

        cmdText = cmdText.asEscapedXML();

        inputData = TP.hc(
                        'id', uniqueID,
                        'inputclass', cssClass,
                        'hid', hidstr,
                        'cmdText', cmdText,
                        'empty', '',
                        'resultType', '',
                        'stats', '&#8230;');

        resp = TP.uc('~ide_root/xhtml/sherpa_console_templates.xhtml' +
                            '#xpath1(//*[@name="consoleEntry"])').transform(
                                inputData,
                                TP.request('async', false));
        entryStr = resp.get('result');

        insertionPoint = TP.unwrap(this.get('wrapper'));

        outElem = TP.xmlElementInsertContent(
                        insertionPoint,
                        TP.xhtmlnode(entryStr),
                        TP.BEFORE_END);

        TP.elementRemoveAttribute(outElem, 'name');
        TP.elementSetAttribute(outElem, 'tibet:noawaken', 'true', true);

    } else {
        //  TODO: Print an error
        //  empty
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('createTiledOutput',
function(cellGroupElem, uniqueID, dataRecord) {

    /**
     * @method createTiledOutput
     */

    var cmdText,

        tileID,

        tileTPElem,

        targetObj,

        shell,
        aspectName,

        defaultAspectObj,

        operationTarget,

        tileContentTPElem,

        curtainTPElem,
        handler;

    cmdText = TP.byCSSPath('.header .content',
                            cellGroupElem,
                            true).getTextContent();

    tileID = uniqueID + '_tile';

    //  We don't supply a parent to the makeTile() call, so it will be placed in
    //  the common tile tier.
    tileTPElem = TP.bySystemId('Sherpa').makeTile(tileID);

    tileTPElem.set('headerText', cmdText);

    targetObj = dataRecord.at('tiledTarget');

    switch (dataRecord.at('tiledOperation')) {

        case TP.EDIT:

            shell = TP.bySystemId('TSH');
            aspectName = shell.getArgument(
                            dataRecord.at('request'), 'tsh:aspect', null, false);
            if (TP.notEmpty(aspectName)) {
                targetObj = TP.getEditingAspectNamed(targetObj, aspectName);
            }

            tileContentTPElem = TP.getEditorTPElement(targetObj);

            if (TP.notValid(tileContentTPElem)) {
                defaultAspectObj = TP.getDefaultEditingAspect(targetObj);
                if (TP.isValid(defaultAspectObj)) {
                    operationTarget = defaultAspectObj;
                    tileContentTPElem = TP.getEditorTPElement(defaultAspectObj);
                }
            } else {
                operationTarget = targetObj;
            }

            break;

        case TP.ASSIST:

            tileContentTPElem = TP.getAssistantTPElement(targetObj);

            break;

        default:
            break;
    }

    if (TP.isValid(tileContentTPElem)) {
        tileContentTPElem = tileTPElem.setContent(tileContentTPElem);

        tileContentTPElem.set('tileTPElem', tileTPElem);

        tileContentTPElem.set('sourceObject', operationTarget);
        tileContentTPElem.set('originalRequest', dataRecord.at('request'));

        tileContentTPElem.awaken();
    }

    if (TP.isTrue(dataRecord.at('tiledModal'))) {

        tileTPElem.set('modal', true);

        if (TP.isValid(
                curtainTPElem = TP.byId('systemCurtain', this.getDocument()))) {
            curtainTPElem.setAttribute('hidden', false);
        }

        //  NB: Do this *before* we observe the 'hidden' state.
        tileTPElem.toggle('hidden');

        handler = function() {
            handler.ignore(tileTPElem, 'HiddenChange');
            curtainTPElem.setAttribute('hidden', true);

            TP.byId('SherpaConsole', TP.win('UIROOT')).focusInput();
        };

        handler.observe(tileTPElem, 'HiddenChange');
    } else {
        tileTPElem.toggle('hidden');
    }

    return tileID;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineHandler('DetachCard',
function(aSignal) {

    var ourWindow,
        testTile;

    ourWindow = this.get('wrapper').getNativeWindow();

    testTile = TP.bySystemId('Sherpa').makeTile(
                        'detailTile',
                        TP.documentGetBody(ourWindow.document));

    testTile.toggle('hidden');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineHandler('ShowTile',
function(aSignal) {

    var tileID,
        tileTPElem;

    if (TP.notEmpty(tileID = aSignal.at('tileID'))) {
        tileID = tileID.unquoted();

        if (TP.isValid(tileTPElem = TP.byId(tileID, this.getDocument()))) {
            tileTPElem.setAttribute('hidden', false);
        }

    } else {
        //  TODO: Log an exception
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('scrollOutputToEnd',
function() {

    /**
     * @method scrollOutputToEnd
     * @summary Adjust the height of the input cell based on its contents.
     * @returns {TP.sherpa.console} The receiver.
     */

    var consoleOutputElem;

    consoleOutputElem = this.getNativeNode();
    consoleOutputElem.scrollTop = consoleOutputElem.scrollHeight;

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.consoleoutput.Inst.defineMethod('updateOutputEntry',
function(uniqueID, dataRecord) {

    /**
     * @method updateOutputEntry
     */

    var doc,
        cellGroupElem,

        typeinfo,
        rawData,
        outputObj,

        tileID,

        outputClass,

        outputData,
        resp,
        outputStr,

        outputCoalesceRecords,
        coalesceRecord,

        coalesceFragment,
        insertionPoint,
        flushTimer,
        updateStats,

        request,

        rawOutEntryTemplate;

    doc = this.getNativeDocument();

    //  If we can't find the output cell that this output was using before
    //  (sometimes outputs like to reuse the same cell - i.e. logging), then
    //  attempt to recreate it.
    if (!TP.isElement(cellGroupElem = doc.getElementById(uniqueID))) {

        //  Note here how we pass in no output data - we'll fill that in below.
        this.createOutputEntry(uniqueID, TP.hc());

        //  If we still couldn't create the cell, then notify with an error
        //  message and bail out.
        if (!TP.isElement(cellGroupElem = doc.getElementById(uniqueID))) {
            TP.ifError() ?
                    TP.error(
                        'Couldn\'t find out cell for: ' + uniqueID) : 0;

            return this;
        }
    }

    typeinfo = dataRecord.at('typeinfo');
    rawData = dataRecord.at('rawData');
    outputObj = dataRecord.at('output');

    //  If we're outputting logging data, add the '.logoutput' class to the
    //  output cell element and set the content of the input line to 'Log'.
    if (typeinfo === 'LOG') {
        TP.elementAddClass(cellGroupElem, 'logoutput');
        TP.nodeSetTextContent(
                TP.byCSSPath('.header', cellGroupElem, true, false),
                'Log');
    }

    //  Grab the output entry template
    if (TP.notValid(rawOutEntryTemplate = this.get('rawOutEntryTemplate'))) {
        resp = TP.uc(
            '~ide_root/xhtml/sherpa_console_templates.xhtml' +
                '#xpath1(//*[@name="raw_outputEntry"])').getResource(
                TP.request('async', false));

        rawOutEntryTemplate = resp.get('result');
        this.set('rawOutEntryTemplate', rawOutEntryTemplate);
    }

    //  If the output text is empty and the user is asking for tiled output,
    //  then created a tile and set the raw data as its source object.
    if (TP.isEmpty(outputObj) && TP.isTrue(dataRecord.at('tiledOutput'))) {

        tileID = this.createTiledOutput(cellGroupElem, uniqueID, dataRecord);

        //  Output a link that will cause the tile to show (if it hasn't been
        //  closed - just hidden).
        outputObj = TP.xhtmlnode(
                        '<a href="#" on:click="' +
                        '{signal: \'ShowTile\', ' +
                        'payload: {tileID: \'' + tileID + '\'}}">' +
                        'Show Tile' +
                        '</a>');
    }

    //  If we're not outputting real output, then set the outputStr to the empty
    //  String and skip executing the output template.
    if ((TP.isEmpty(outputObj) || rawData === TP.TSH_NO_VALUE) &&
            TP.isEmpty(tileID)) {
        outputStr = '';
    } else {
        outputClass = dataRecord.at('cssClass');

        //  Run the output template and fill in the data
        outputData = TP.hc('output', outputObj,
                            'outputclass', outputClass);

        outputStr = rawOutEntryTemplate.transform(outputData);

        if (!TP.isString(outputStr)) {

            //  Something went wrong during templating. The outputData didn't
            //  get converted and now our outputStr is just a reference to
            //  outputData.

            //  Try reprocessing the output since 99% of the errors will be DOM
            //  parse issues meaning something in the data wasn't properly
            //  escaped.
            outputData.atPut('output',
                    TP.boot.$dump(outputData.at('output'), '', true));

            outputStr = rawOutEntryTemplate.transform(outputData);
        }
    }

    updateStats = function(record, groupElem) {

        var statsStr,
            resultTypeStr;

        if (record.at('typeinfo') === 'LOG') {
            return;
        }

        //  Now, update statistics and result type data that was part of the
        //  entry that we inserted before with the input content.
        if (TP.isValid(request = record.at('request'))) {
            statsStr = TP.isEmpty(record.at('stats')) ?
                            this.getInputStats(request) :
                            record.at('stats');
            resultTypeStr = TP.isEmpty(record.at('typeinfo')) ?
                            this.getOutputTypeInfo(request) :
                            record.at('typeinfo');
        } else {
            statsStr = '';
            resultTypeStr = '';
        }

        TP.xmlElementSetContent(
                TP.byCSSPath('.typeinfo', groupElem, true, false),
                TP.xhtmlnode(resultTypeStr));

        TP.xmlElementSetContent(
                TP.byCSSPath('.stats', groupElem, true, false),
                TP.xhtmlnode(statsStr));
    }.bind(this);

    //  For superior performance, we 'coalesce' output. This allows quite a bit
    //  of data to be accumulated in a DocumentFragment and then, every so often
    //  via a timer, be appended to the output element. This avoids a lot of
    //  document reflows for the console output.

    //  There should be an 'output coalescing record' for each piece of data
    //  that we're trying to output. This can be more than one since our results
    //  can be asynchronous and we need to write them to the correct fragment
    //  which will then get appended to the correct output element for that
    //  result set.
    outputCoalesceRecords = this.get('outputCoalesceRecords');
    if (TP.notValid(coalesceRecord = outputCoalesceRecords.at(uniqueID))) {

        //  If we couldn't find an existing coalescing record for the supplied
        //  ID, then we create a coalescing fragment and a record holding it,
        //  the data record and the overall output element.
        coalesceFragment = TP.documentConstructFragment(doc);
        insertionPoint = TP.byCSSPath(
                            '.flex-card', cellGroupElem, true, false);

        outputCoalesceRecords.atPut(
                uniqueID,
                TP.hc('fragment', coalesceFragment,
                        'dataRecord', dataRecord,
                        'insertionPoint', insertionPoint));
    } else {
        //  Otherwise, we're coalescing for output that is already in the
        //  process of being written - just grab the fragment.
        coalesceFragment = coalesceRecord.at('fragment');
    }

    coalesceFragment.appendChild(TP.xhtmlnode(outputStr));

    //  Make sure that we have a coalescing timer set up.
    if (!(flushTimer = this.get('outputCoalesceTimer'))) {
        flushTimer = setTimeout(
            function() {

                //  Iterate over all of the coalescing records, append whatever
                //  is in the fragment onto the output element and update the
                //  cell's statistics.
                outputCoalesceRecords.getValues().forEach(
                    function(record) {
                        record.at('insertionPoint').appendChild(
                                            record.at('fragment'));

                        updateStats(record.at('dataRecord'),
                                    record.at('insertionPoint'));
                    });

                //  Empty the set of coalescing records. We'll generate more the
                //  next time around.
                outputCoalesceRecords.empty();

                this.scrollOutputToEnd();

                flushTimer = null;
                this.set('outputCoalesceTimer', null);
            }.bind(this),
            80);

        this.set('outputCoalesceTimer', flushTimer);
    }

    return this;
});

//  ============================================================================
//  Meta-methods to return common editor subtypes
//  ============================================================================

TP.definePrimitive('getAssistantTPElement',
function(anObject) {

    if (TP.canInvoke(anObject, 'getAssistantTPElement')) {
        return anObject.getAssistantTPElement();
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('getDefaultEditingAspect',
function(anObject) {

    if (TP.canInvoke(anObject, 'getDefaultEditingAspect')) {
        return anObject.getDefaultEditingAspect();
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('getEditingAspectNamed',
function(anObject, anAspectName) {

    if (TP.canInvoke(anObject, 'getEditingAspectNamed')) {
        return anObject.getEditingAspectNamed(anAspectName);
    }

    return anObject;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('getEditorTPElement',
function(anObject) {

    if (TP.canInvoke(anObject, 'getEditorTPElement')) {
        return anObject.getEditorTPElement();
    }

    return null;
});

//  ---

Function.Inst.defineMethod('getEditorTPElement',
function() {

    var methodEditorTPElem;

    if (TP.isMethod(this)) {

        methodEditorTPElem = TP.sherpa.methodeditor.getResourceElement(
                            'template',
                            TP.ietf.Mime.XHTML);

        return methodEditorTPElem;
    }

    return null;
});

//  ---

TP.core.URI.Inst.defineMethod('getEditorTPElement',
function() {

    var uriEditorTPElem;

    uriEditorTPElem = TP.sherpa.urieditor.getResourceElement(
                            'template',
                            TP.ietf.Mime.XHTML);

    return uriEditorTPElem;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
