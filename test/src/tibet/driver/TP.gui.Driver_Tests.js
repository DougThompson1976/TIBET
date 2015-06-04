//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

//  ------------------------------------------------------------------------
//  Driver Fixture
//  ------------------------------------------------------------------------

TP.gui.Driver.Type.defineMethod('getTestFixture',
function(options) {

    var testCase;

    if (TP.isValid(testCase = options.at('testCase'))) {
        return testCase.getDriver();
    }

    return testCase;
});

//  ========================================================================
//  Test Suite
//  ========================================================================

TP.gui.Driver.Inst.describe('Syn test suite',
function() {

    this.it('focus and sendKeys sequence', function(test, options) {

        var uri,
            driver,
            seq;

        uri = TP.uc('~lib_tst/src/tibet/driver/testmarkup.xml');
        test.getDriver().setBodyContent(uri);

        test.then(
            function() {
                driver = TP.gui.Driver.getTestFixture(
                                        TP.hc('testCase', test));

                seq = driver.startSequence();
                seq.sendKeys('ABC[Left][Backspace]D[Right]E',
                                        TP.cpc('#testField'));
                seq.perform();

                test.then(
                    function() {
                        test.assert.isEqualTo(
                            TP.byId('testField',
                                    driver.get('windowContext'),
                                    false).value,
                            'ADCE');
                    });
            });

        //testField = TP.byId('testField',
        //                      test.getDriver().get('windowContext'));

        //testField.focus();
        //driver.startSequence().click(TP.cpc('#testField')).perform();

        //driver.startSequence().sendKeys('[Shift]abcd[Shift-up]').perform();
    });
}).skip(TP.sys.cfg('boot.context') === 'phantomjs');

//  ========================================================================
//  Run those babies!
//  ------------------------------------------------------------------------

/*
TP.gui.Driver.Inst.runTestSuites();
*/

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
