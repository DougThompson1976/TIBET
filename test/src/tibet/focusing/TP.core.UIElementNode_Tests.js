//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

/* JSHint checking */

/* global $focus_stack:true
*/

//  ========================================================================
//  TP.core.UIElementNode
//  ========================================================================

TP.core.UIElementNode.Inst.describe('TP.core.UIElementNode: focusing',
function() {

    var unloadURI,
        loadURI;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {
            this.getDriver().showTestGUI();
        });

    //  ---

    this.after(
        function() {
            this.getDriver().showTestLog();
        });

    //  ---

    this.afterEach(
        function() {

            //  Unload the current page by setting it to the
            //  blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  ---

    this.it('No initially focused element, all tabindexes -1', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing1.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    bodyElem,

                    elem1,
                    elem2,
                    elem3,
                    elem4,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                bodyElem = TP.documentGetBody(TP.sys.uidoc(true));

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);

                //  The first focused element in this file will be the <body>
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, bodyElem);

                //  ---

                //  Due to the way the markup is written here, the tab order for
                //  this test is:
                //      1 - 2 - 3 - 4

                //  ---

                //  Use Tab to go to elem1
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Prove that.
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Tab to go to elem2
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use Tab to go to elem3
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use End to go to elem4
                driver.startSequence().
                        sendKeys('[End]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Home to go to elem1
                driver.startSequence().
                        sendKeys('[Home]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Shift-Tab to go to elem4 (wrap-around)
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Tab to go back to elem1 (wrap-around)
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused element, some static tabindexes', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing2.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    elem1,
                    elem2,
                    elem3,
                    elem4,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);

                TP.documentFocusAutofocusedElement(TP.sys.uidoc(true));

                //  The first focused element in this file will be elem2,
                //  because it has an 'autofocus="true"' attribute.
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, elem2);

                //  ---

                //  Due to the way the markup is written here, the tab order for
                //  this test is:
                //      2 - 4 - 1 - 3

                //  ---

                //  Use Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Tab to go to elem1
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use End to go to elem3
                driver.startSequence().
                        sendKeys('[End]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Home to go to elem2
                driver.startSequence().
                        sendKeys('[Home]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use Shift-Tab to go to elem3 (wraparound)
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Shift-Tab to go to elem1
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Shift-Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused element, complex group', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing3.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    elem1,
                    elem2,
                    elem3,
                    elem4,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);

                TP.documentFocusAutofocusedElement(TP.sys.uidoc(true));

                //  The first focused element in this file will be elem3,
                //  because it has an 'autofocus="true"' attribute.
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, elem3);

                //  ---

                //  Use End to go to elem4
                driver.startSequence().
                        sendKeys('[End]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Tab to go to elem1 (wraparound)
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Shift-Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Home to go to elem1
                driver.startSequence().
                        sendKeys('[Home]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Ctrl-Tab to go to elem2 (next element in same or next
                //  group)
                driver.startSequence().
                        sendKeys('[Control][Tab][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use Ctrl-Tab to go to elem3 (next element in same or next
                //  group)
                driver.startSequence().
                        sendKeys('[Control][Tab][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Shift-Ctrl-Tab to go to elem2 (previous element in same
                //  or next group)
                driver.startSequence().
                        sendKeys('[Shift][Control][Tab][Control-Up][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use 2 Tabs to go to elem4
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use PageUp to go to elem3 (the first field in this group)
                driver.startSequence().
                        sendKeys('[PageUp]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use PageDown to go to elem4 (the last field in this group)
                driver.startSequence().
                        sendKeys('[PageDown]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Ctrl-PageDown to go to elem1 (the first field in the
                //  previous group)
                driver.startSequence().
                        sendKeys('[Control][PageDown][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Ctrl-PageUp to go to elem3 (the first field in the
                //  next group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused element, complex group, group wrapping', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing4.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    elem1,
                    elem2,
                    elem3,
                    elem4,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);

                //  In this test, the 'fooGroup' does *not* wrap (since it
                //  doesn't have a 'wrapWhen' attribute), but the 'gooGroup'
                //  *does* wrap.

                TP.documentFocusAutofocusedElement(TP.sys.uidoc(true));

                //  The first focused element in this file will be elem1,
                //  because it has an 'autofocus="true"' attribute.
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, elem1);

                //  ---

                //  Use 2 tabs to go to elem3 - we're in fooGroup and won't wrap
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Tab to go to elem3 - we're in gooGroup and will wrap
                //  around
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Shift-Tab to go to elem4 - we're in gooGroup and will
                //  wrap around
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Ctrl-Tab to go to elem1 (next element in same or next
                //  group) - Ctrl-Tab ignores group wrapping
                driver.startSequence().
                        sendKeys('[Control][Tab][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use 2 tabs to go to elem3 - we're in fooGroup and won't wrap
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Shift-Ctrl-Tab to go to elem2 (previous element in same
                //  or next group) - Shift-Ctrl-Tab ignores group wrapping
                driver.startSequence().
                        sendKeys('[Shift][Control][Tab][Control-Up][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use 2 tabs to go to elem4 - we're in fooGroup and won't wrap
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use PageUp to go to elem3 (the first field in this group) -
                //  PageUp ignores group wrapping
                driver.startSequence().
                        sendKeys('[PageUp]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use PageDown to go to elem4 (the last field in this group)
                //  - PageDown ignores group wrapping
                driver.startSequence().
                        sendKeys('[PageDown]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Ctrl-PageDown to go to elem1 (the first field in the
                //  previous group)
                driver.startSequence().
                        sendKeys('[Control][PageDown][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Ctrl-PageUp to go to elem3 (the first field in the
                //  next group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused group, complex group, group wrapping', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing5.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    elem1,
                    elem2,
                    elem3,
                    elem4,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);

                //  In this test, the 'fooGroup' does *not* wrap (since it
                //  doesn't have a 'wrapWhen' attribute), but the 'gooGroup'
                //  *does* wrap.

                TP.documentFocusAutofocusedElement(TP.sys.uidoc(true));

                //  The first focused element in this file will be elem2,
                //  because a) it's group, fooGroup, has an 'autofocus="true"'
                //  attribute and b) it has a lesser tabindex *within its group*
                //  than elem1.
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, elem2);

                //  ---

                //  Use a tab to go to elem1 - we're in fooGroup and won't wrap,
                //  but officially elem2 comes before elem1 due to tabindex.
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use a tab to go to elem3 - we're in fooGroup and won't wrap,
                //  and officially elem1 comes after elem2 due to tabindex,
                //  which means leaving elem1 means leaving the group.
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Tab to go to elem3 - we're in gooGroup and will wrap
                //  around
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Shift-Tab to go to elem4 - we're in gooGroup and will
                //  wrap around
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Ctrl-Tab to go to elem2 (next element in same or next
                //  group) - Ctrl-Tab ignores group wrapping and elem2 has a
                //  lower tabindex than elem1
                driver.startSequence().
                        sendKeys('[Control][Tab][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  Use 2 tabs to go to elem3 - we're in fooGroup and won't wrap,
                //  and officially elem1 comes after elem2 due to tabindex,
                //  which means leaving elem1 means leaving the group.
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Shift-Ctrl-Tab to go to elem2 (previous element in same
                //  or next group) - Shift-Ctrl-Tab ignores group wrapping and
                //  elem1 has a higher tabindex than elem2
                driver.startSequence().
                        sendKeys('[Shift][Control][Tab][Control-Up][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use PageUp which will go to elem2 (the first field in this
                //  group *by tabindex*) - PageUp ignores group wrapping
                driver.startSequence().
                        sendKeys('[PageUp]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use PageDown to go to elem1 (the last field in this group
                //  *by tabindex*) - PageDown ignores group wrapping
                driver.startSequence().
                        sendKeys('[PageDown]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use Ctrl-PageDown to go to elem3 (the first field in the
                //  previous group)
                driver.startSequence().
                        sendKeys('[Control][PageDown][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---

                //  Use Ctrl-PageUp to go to elem2 (the first field *by
                //  tabindex* in the next group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused group, simple nested group', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing6.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    elem1,
                    elem2,
                    elem3,
                    elem4,
                    elem5,
                    elem6,
                    elem7,
                    elem8,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);
                elem5 = TP.byId('focusTestField5', windowContext, false);
                elem6 = TP.byId('focusTestField6', windowContext, false);
                elem7 = TP.byId('focusTestField7', windowContext, false);
                elem8 = TP.byId('focusTestField8', windowContext, false);

                TP.documentFocusAutofocusedElement(TP.sys.uidoc(true));

                //  The first focused element in this file will be elem1,
                //  because a) it's group, fooGroup, has an 'autofocus="true"'
                //  attribute and b) it is the first element within its group
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, elem1);

                //  ---

                //  The tab sequence for this test file is:
                //  1 - 2 - 4 - 5 - 6 - 7 - 8 - 3

                //  ---

                //  Use a Tab to go to elem2
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  Use a Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  Use a Tab to go to elem5
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  Use a Tab to go to elem6
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem6);
                    });

                //  Use a Tab to go to elem7
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  Use a Tab to go to elem8
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  Use a Tab to go to elem3
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  ---
                //  Test 'jump' keys
                //  ---

                //  Use End to go to elem7 - it's the last field in the last
                //  group.
                driver.startSequence().
                        sendKeys('[End]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  ---

                //  Use Home to go to back to elem1 - it's the first field in
                //  the first group.
                driver.startSequence().
                        sendKeys('[Home]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use 3 Tabs to go to elem5 - we skip elem3 as it's not in any
                //  group and will come at the end.
                driver.startSequence().
                        sendKeys('[Tab][Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  ---

                //  Use PageUp to go to elem4.
                driver.startSequence().
                        sendKeys('[PageUp]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use a Shift-Tab to go to elem2. elem3 isn't in any group, so
                //  it will be skipped.
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use Ctrl-Tab to go to elem4 (next element in same or next
                //  group - elem3 isn't in any group)
                driver.startSequence().
                        sendKeys('[Control][Tab][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Shift-Ctrl-Tab to go to back to elem2 (previous element
                //  in same or next group - again, elem3 isn't in any group)
                driver.startSequence().
                        sendKeys('[Shift][Control][Tab][Control-Up][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use 2 Tabs to go to elem5
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  ---

                //  Use Ctrl-PageDown to go to elem6 (the first field in the next
                //  group)
                driver.startSequence().
                        sendKeys('[Control][PageDown][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem6);
                    });

                //  ---

                //  Use Ctrl-PageUp to go to elem4 (the first field in the
                //  previous group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use PageDown to go to elem8 (the last field in the
                //  same group)
                driver.startSequence().
                        sendKeys('[PageDown]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  ---

                //  Use Tab to go to elem3 (since we're in the last group, it
                //  will consider the body before it would wrap - the first
                //  (only) field in the body is elem3
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused group, simple nested group, group wrapping', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing7.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    bodyElem,

                    elem1,
                    elem2,

                    elem4,
                    elem5,
                    elem6,
                    elem7,
                    elem8,

                    focusedElem;

                windowContext = driver.get('windowContext');

                //  The window-level focus handlers in TIBET will focus the body
                //  here.
                TP.sys.uiwin(true).focus();

                bodyElem = TP.documentGetBody(TP.sys.uidoc(true));

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);

                elem4 = TP.byId('focusTestField4', windowContext, false);
                elem5 = TP.byId('focusTestField5', windowContext, false);
                elem6 = TP.byId('focusTestField6', windowContext, false);
                elem7 = TP.byId('focusTestField7', windowContext, false);
                elem8 = TP.byId('focusTestField8', windowContext, false);

                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, bodyElem);

                //  ---

                //  The tab sequence for this test file is:
                //  1 - 2 - 4 - 5 - 6 - 7 - 8 - 4 (wrap) - 5 - 6

                //  ---

                //  Use a Tab to go to elem1
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Prove that.
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use a Tab to go to elem2
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  Use a Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  Use a Tab to go to elem5
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  Use a Tab to go to elem6
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem6);
                    });

                //  Use a Tab to go to elem7
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  Use a Tab to go to elem8
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  Use a Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  Use a Tab to go to elem5
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  Use a Tab to go to elem6
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem6);
                    });

                //  ---
                //  Test 'jump' keys
                //  ---

                //  Use End to go to elem7 - it's the last field in the last
                //  group.
                driver.startSequence().
                        sendKeys('[End]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  ---

                //  Use Home to go to back to elem1 - it's the first field in
                //  the first group.
                driver.startSequence().
                        sendKeys('[Home]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use 3 Tabs to go to elem5 - we skip elem3 as it's not in any
                //  group and will come at the end.
                driver.startSequence().
                        sendKeys('[Tab][Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  ---

                //  Use PageUp to go to elem4.
                driver.startSequence().
                        sendKeys('[PageUp]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use a Shift-Tab to go to elem8 - the gooGroup wraps.
                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  ---

                //  Use a Tab to go to elem4 - the gooGroup wraps.
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Shift-Ctrl-Tab to go to back to elem2 (previous element
                //  in same or next group ignoring wrapping - again, elem3 isn't
                //  in any group)
                driver.startSequence().
                        sendKeys('[Shift][Control][Tab][Control-Up][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use 2 Tabs to go to elem5
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  ---

                //  Use Ctrl-PageDown to go to elem6 (the first field in the next
                //  group)
                driver.startSequence().
                        sendKeys('[Control][PageDown][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem6);
                    });

                //  ---

                //  Use Ctrl-PageUp to go to elem4 (the first field in the
                //  previous group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use Ctrl-PageUp to go to elem1 (the first field in the
                //  previous group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('An initially focused group, simple nested group, group wrapping, some static tabindexes', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing8.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    bodyElem,

                    elem1,
                    elem2,
                    elem3,
                    elem4,
                    elem5,
                    elem6,
                    elem7,
                    elem8,

                    focusedElem;

                windowContext = driver.get('windowContext');

                TP.sys.uiwin(true).focus();

                bodyElem = TP.documentGetBody(TP.sys.uidoc(true));

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);
                elem5 = TP.byId('focusTestField5', windowContext, false);
                elem6 = TP.byId('focusTestField6', windowContext, false);
                elem7 = TP.byId('focusTestField7', windowContext, false);
                elem8 = TP.byId('focusTestField8', windowContext, false);

                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, bodyElem);

                //  ---

                //  The tab sequence for this test file is:
                //  3 (highest non-nested) - 1 - 2 - 8 (highest in gooGroup) -
                //  4 - 5 - 7 (highest in booGroup)- 6 - 8 (highest in gooGroup)
                //  - 4 (wrap) - 5

                //  ---

                //  Use a Tab to go to elem3
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem3);
                    });

                //  Use a Tab to go to elem1
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  Use a Tab to go to elem2
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  Use a Tab to go to elem8
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  Use a Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  Use a Tab to go to elem5
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  Use a Tab to go to elem7
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  Use a Tab to go to elem6
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem6);
                    });

                //  Use a Tab to go to elem8
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  Use a Tab to go to elem4
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  Use a Tab to go to elem5
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  ---
                //  Test 'jump' keys
                //  ---

                //  Use End to go to elem7 - it's the last field in the last
                //  group.
                driver.startSequence().
                        sendKeys('[End]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  ---

                //  Use Home to go to back to elem1 - it's the first field in
                //  the first group.
                driver.startSequence().
                        sendKeys('[Home]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });

                //  ---

                //  Use 2 Tabs to go to elem8 - we skip elem3 as it's not in any
                //  group and will come at the end and elem 8 has the highest
                //  tab index *in it's group*.
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  ---

                //  Use a Tab to go to elem4 - the gooGroup wraps.
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem4);
                    });

                //  ---

                //  Use PageUp to go to elem8 (it has the highest tab order in
                //  its group).
                driver.startSequence().
                        sendKeys('[PageUp]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  ---

                //  Use 2 Tabs to go to elem5 - the gooGroup wraps.
                driver.startSequence().
                        sendKeys('[Tab][Tab]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem5);
                    });

                //  ---

                //  Use 3 Shift-Ctrl-Tabs to go to back to elem2 (previous
                //  element in same or next group ignoring wrapping - again,
                //  elem3 isn't in any group)
                driver.startSequence().
                        sendKeys(
                        '[Shift][Control][Tab][Tab][Tab][Control-Up][Shift-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem2);
                    });

                //  ---

                //  Use 2 Ctrl-PageDowns to go to elem7 (the first field in the
                //  next, next group - which is elem7 because it has the highest
                //  tab order in that group)
                driver.startSequence().
                        sendKeys('[Control][PageDown][PageDown][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem7);
                    });

                //  ---

                //  Use a Ctrl-PageUp to go to elem8 (the first field in the
                //  previous, previuos group - the reason it's first is it has
                //  the highest tab order)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem8);
                    });

                //  ---

                //  Use a Ctrl-PageUp to go to elem1 (the first field in the
                //  previous, previuos group)
                driver.startSequence().
                        sendKeys('[Control][PageUp][Control-Up]').
                        perform();

                //  Test it
                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(focusedElem, elem1);
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);

    //  ---

    this.it('Focusing tab order tests', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/Focusing9.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        test.then(
            function(result) {
                var windowContext,

                    docOrderResults,
                    tabOrderResults;

                windowContext = driver.get('windowContext');

                //  ---

                docOrderResults =
                    TP.byCSSPath('#testGroup1 input',
                                    windowContext, false, false).
                                    collect(
                                        function(anElem) {
                                            return anElem.getAttribute('id');
                                        });

                test.assert.isEqualTo(
                    docOrderResults,
                    TP.ac('field_1', 'field_2', 'field_3', 'field_4'));

                tabOrderResults =
                    TP.byCSSPath('#testGroup1 input', windowContext, false, false).
                            sort(TP.sort.TABINDEX_ORDER);
                tabOrderResults = tabOrderResults.collect(
                                    function(anElem) {
                                        return anElem.getAttribute('id');
                                    });

                test.assert.isEqualTo(
                    tabOrderResults,
                    TP.ac('field_1', 'field_2', 'field_3', 'field_4'));

                //  ---

                docOrderResults =
                    TP.byCSSPath('#testGroup2 input',
                                    windowContext, false, false).
                                    collect(
                                        function(anElem) {
                                            return anElem.getAttribute('id');
                                        });

                test.assert.isEqualTo(
                    docOrderResults,
                    TP.ac('field_5', 'field_6', 'field_7', 'field_8'));

                tabOrderResults =
                    TP.byCSSPath('#testGroup2 input', windowContext, false, false).
                        sort(TP.sort.TABINDEX_ORDER);
                tabOrderResults = tabOrderResults.collect(
                                    function(anElem) {
                                        return anElem.getAttribute('id');
                                    });

                test.assert.isEqualTo(
                    tabOrderResults,
                    TP.ac('field_5', 'field_6', 'field_7', 'field_8'));

                //  ---

                docOrderResults =
                    TP.byCSSPath('#testGroup3 input',
                                    windowContext, false, false).
                                    collect(
                                        function(anElem) {
                                            return anElem.getAttribute('id');
                                        });

                test.assert.isEqualTo(
                    docOrderResults,
                    TP.ac('field_9', 'field_10', 'field_11',
                            'field_12', 'field_13', 'field_14'));

                tabOrderResults =
                    TP.byCSSPath('#testGroup3 input', windowContext, false, false).
                        sort(TP.sort.TABINDEX_ORDER);
                tabOrderResults = tabOrderResults.collect(
                                    function(anElem) {
                                        return anElem.getAttribute('id');
                                    });

                test.assert.isEqualTo(
                    tabOrderResults,
                    TP.ac('field_9', 'field_10', 'field_11',
                            'field_12', 'field_13', 'field_14'));

                //  ---

                docOrderResults =
                    TP.byCSSPath('#testGroup4 input',
                                    windowContext, false, false).
                                    collect(
                                        function(anElem) {
                                            return anElem.getAttribute('id');
                                        });

                test.assert.isEqualTo(
                    docOrderResults,
                    TP.ac('field_15', 'field_16', 'field_17', 'field_18',
                            'field_19', 'field_20', 'field_21', 'field_22'));

                tabOrderResults =
                    TP.byCSSPath('#testGroup4 input', windowContext, false, false).
                        sort(TP.sort.TABINDEX_ORDER);
                tabOrderResults = tabOrderResults.collect(
                                    function(anElem) {
                                        return anElem.getAttribute('id');
                                    });

                test.assert.isEqualTo(
                    tabOrderResults,
                    TP.ac('field_21', 'field_17', 'field_15', 'field_16',
                            'field_18', 'field_19', 'field_20', 'field_22'));
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);
}).timeout(60000).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ------------------------------------------------------------------------

TP.core.UIElementNode.Inst.describe('TP.core.UIElementNode: focus stack',
function() {

    var unloadURI,
        loadURI,

        shouldDumpFocusStack,
        dumpFocusStack,

        focusStackPreTest;

    unloadURI = TP.uc(TP.sys.cfg('path.blank_page'));

    //  ---

    this.before(
        function() {
            focusStackPreTest = $focus_stack.copy();

            $focus_stack = TP.ac();

            this.getDriver().showTestGUI();
        });

    this.after(
        function() {
            $focus_stack = focusStackPreTest;

            this.getDriver().showTestLog();
        });

    //  ---

    this.beforeEach(
        function() {
            this.getSuite().startTrackingSignals();
        });

    this.afterEach(
        function() {
            this.getSuite().stopTrackingSignals();

            //  Unload the current page by setting it to the blank
            this.getDriver().setLocation(unloadURI);

            //  Unregister the URI to avoid a memory leak
            loadURI.unregister();
        });

    //  Toggle this flag for debugging output.
    shouldDumpFocusStack = false;

    dumpFocusStack = function(identifier, test, focusedElem) {

        var signalInfos;

        if (shouldDumpFocusStack) {
            //  NB: Use the low-level console call to avoid Sherpa focusing
            //  back-and-forth problems.
            /* eslint-disable no-console */
            console.log(
                '--- ' + identifier + '---' + '\n\n' +
                'focusedElement:\n' + TP.id(focusedElem) + '\n\n' +
                'focus stack:');

            $focus_stack.perform(
                        function(elem) {
                            console.log(TP.id(elem));
                        });

            console.log('\n\n' +
                        'signals fired to achieve state:\n');

            signalInfos = test.getFiredSignalInfosString({localID: true});
            signalInfos = signalInfos.match(/[\s\S]{1,500}/g);

            signalInfos.perform(
                        function(chunk) {
                            console.log(chunk);
                        });

            console.log('\n\n');
            /* eslint-enable no-console */
        }
    };

    //  ---

    this.it('Focus stack - simple test', function(test, options) {

        var driver;

        loadURI = TP.uc('~lib_test/src/tibet/focusing/FocusingStack1.xhtml');

        driver = test.getDriver();
        driver.setLocation(loadURI);

        //  A short pause for when we're running these in a large group of tests
        //  gives the GUI a chance to update.
        test.thenWait(100);

        test.then(
            function(result) {
                var windowContext,

                    bodyElem,

                    elem1,
                    elem2,
                    elem3,
                    elem4,

                    focusedElem;

                windowContext = driver.get('windowContext');

                TP.sys.uiwin(true).focus();

                bodyElem = TP.documentGetBody(TP.sys.uidoc(true));

                elem1 = TP.byId('focusTestField1', windowContext, false);
                elem2 = TP.byId('focusTestField2', windowContext, false);
                elem3 = TP.byId('focusTestField3', windowContext, false);
                elem4 = TP.byId('focusTestField4', windowContext, false);

                //  The first focused element in this file will be the <body>
                //  Test that theory.
                focusedElem = driver.getFocusedElement();
                test.assert.isIdenticalTo(focusedElem, bodyElem);

                //  ---

                //  Due to the way the markup is written here, the tab order for
                //  this test is:
                //      1 - 2 - 3 - 4

                //  But, because elem3 forms its own focusing context due to the
                //  'tibet:focuscontext' attribute, tabbing (or shift-tabbing)
                //  to it will push the last element onto the focus stack and
                //  that element is what will be focused when elem3 is blurred.

                //  Give the browser (ok, IE) a chance to settle a bit before
                //  continuing.
                test.thenWait(100);

                //  ---

                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem1,
                                'Focused element not identical in Step #1');

                        dumpFocusStack('Step #1', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #1');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem1),
                                'Stack last element not identical in Step #1');

                        //  TP.sig.UIFocusNext      -   bodyElem
                        test.assert.didSignal(bodyElem, 'TP.sig.UIFocusNext');

                        //  TP.sig.UIFocus          -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem1
                        test.assert.didSignal(elem1, 'TP.sig.DOMFocus');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem2,
                                'Focused element not identical in Step #2');

                        dumpFocusStack('Step #2', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #2');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem2),
                                'Stack last element not identical in Step #2');

                        //  TP.sig.UIFocusNext      -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIFocusNext');

                        //  TP.sig.UIBlur           -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidPopFocus    -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIDidPopFocus');

                        //  TP.sig.UIDidBlur        -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem1
                        test.assert.didSignal(elem1, 'TP.sig.DOMBlur');

                        //  TP.sig.UIFocus          -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMFocus');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem3,
                                'Focused element not identical in Step #3');

                        dumpFocusStack('Step #3', test, focusedElem);

                        //  At this point, the focus stack should have two items
                        //  on it, because we entered a new focusing context -
                        //  the previous element (elem2) and the currently
                        //  focused element (elem3)
                        test.assert.isSizeOf(
                                $focus_stack,
                                2,
                                'Focus stack not correct size in Step #3');
                        test.assert.isIdenticalTo(
                                $focus_stack.first(),
                                TP.wrap(elem2),
                                'Stack first element not identical in Step #3');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem3),
                                'Stack last element not identical in Step #3');

                        //  No 'Pop' event since we entered a new context.

                        //  TP.sig.UIFocusNext      -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIFocusNext');

                        //  TP.sig.UIBlur           -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidBlur        -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMBlur');

                        //  TP.sig.UIFocus          -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMFocus');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                test.then(
                    function() {
                        //  We're currently on elem3, but because of the focus
                        //  stack when we leave elem3, elem4 will be briefly
                        //  focused (because there is no way to cancel - ie.
                        //  prevent default - for the focus event) and then
                        //  elem2 will be refocused.

                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem2,
                                'Focused element not identical in Step #4');

                        dumpFocusStack('Step #4', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #4');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem2),
                                'Stack last element not identical in Step #4');

                        //  TP.sig.UIFocusNext      -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIFocusNext');

                        //  TP.sig.UIBlur           -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidPopFocus    -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidPopFocus');

                        //  TP.sig.UIFocus          -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMFocus');

                        //  TP.sig.UIDidBlur        -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMBlur');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                test.then(
                    function() {

                        //  This should've put us at elem4
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem4,
                                'Focused element not identical in Step #5');

                        dumpFocusStack('Step #5', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #5');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem4),
                                'Stack last element not identical in Step #5');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                test.then(
                    function() {
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem3,
                                'Focused element not identical in Step #6');

                        dumpFocusStack('Step #6', test, focusedElem);

                        //  At this point, the focus stack should have two items
                        //  on it, because we entered a new focusing context -
                        //  the previous element (elem2) and the currently
                        //  focused element (elem4)
                        test.assert.isSizeOf(
                                $focus_stack,
                                2,
                                'Focus stack not correct size in Step #6');
                        test.assert.isIdenticalTo(
                                $focus_stack.first(),
                                TP.wrap(elem4),
                                'Stack first element not identical in Step #6');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem3),
                                'Stack last element not identical in Step #6');

                        //  No 'Pop' event since we entered a new context.

                        //  TP.sig.UIFocusPrevious  -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIFocusPrevious');

                        //  TP.sig.UIBlur           -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidBlur        -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem4
                        test.assert.didSignal(elem4, 'TP.sig.DOMBlur');

                        //  TP.sig.UIFocus          -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMFocus');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                driver.startSequence().
                        sendKeys('[Shift][Tab][Shift-Up]').
                        perform();

                test.then(
                    function() {

                        //  We're currently on elem3, but because of the focus
                        //  stack when we leave elem3, elem2 will be briefly
                        //  focused (because there is no way to cancel - ie.
                        //  prevent default - for the focus event) and then
                        //  elem4 will be refocused.

                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem4,
                                'Focused element not identical in Step #7');

                        dumpFocusStack('Step #7', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #7');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem4),
                                'Stack last element not identical in Step #7');

                        //  TP.sig.UIFocusPrevious  -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIFocusPrevious');

                        //  TP.sig.UIBlur           -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidPopFocus    -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidPopFocus');

                        //  TP.sig.UIFocus          -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem4
                        test.assert.didSignal(elem4, 'TP.sig.DOMFocus');

                        //  TP.sig.UIDidBlur        -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMBlur');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                //  This will put us at elem1
                driver.startSequence().
                        sendKeys('[Tab]').
                        perform();

                test.then(
                    function() {

                        //  This should've put us at elem1
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem1,
                                'Focused element not identical in Step #8');

                        dumpFocusStack('Step #8', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #8');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem1),
                                'Stack last element not identical in Step #8');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                //  This will put us at elem2
                driver.startSequence().
                        click(elem2).
                        perform();

                test.then(
                    function() {

                        //  This should've put us at elem2
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem2,
                                'Focused element not identical in Step #9');

                        dumpFocusStack('Step #9', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #9');
                        test.assert.isIdenticalTo($focus_stack.last(),
                                                    TP.wrap(elem2));

                        //  TP.sig.UIActivate       -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIActivate');

                        //  TP.sig.UIDidActivate    -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidActivate');

                        //  TP.sig.UIBlur           -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidPopFocus    -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIDidPopFocus');

                        //  TP.sig.UIDidBlur        -   elem1
                        test.assert.didSignal(elem1, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem1
                        test.assert.didSignal(elem1, 'TP.sig.DOMBlur');

                        //  TP.sig.UIFocus          -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMFocus');

                        //  TP.sig.UIDeactivate     -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDeactivate');

                        //  TP.sig.UIDidDeactivate  -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidDeactivate');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                //  This will put us at elem3
                driver.startSequence().
                        click(elem3).
                        perform();

                test.then(
                    function() {

                        //  This should've put us at elem3
                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem3,
                                'Focused element not identical in Step #10');

                        dumpFocusStack('Step #10', test, focusedElem);

                        //  At this point, the focus stack should have two items
                        //  on it, because we entered a new focusing context -
                        //  the previous element (elem2) and the currently
                        //  focused element (elem4)
                        test.assert.isSizeOf(
                                $focus_stack,
                                2,
                                'Focus stack not correct size in Step #10');
                        test.assert.isIdenticalTo(
                                $focus_stack.first(),
                                TP.wrap(elem2),
                                'Stack first element not identical in Step #10');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem3),
                                'Stack last element not identical in Step #10');

                        //  No 'Pop' event since we entered a new context.

                        //  TP.sig.UIActivate       -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIActivate');

                        //  TP.sig.UIDidActivate    -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidActivate');

                        //  TP.sig.UIBlur           -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidBlur        -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMBlur');

                        //  TP.sig.DOMChange        -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMChange');

                        //  TP.sig.UIFocus          -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMFocus');

                        //  TP.sig.UIDeactivate     -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDeactivate');

                        //  TP.sig.UIDidDeactivate  -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidDeactivate');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });

                //  ---

                //  This will attempt to put us at elem4
                driver.startSequence().
                        click(elem4).
                        perform();

                test.then(
                    function() {
                        //  We're currently on elem3, but because of the focus
                        //  stack when we leave elem3, elem4 will be briefly
                        //  focused (because there is no way to cancel - ie.
                        //  prevent default - for the focus event) and then
                        //  elem2 will be refocused.

                        focusedElem = driver.getFocusedElement();
                        test.assert.isIdenticalTo(
                                focusedElem,
                                elem2,
                                'Focused element not identical in Step #11');

                        dumpFocusStack('Step #11', test, focusedElem);

                        //  At this point, the focus stack should have one item
                        //  on it - the focused element (wrapped).
                        test.assert.isSizeOf(
                                $focus_stack,
                                1,
                                'Focus stack not correct size in Step #11');
                        test.assert.isIdenticalTo(
                                $focus_stack.last(),
                                TP.wrap(elem2),
                                'Stack last element not identical in Step #11');

                        //  TP.sig.UIActivate       -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIActivate');

                        //  TP.sig.UIDidActivate    -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIDidActivate');

                        //  TP.sig.UIBlur           -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIBlur');

                        //  TP.sig.UIDidPopFocus    -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidPopFocus');

                        //  TP.sig.UIFocus          -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIFocus');

                        //  TP.sig.UIDidPushFocus   -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidPushFocus');

                        //  TP.sig.UIDidFocus       -   elem2
                        test.assert.didSignal(elem2, 'TP.sig.UIDidFocus');

                        //  TP.sig.DOMFocus         -   window/elem2
                        test.assert.didSignal(elem2, 'TP.sig.DOMFocus');

                        //  TP.sig.UIDidBlur        -   elem3
                        test.assert.didSignal(elem3, 'TP.sig.UIDidBlur');

                        //  TP.sig.DOMBlur          -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMBlur');

                        //  TP.sig.DOMChange        -   window/elem3
                        test.assert.didSignal(elem3, 'TP.sig.DOMChange');

                        //  TP.sig.DOMChange        -   window/elem4
                        test.assert.didSignal(elem4, 'TP.sig.DOMChange');

                        //  TP.sig.UIDeactivate     -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIDeactivate');

                        //  TP.sig.UIDidDeactivate  -   elem4
                        test.assert.didSignal(elem4, 'TP.sig.UIDidDeactivate');

                        //  Reset the spy on TP.signal in preparation for the
                        //  next step in this test.
                        TP.signal.reset();
                    });
            },
            function(error) {
                test.fail(error, TP.sc('Couldn\'t get resource: ',
                                            loadURI.getLocation()));
            });
    }).timeout(10000);
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ========================================================================
//  Run those babies!
//  ------------------------------------------------------------------------

/*
TP.core.UIElementNode.Inst.runTestSuites();
*/

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
