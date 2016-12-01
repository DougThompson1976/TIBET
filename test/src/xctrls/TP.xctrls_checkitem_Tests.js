//  ========================================================================
//  xctrls:checkitem
//  ========================================================================

TP.xctrls.checkitem.Type.describe('TP.xctrls.checkitem: manipulation',
function() {

    var unloadURI,
        loadURI,

        windowContext;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            windowContext = this.getDriver().get('windowContext');

            loadURI = TP.uc('~lib_test/src/xctrls/xctrls_checkitem.xhtml');
            this.getDriver().setLocation(loadURI);

            this.startTrackingSignals();
        });

    //  ---

    this.after(
        function() {

            this.stopTrackingSignals();

            //  Unload the current page by setting it to the blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.beforeEach(
        function() {
            //  A short pause for when we're running these in a large group of
            //  tests gives the GUI a chance to update.
            this.thenWait(100);
        });

    //  ---

    this.afterEach(
        function() {
            TP.signal.reset();
        });

    //  ---

    this.it('Focusing', function(test, options) {

        var checkitem;

        checkitem = TP.byId('checkitem1', windowContext);

        //  Change the focus via 'direct' method

        test.getDriver().startSequence().
            sendEvent(TP.hc('type', 'focus'), checkitem).
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(checkitem, 'pclass:focus');

                test.assert.didSignal(checkitem, 'TP.sig.UIFocus');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidFocus');
            });
    });

    //  ---

    this.it('Activation - mouse', function(test, options) {

        var checkitem;

        //  Change the content via 'user' interaction

        checkitem = TP.byId('checkitem1', windowContext);

        //  Individual mousedown/mouseup

        test.getDriver().startSequence().
            mouseDown(checkitem).
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(checkitem, 'pclass:active');

                test.assert.didSignal(checkitem, 'TP.sig.UIActivate');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        test.getDriver().startSequence().
            mouseUp(checkitem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(checkitem, 'pclass:active');

                test.assert.didSignal(checkitem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  click

        test.getDriver().startSequence().
            click(checkitem).
            perform();

        test.then(
            function() {

                //  Don't test the attribute here - it will already have been
                //  removed.

                test.assert.didSignal(checkitem, 'TP.sig.UIActivate');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidActivate');

                test.assert.didSignal(checkitem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidDeactivate');
            });
    });

    //  ---

    this.it('Activation - keyboard', function(test, options) {

        var checkitem;

        //  Change the content via 'user' interaction

        checkitem = TP.byId('checkitem1', windowContext);

        //  Individual keydown/keyup

        test.getDriver().startSequence().
            keyDown(checkitem, 'Enter').
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(checkitem, 'pclass:active');

                test.assert.didSignal(checkitem, 'TP.sig.UIActivate');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        test.getDriver().startSequence().
            keyUp(checkitem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(checkitem, 'pclass:active');

                test.assert.didSignal(checkitem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(checkitem, 'TP.sig.UIDidDeactivate');
            });
    });

    //  ---

    this.it('Disabled behavior', function(test, options) {

        var checkitem;

        //  All of these mechanisms to 'activate' the control should fail - it's
        //  disabled.

        //  Disable it
        checkitem = TP.byId('checkitem1', windowContext);
        checkitem.setAttrDisabled(true);

        //  --- Focus

        test.getDriver().startSequence().
            sendEvent(TP.hc('type', 'focus'), checkitem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(checkitem, 'pclass:focus');

                test.refute.didSignal(checkitem, 'TP.sig.UIFocus');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidFocus');

                TP.signal.reset();
            });

        //  --- Individual mousedown/mouseup

        test.getDriver().startSequence().
            mouseDown(checkitem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(checkitem, 'pclass:active');

                test.refute.didSignal(checkitem, 'TP.sig.UIActivate');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidActivate');
            });

        test.getDriver().startSequence().
            mouseUp(checkitem).
            perform();

        test.then(
            function() {
                test.refute.didSignal(checkitem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  --- click

        test.getDriver().startSequence().
            click(checkitem).
            perform();

        test.then(
            function() {
                test.refute.didSignal(checkitem, 'TP.sig.UIActivate');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidActivate');

                test.refute.didSignal(checkitem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  --- Individual keydown/keyup

        test.getDriver().startSequence().
            keyDown(checkitem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(checkitem, 'pclass:active');

                test.refute.didSignal(checkitem, 'TP.sig.UIActivate');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        test.getDriver().startSequence().
            keyUp(checkitem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.didSignal(checkitem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(checkitem, 'TP.sig.UIDidDeactivate');
            });
    });
// }).skip(TP.sys.cfg('boot.context') === 'phantomjs');
//  TODO: Figure out why not skipping this causes the below tests to fail in
//  Karma
}).skip();

//  ------------------------------------------------------------------------

TP.xctrls.checkitem.Type.describe('TP.xctrls.checkitem: get/set value',
function() {

    var testData,

        unloadURI,
        loadURI,

        windowContext;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            TP.$$setupCommonObjectValues();
            testData = TP.$$commonObjectValues;

            loadURI = TP.uc('~lib_test/src/xctrls/xctrls_checkitem.xhtml');
            this.getDriver().setLocation(loadURI);

            windowContext = this.getDriver().get('windowContext');
        });

    //  ---

    this.beforeEach(
        function() {

            var tpElem;

            //  Make sure that each test starts with a freshly reset item
            tpElem = TP.byId('dataCheckitem1', windowContext);
            tpElem.deselectAll();
        });

    //  ---

    this.after(
        function() {

            //  Unload the current page by setting it to the blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.it('xctrls:checkitem - setting value to scalar values', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('dataCheckitem1', windowContext);

        //  undefined
        tpElem.set('value', testData.at(TP.UNDEF));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  null
        tpElem.set('value', testData.at(TP.NULL));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  String
        tpElem.set('value', testData.at('String'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  String (multiple)
        tpElem.set('value', 'foo;baz');
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo', 'baz'));

        //  reset
        tpElem.deselectAll();

        //  Number
        tpElem.set('value', testData.at('Number'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  Boolean
        tpElem.set('value', testData.at('Boolean'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);
    });

    //  ---

    this.it('xctrls:checkitem - setting value to complex object values', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('dataCheckitem1', windowContext);

        //  RegExp
        tpElem.set('value', testData.at('RegExp'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  Date
        tpElem.set('value', testData.at('Date'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  Array
        tpElem.set('value', TP.ac('foo', 'bar', 'baz'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo', 'bar', 'baz'));

        //  reset
        tpElem.deselectAll();

        //  Object
        tpElem.set('value', {foo: 'baz'});
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('baz'));

        //  reset
        tpElem.deselectAll();

        //  TP.core.Hash
        tpElem.set('value', TP.hc('foo', 'bar'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));
    });

    //  ---

    this.it('xctrls:checkitem - setting value to markup', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('dataCheckitem1', windowContext);

        //  XMLDocument
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLDocument')));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  XMLElement
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLElement')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  AttributeNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('AttributeNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  TextNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('TextNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo'));

        //  reset
        tpElem.deselectAll();

        //  CDATASectionNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CDATASectionNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo'));

        //  reset
        tpElem.deselectAll();

        //  PINode
        tpElem.set('value', TP.nodeCloneNode(testData.at('PINode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('bar'));

        //  reset
        tpElem.deselectAll();

        //  CommentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CommentNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('foo'));

        //  reset
        tpElem.deselectAll();

        //  DocumentFragmentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('DocumentFragmentNode')));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  NodeList
        tpElem.set('value', testData.at('NodeList'));
        value = tpElem.get('value');
        test.assert.isEmpty(value);

        //  NamedNodeMap
        tpElem.set('value', testData.at('NamedNodeMap'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.ac('baz'));
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
