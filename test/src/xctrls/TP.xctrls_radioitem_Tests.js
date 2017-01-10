//  ========================================================================
//  xctrls:radioitem
//  ========================================================================

TP.xctrls.radioitem.Type.describe('TP.xctrls.radioitem: manipulation',
function() {

    var driver,
        windowContext,

        unloadURI,
        loadURI;

    driver = this.getDriver();

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            windowContext = driver.get('windowContext');

            loadURI = TP.uc('~lib_test/src/xctrls/xctrls_radioitem.xhtml');
            driver.setLocation(loadURI);

            this.startTrackingSignals();
        });

    //  ---

    this.after(
        function() {

            this.stopTrackingSignals();

            //  Unload the current page by setting it to the blank
            driver.setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.afterEach(
        function() {
            TP.signal.reset();
        });

    //  ---

    this.it('Focusing', function(test, options) {

        var radioitem;

        radioitem = TP.byId('radioitem1', windowContext);

        //  Change the focus via 'direct' method

        driver.startSequence().
            sendEvent(TP.hc('type', 'focus'), radioitem).
            perform();

        test.then(
            function() {

                var focusedElem;

                test.assert.hasAttribute(radioitem, 'pclass:focus');

                test.assert.didSignal(radioitem, 'TP.sig.UIFocus');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidFocus');

                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, radioitem);
            });
    });

    //  ---

    this.it('Activation - mouse', function(test, options) {

        var radioitem;

        //  Change the content via 'user' interaction

        radioitem = TP.byId('radioitem1', windowContext);

        //  Individual mousedown/mouseup

        driver.startSequence().
            mouseDown(radioitem).
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(radioitem, 'pclass:active');

                test.assert.didSignal(radioitem, 'TP.sig.UIActivate');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        driver.startSequence().
            mouseUp(radioitem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(radioitem, 'pclass:active');

                test.assert.didSignal(radioitem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  click

        driver.startSequence().
            click(radioitem).
            perform();

        test.then(
            function() {

                //  Don't test the attribute here - it will already have been
                //  removed.

                test.assert.didSignal(radioitem, 'TP.sig.UIActivate');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidActivate');

                test.assert.didSignal(radioitem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidDeactivate');
            });
    });

    //  ---

    this.it('Activation - keyboard', function(test, options) {

        var radioitem;

        //  Change the content via 'user' interaction

        radioitem = TP.byId('radioitem1', windowContext);

        //  Individual keydown/keyup

        driver.startSequence().
            keyDown(radioitem, 'Enter').
            perform();

        test.then(
            function() {
                test.assert.hasAttribute(radioitem, 'pclass:active');

                test.assert.didSignal(radioitem, 'TP.sig.UIActivate');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        driver.startSequence().
            keyUp(radioitem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(radioitem, 'pclass:active');

                test.assert.didSignal(radioitem, 'TP.sig.UIDeactivate');
                test.assert.didSignal(radioitem, 'TP.sig.UIDidDeactivate');
            });
    });

    //  ---

    this.it('Disabled behavior', function(test, options) {

        var radioitem;

        //  All of these mechanisms to 'activate' the control should fail - it's
        //  disabled.

        //  Disable it
        radioitem = TP.byId('radioitem1', windowContext);
        radioitem.setAttrDisabled(true);

        //  --- Focus

        driver.startSequence().
            sendEvent(TP.hc('type', 'focus'), radioitem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(radioitem, 'pclass:focus');

                test.refute.didSignal(radioitem, 'TP.sig.UIFocus');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidFocus');

                TP.signal.reset();
            });

        //  --- Individual mousedown/mouseup

        driver.startSequence().
            mouseDown(radioitem).
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(radioitem, 'pclass:active');

                test.refute.didSignal(radioitem, 'TP.sig.UIActivate');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidActivate');
            });

        driver.startSequence().
            mouseUp(radioitem).
            perform();

        test.then(
            function() {
                test.refute.didSignal(radioitem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  --- click

        driver.startSequence().
            click(radioitem).
            perform();

        test.then(
            function() {
                test.refute.didSignal(radioitem, 'TP.sig.UIActivate');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidActivate');

                test.refute.didSignal(radioitem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidDeactivate');

                TP.signal.reset();
            });

        //  --- Individual keydown/keyup

        driver.startSequence().
            keyDown(radioitem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.hasAttribute(radioitem, 'pclass:active');

                test.refute.didSignal(radioitem, 'TP.sig.UIActivate');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidActivate');

                TP.signal.reset();
            });

        driver.startSequence().
            keyUp(radioitem, 'Enter').
            perform();

        test.then(
            function() {
                test.refute.didSignal(radioitem, 'TP.sig.UIDeactivate');
                test.refute.didSignal(radioitem, 'TP.sig.UIDidDeactivate');
            });
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Type.describe('TP.xctrls.radioitem: get/set value',
function() {

    var driver,
        windowContext,

        unloadURI,
        loadURI,

        testData;

    driver = this.getDriver();

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            TP.$$setupCommonObjectValues();
            testData = TP.$$commonObjectValues;

            windowContext = driver.get('windowContext');

            loadURI = TP.uc('~lib_test/src/xctrls/xctrls_radioitem.xhtml');
            driver.setLocation(loadURI);
        });

    //  ---

    this.after(
        function() {

            //  Unload the current page by setting it to the blank
            driver.setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.it('xctrls:radioitem - setting value to scalar values', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('dataradioitem1', windowContext);

        //  undefined
        tpElem.set('value', testData.at(TP.UNDEF));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  null
        tpElem.set('value', testData.at(TP.NULL));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  String
        tpElem.set('value', testData.at('String'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, TP.str(testData.at('String')));

        //  Number
        tpElem.set('value', testData.at('Number'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  Boolean
        tpElem.set('value', testData.at('Boolean'));
        value = tpElem.get('value');
        test.assert.isNull(value);
    });

    //  ---

    this.it('xctrls:radioitem - setting value to complex object values', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('dataradioitem1', windowContext);

        //  RegExp
        tpElem.set('value', testData.at('RegExp'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  Date
        tpElem.set('value', testData.at('Date'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  Array
        tpElem.set('value', TP.ac('foo', 'bar', 'baz'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  Object
        tpElem.set('value',
            {
                foo: 'baz'
            });
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'baz');

        //  TP.core.Hash
        tpElem.set('value', TP.hc('foo', 'bar'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');
    });

    //  ---

    this.it('xctrls:radioitem - setting value to markup', function(test, options) {

        var tpElem,
            value;

        tpElem = TP.byId('dataradioitem1', windowContext);

        //  XMLDocument
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLDocument')));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  XMLElement
        tpElem.set('value', TP.nodeCloneNode(testData.at('XMLElement')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');

        //  AttributeNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('AttributeNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');

        //  TextNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('TextNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  CDATASectionNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CDATASectionNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  PINode
        tpElem.set('value', TP.nodeCloneNode(testData.at('PINode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'bar');

        //  CommentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('CommentNode')));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'foo');

        //  DocumentFragmentNode
        tpElem.set('value', TP.nodeCloneNode(testData.at('DocumentFragmentNode')));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  NodeList
        tpElem.set('value', testData.at('NodeList'));
        value = tpElem.get('value');
        test.assert.isNull(value);

        //  NamedNodeMap
        tpElem.set('value', testData.at('NamedNodeMap'));
        value = tpElem.get('value');
        test.assert.isEqualTo(value, 'baz');
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.xctrls.radioitem.Type.describe('TP.xctrls.radioitem: selection management',
function() {

    var driver,
        windowContext,

        unloadURI,
        loadURI;

    driver = this.getDriver();

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {

            TP.$$setupCommonObjectValues();

            loadURI = TP.uc('~lib_test/src/xctrls/xctrls_radioitem.xhtml');
            driver.setLocation(loadURI);

            windowContext = driver.get('windowContext');
        });

    //  ---

    this.after(
        function() {

            //  Unload the current page by setting it to the blank
            driver.setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.it('xctrls:radioitem - addSelection', function(test, options) {

        var tpElem;

        tpElem = TP.byId('dataradioitem1', windowContext);

        //  ---

        //  allowsMultiples

        //  radio elements do *not* allow multiples
        test.assert.isFalse(tpElem.allowsMultiples());

        //  ---

        //  (property defaults to 'value')
        tpElem.addSelection('baz');
        test.assert.isFalse(TP.byId('dataradioitem1', windowContext).isSelected());
        test.assert.isFalse(TP.byId('dataradioitem2', windowContext).isSelected());
        test.assert.isTrue(TP.byId('dataradioitem3', windowContext).isSelected());

        //  'value' property
        tpElem.addSelection('bar', 'value');
        test.assert.isFalse(TP.byId('dataradioitem1', windowContext).isSelected());
        test.assert.isTrue(TP.byId('dataradioitem2', windowContext).isSelected());
        test.assert.isFalse(TP.byId('dataradioitem3', windowContext).isSelected());
    });

    //  ---

    this.it('xctrls:dataradioitem - removeSelection', function(test, options) {

        var tpElem;

        tpElem = TP.byId('dataradioitem1', windowContext);

        tpElem.addSelection('bar');

        //  (property defaults to 'value')
        tpElem.removeSelection('baz');
        test.assert.isFalse(TP.byId('dataradioitem1', windowContext).isSelected());
        test.assert.isTrue(TP.byId('dataradioitem2', windowContext).isSelected());
        test.assert.isFalse(TP.byId('dataradioitem3', windowContext).isSelected());

        tpElem.removeSelection('baz');
        test.assert.isFalse(TP.byId('dataradioitem3', windowContext).isSelected());

        //  'value' property
        tpElem.removeSelection('bar', 'value');
        test.assert.isFalse(TP.byId('dataradioitem1', windowContext).isSelected());
        test.assert.isFalse(TP.byId('dataradioitem2', windowContext).isSelected());

        //  NB: This is different from XHTML in that we can have a radioitem
        //  with 'no selection'
        test.assert.isFalse(TP.byId('dataradioitem3', windowContext).isSelected());

        tpElem.removeSelection('bar', 'value');
        test.assert.isFalse(TP.byId('dataradioitem2', windowContext).isSelected());
    });

    //  ---

    this.it('xctrls:dataradioitem - select', function(test, options) {

        var tpElem;

        tpElem = TP.byId('dataradioitem1', windowContext);

        //  (property defaults to 'value')
        tpElem.select('bar');
        test.assert.isFalse(TP.byId('dataradioitem1', windowContext).isSelected());
        test.assert.isTrue(TP.byId('dataradioitem2', windowContext).isSelected());
        test.assert.isFalse(TP.byId('dataradioitem3', windowContext).isSelected());

        tpElem.select('baz');
        test.assert.isFalse(TP.byId('dataradioitem1', windowContext).isSelected());
        test.assert.isFalse(TP.byId('dataradioitem2', windowContext).isSelected());
        test.assert.isTrue(TP.byId('dataradioitem3', windowContext).isSelected());
    });

}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
