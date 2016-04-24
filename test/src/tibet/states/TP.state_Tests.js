//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

/*
 *  TODO:
 *
 *  - add test(s) for defining signals only via transition details
 *  - add tests for adding guard functions only via transition details
 *  - add tests to ensure we can default guards based on signal input
 */

//  ------------------------------------------------------------------------

TP.core.StateMachine.describe('start and final states',
function() {

    var machine;

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
    });

    this.afterEach(function() {
        machine.deactivate(true);
        machine = null;
    });

    this.it('can define states with no initial state', function(test, options) {

        machine.defineState(null, 'initial');

        this.assert.isEqualTo(
            machine.$get('byTarget').at('initial'),
            [[null, TP.hc()]]);
    });

    this.it('can define states with no target state', function(test, options) {

        machine.defineState('final');

        this.assert.isEqualTo(
            machine.$get('byInitial').at('final'),
            [[null, TP.hc()]]);
    });

    this.it('can define state targets in separate steps', function(test, options) {

        machine.defineState(null, 'start');
        machine.defineState('start', 'left');
        machine.defineState('start', 'right');
        machine.defineState('finish');

        this.assert.isEqualTo(
            machine.$get('byInitial').at('start'),
            [['left', TP.hc()], ['right', TP.hc()]]);
    });

    this.it('can define initial states with array of targets', function(test, options) {

        machine.defineState('foo', ['bar', 'baz']);

        this.assert.isEqualTo(
            machine.$get('byInitial').at('foo'),
            [['bar', TP.hc()], ['baz', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byTarget').at('bar'),
            [['foo', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byTarget').at('baz'),
            [['foo', TP.hc()]]);
    });

    this.it('can define target states with array of initials', function(test, options) {

        machine.defineState(['bar', 'baz'], 'moo');

        this.assert.isEqualTo(
            machine.$get('byInitial').at('bar'),
            [['moo', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byInitial').at('baz'),
            [['moo', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byTarget').at('moo'),
            [['bar', TP.hc()], ['baz', TP.hc()]]);
    });

    this.it('can define initials and targets as arrays', function(test, options) {

        machine.defineState(['bar', 'baz'], ['moo', 'goo']);

        this.assert.isEqualTo(
            machine.$get('byInitial').at('bar'),
            [['moo', TP.hc()], ['goo', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byInitial').at('baz'),
            [['moo', TP.hc()], ['goo', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byTarget').at('moo'),
            [['bar', TP.hc()], ['baz', TP.hc()]]);

        this.assert.isEqualTo(
            machine.$get('byTarget').at('goo'),
            [['bar', TP.hc()], ['baz', TP.hc()]]);
    });

    this.it('can find potential start states', function(test, options) {

        machine.defineState(null, 'initial');
        machine.defineState(null, 'initial2');

        machine.defineState('blah', 'notinitial');

        machine.defineState('woof', 'notinitialeither');

        this.assert.isEqualTo(
            machine.$getStartStates(),
            ['initial', 'initial2']);
    });

    this.it('can find potential final states', function(test, options) {

        machine.defineState('final');
        machine.defineState('final2');

        machine.defineState('notfinal', 'blah');

        machine.defineState('notfinaleither', 'woof');

        this.assert.isEqualTo(
            machine.$getFinalStates(),
            ['final', 'final2']);
    });
});

//  ------------------------------------------------------------------------

TP.core.StateMachine.describe('activate',
function() {

    var machine;

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
    });

    this.afterEach(function() {
        machine.deactivate(true);
        machine = null;
    });

    this.it('cannot activate without a start state', function(test, options) {
        this.assert.raises(
            function() {
                machine.activate();
            },
            'InvalidStartState');
    });

    this.it('can activate if there is a start state', function(test, options) {

        machine.defineState(null, 'initial');

        machine.activate();

        this.assert.isEqualTo(machine.get('state'), 'initial');
    });

    this.it('validates activate state is a start state', function(test, options) {

        machine.defineState(null, 'initial');

        machine.defineState('initial', 'fluffy');
        machine.defineState('fluffy');

        this.assert.raises(
            function() {
                machine.activate('fluffy');
            },
            'InvalidStartState');
    });

    this.it('can use explicit activate start state', function(test, options) {

        machine.defineState(null, 'initial');
        machine.defineState(null, 'initial2');

        machine.activate('initial2');

        this.assert.isEqualTo(machine.get('state'), 'initial2');
    });

    this.it('cannot activate with ambiguous start state', function(test, options) {

        machine.defineState(null, 'initial');
        machine.defineState(null, 'initial2');

        this.assert.raises(
            function() {
                machine.activate();
            }, 'InvalidStartState');
    });

    this.it('cannot activate an active state machine', function(test, options) {

        machine.defineState(null, 'initial');

        machine.activate();

        this.assert.raises(
            function() {
                machine.activate();
            },
            'InvalidOperation');
    });

    this.it('runs start state transition guard functions', function(test, options) {
        var called;

        machine.defineState(null, 'initial');

        machine.defineMethod('acceptInitial', function() {
            called = true;
            return true;
        });

        machine.activate();

        this.assert.isTrue(called);
    });

    this.it('rejects activation if start state guard fails', function(test, options) {
        var result;

        machine.defineState(null, 'initial');

        machine.defineMethod('acceptInitial', function() {
            return false;
        });

        result = machine.activate();

        this.assert.isFalse(result);
    });
});

//  ------------------------------------------------------------------------

TP.core.StateMachine.describe('deactivate',
function() {

    var machine;

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
    });

    this.afterEach(function() {
        machine.deactivate(true);
        machine = null;
    });

    this.it('cannot deactivate unless in final state', function(test, options) {
        var result;

        machine.defineState(null, 'start');
        machine.defineState('start', 'notfinal');

        result = machine.activate();

        this.assert.isTrue(result);

        this.assert.raises(function() {
            result = machine.deactivate();
        }, 'InvalidFinalState');

        this.assert.isFalse(result);
    });

    this.it('can force deactivate from non-final state', function(test, options) {
        var result;

        machine.defineState(null, 'start');
        machine.defineState('start', 'notfinal');

        result = machine.activate();

        this.assert.isTrue(result);

        result = machine.deactivate(true);

        this.assert.isTrue(result);
    });

    this.it('automatically deactivates on final-only state completion', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.activate();

        machine.defineMethod('deactivate', function() {
            called = true;
        });

        machine.transition(TP.hc('state', 'finish'));

        this.assert.isTrue(called);
    });

    this.it('cannot deactivate an inactive state machine', function(test, options) {
        this.assert.raises(
            function() {
                machine.deactivate();
            }, 'InvalidOperation');
    });
});

//  ------------------------------------------------------------------------

TP.core.StateMachine.describe('transitions',
function() {

    var machine,
        controller;

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
        controller = TP.core.Controller.construct();
    });

    this.afterEach(function() {
        machine.deactivate(true);
        machine = null;
        controller = null;
    });

    this.it('invokes state machine update for new trigger inputs', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        machine.defineMethod('updateCurrentState', function() {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('invokes state transition for activation state', function(test, options) {
        var params,
            called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.defineMethod('transition', function(details) {
            called = true;
            params = details;
        });

        machine.activate();

        machine.deactivate(true);

        this.assert.isTrue(called);
        this.assert.isEqualTo(params.at('state'), 'start');
    });

    this.it('invokes state transition for new trigger inputs', function(test, options) {
        var params,
            called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        called = 0;

        machine.defineMethod('transition', function(details) {
            called += 1;
            params = details;
            //  NOTE we have to still set the state on the first pass or the
            //  second pass won't process correctly since we won't have actually
            //  transitioned in a concrete sense.
            machine.$setState(details.at('state'));
        });

        machine.activate();             //  first call occurs here...

        TP.signal(TP.ANY, 'Fluffy');    //  second call here...

        machine.deactivate(true);

        this.assert.isEqualTo(called, 2);
        this.assert.isEqualTo(params.at('state'), 'finish');
    });

    this.it('raises when multiple-choice transition', function(test, options) {

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('start', 'notfinish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        machine.activate();

        this.assert.raises(function() {
            TP.signal(TP.ANY, 'Fluffy');
        }, 'InvalidStateTransition');

        machine.deactivate(true);
    });

    this.it('accepts looped start and final state', function(test, options) {
        var called;

        machine.defineState(null, 'idle');
        machine.defineState('idle', 'busy');
        machine.defineState('busy', 'idle');
        machine.defineState('idle');

        called = 0;
        machine.defineMethod('transition', function(details) {
            called += 1;
            //  NOTE we have to still set the state on the first pass or the
            //  second pass won't process correctly since we won't have actually
            //  transitioned in a concrete sense.
            machine.$setState(details.at('state'));
        });

        machine.addTrigger(TP.ANY, 'Fluffy');

        machine.activate();             //  first call occurs here...

        TP.signal(TP.ANY, 'Fluffy');    //  second call here...

        this.assert.isTrue(called > 0);

        machine.deactivate(true);
    });

    this.it('runs transition guard functions', function(test, options) {
        var params,
            called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        machine.defineMethod('acceptFinish', function(details) {
            called = true;
            params = details;
            return true;
        });

        //  ---
        //  signal-driven transition version
        //  ---

        machine.activate();
        TP.signal(TP.ANY, 'Fluffy');
        machine.deactivate(true);

        this.assert.isTrue(called);
        this.assert.isKindOf(params, 'TP.sig.Signal');

        //  ---
        //  manual transition version
        //  ---
/*
        called = false;
        machine.activate();
        machine.transition(TP.hc('state', 'finish'));
        machine.deactivate(true);

        this.assert.isTrue(called);
        this.assert.isKindOf(params, 'TP.core.Hash');
*/
    });

    this.it('rejects transitions where guard returns false', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        machine.defineMethod('acceptFinish', function(details) {
            called = true;
            return false;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        this.assert.isTrue(called);
        this.assert.isEqualTo(machine.get('state'), 'start');

        machine.deactivate(true);
    });

    this.it('specializes transition guard names by current state', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        machine.defineMethod('acceptFinishWhenStart', function(details) {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('skips guard if triggering signal does not pass', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'left',
            {trigger: TP.ac('Special', 'Left'),
                guard: 'checkIt'});
        machine.defineState('start', 'right',
            {trigger: 'Right'});
        machine.defineState('finish');

        machine.defineMethod('checkIt', function() {
            called = true;
            return true;
        });

        //  This observation triggers the machine to test, but the transition
        //  for Left should still fail.
        machine.addTrigger(TP.ANY, 'Left');
        result = machine.activate();
        TP.signal('Blah', 'Left');

        this.refute.isTrue(called);
    });

    this.it('invokes local machine methods for internal transitions', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Force the transition to be an internal one...
        machine.defineMethod('acceptFinish', function(details) {
            return false;
        });
        machine.defineHandler('StateInput', function(details) {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('specializes internal transition methods by current state', function(test, options) {
        var called;

        TP.sys.getApplication().setStateMachine(machine);

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Force the transition to be an internal one...
        machine.defineMethod('acceptFinish', function(details) {
            return false;
        });

        //  Add state-specific handler method for input processing.
        machine.defineHandler(
            {signal: 'StateInput', state: 'Start'},
            function(details) {
                called = true;
            });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);

        TP.sys.getApplication().removeStateMachine(machine);
    });

    this.it('signals potential listeners for trigger inputs', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Force the transition to be an internal one...
        machine.defineMethod('acceptFinish', function(details) {
            return false;
        });

        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler('StartInput', function(aSignal) {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
    });

    this.it('signals exit for the old state', function(test, options) {
        var called,
            prior,
            next;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler('StartExit', function(aSignal) {
            called = true;
            prior = aSignal.at('prior');
            next = aSignal.at('state');
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
        this.assert.isEqualTo(prior, 'start');
        this.assert.isEqualTo(next, 'finish');
    });

    this.it('specializes state exit for the old state', function(test, options) {
        var called,
            prior,
            next;

        TP.sys.getApplication().setStateMachine(machine);

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Define a simple observation for call check.
        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler(
            {signal: 'StateExit', state: 'Start'},
        function(aSignal) {
            called = true;
            prior = aSignal.at('prior');
            next = aSignal.at('state');
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
        this.assert.isEqualTo(prior, 'start');
        this.assert.isEqualTo(next, 'finish');

        TP.sys.getApplication().removeStateMachine(machine);
    });

    this.it('signals transition for the new state', function(test, options) {
        var called,
            prior,
            next;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler('FinishTransition',
        function(aSignal) {
            called = true;
            prior = aSignal.at('prior');
            next = aSignal.at('state');
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
        this.assert.isEqualTo(prior, 'start');
        this.assert.isEqualTo(next, 'finish');
    });

    this.it('specializes transition for the new state by current state', function(test, options) {
        var called,
            prior,
            next;

        TP.sys.getApplication().setStateMachine(machine);

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler(
            {signal: 'FinishTransition', state: 'Start'},
        function(aSignal) {
            called = true;
            prior = aSignal.at('prior');
            next = aSignal.at('state');
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
        this.assert.isEqualTo(prior, 'start');
        this.assert.isEqualTo(next, 'finish');

        TP.sys.getApplication().removeStateMachine(machine);
    });

    this.it('signals enter for the new state', function(test, options) {
        var called,
            prior,
            next;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler('FinishEnter',
        function(aSignal) {
            called = true;
            prior = aSignal.at('prior');
            next = aSignal.at('state');
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
        this.assert.isEqualTo(prior, 'start');
        this.assert.isEqualTo(next, 'finish');
    });

    this.it('specializes state enter for the new state', function(test, options) {
        var called,
            prior,
            next;

        TP.sys.getApplication().setStateMachine(machine);

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        //  Define a simple observation for call check.
        controller.addStateMachine(machine);
        controller.defineHandler(
            {signal: 'StateEnter', state: 'Finish'},
        function(aSignal) {
            called = true;
            prior = aSignal.at('prior');
            next = aSignal.at('state');
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);
        controller.removeStateMachine(machine);

        this.assert.isTrue(called);
        this.assert.isEqualTo(prior, 'start');
        this.assert.isEqualTo(next, 'finish');

        TP.sys.getApplication().removeStateMachine(machine);
    });

    this.it('can reflect on potential transitions', function(test, options) {

        machine.defineState(null, 'start');
        machine.defineState('start', 'option1');
        machine.defineState('start', 'option2');
        machine.defineState('option1', 'finish');
        machine.defineState('option2', 'finish');
        machine.defineState('finish');

        this.assert.isEqualTo(machine.getTargetStates(null),
            ['start']);
        this.assert.isEqualTo(machine.getTargetStates('start'),
            ['option1', 'option2']);
        this.assert.isEqualTo(machine.getTargetStates('option1'),
            ['finish']);
    });
});

//  ------------------------------------------------------------------------

TP.core.StateMachine.describe('nested states',
function() {

    var machine;

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
    });

    this.afterEach(function() {
        machine.deactivate(true);
        machine = null;
    });

    this.it('activates nested state machine upon outer state enter', function(test, options) {
        var m2,
            called;

        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.activate = function() {
            called = true;
        };

        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.activate();

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('bubbles unhandled triggers to parent machine(s) for processing', function(test, options) {
        var m2,
            called;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.addTrigger(TP.ANY, 'Fluffy');

        //  Disable transition so we get internal transition.
        m2.defineMethod('acceptChildfinish', function() {
            return false;
        });

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.defineHandler('Fluffy', function() {
            called = true;
        });
        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('specializes bubbled triggers by current child state', function(test, options) {
        var m2,
            called;

        TP.sys.getApplication().setStateMachine(machine);

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.addTrigger(TP.ANY, 'Fluffy');

        //  Disable transition so we get internal transition.
        m2.defineMethod('acceptChildfinish', function() {
            return false;
        });

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.defineHandler(
            {signal: 'Fluffy', state: 'Childstart'},
        function() {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);

        TP.sys.getApplication().removeStateMachine(machine);
    });

    this.it('specializes bubbled triggers by current outer state', function(test, options) {
        var m2,
            called;

        TP.sys.getApplication().setStateMachine(machine);

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.addTrigger(TP.ANY, 'Fluffy');

        //  Disable transition so we get internal transition.
        m2.defineMethod('acceptChildfinish', function() {
            return false;
        });

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.defineHandler(
            {signal: 'Fluffy', state: 'Start'},
        function() {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);

        TP.sys.getApplication().removeStateMachine(machine);
    });

    this.it('bubbles unhandled StateInput to parent machine(s) for processing', function(test, options) {
        var m2,
            called;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.addTrigger(TP.ANY, 'Fluffy');

        //  Disable transition so we get internal transition.
        m2.defineMethod('acceptChildfinish', function() {
            return false;
        });

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.defineHandler('StateInput',
        function() {
            called = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('reports current child state as current state', function(test, options) {
        var m2;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.activate();

        this.assert.isEqualTo(machine.getCurrentState(), 'childstart');

        machine.deactivate(true);
    });

    this.it('reports current states as collection of child states plus state', function(test, options) {
        var m2;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.activate();

        this.assert.isEqualTo(machine.getCurrentStates(),
            ['childstart', 'start']);

        machine.deactivate(true);
    });

    this.it('deactivates nested state machines upon outer deactivate', function(test, options) {
        var m2,
            forced,
            called;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.defineMethod('deactivate', function(force) {
            forced = force;
            called = true;
        });

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.activate();

        machine.deactivate(true);

        this.assert.isTrue(called);
        this.assert.isTrue(forced);
    });

    this.it('exits nested state machines upon outer state exit', function(test, options) {
        var m2,
            called;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.defineMethod('exit', function(details) {
            called = true;
        });

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        machine.activate();

        machine.exit();

        //  Child should be cleared after exit.
        this.assert.isNull(machine.get('child'));

        machine.deactivate(true);

        this.assert.isTrue(called);
    });

    this.it('transitions when inner state machine reaches final state', function(test, options) {
        var m2,
            called,
            controller;

        //  Define the inner nested state machine.
        m2 = TP.core.StateMachine.construct();

        m2.defineState(null, 'childstart');
        m2.defineState('childstart', 'childfinish');
        m2.defineState('childfinish');

        m2.addTrigger(TP.ANY, 'Fluffy');

        //  Define the outer state machine.
        machine.defineState(null, 'start', TP.hc('nested', m2));
        machine.defineState('start', 'finish');
        machine.defineState('finish');

        controller = TP.core.Controller.construct();
        controller.addStateMachine(machine);
        controller.defineHandler('FinishEnter',
        function() {
            called = true;
        });

        machine.activate();

        //  This should trigger nested state machine to transition...which ends
        //  up in a final state, which should force outer machine to transition.
        TP.signal(TP.ANY, 'Fluffy');

        this.assert.isNull(m2.get('parent'));
        this.assert.isNull(machine.get('child'));

        controller.removeStateMachine(machine);
        controller = null;

        this.assert.isTrue(called);
    });
});

//  ------------------------------------------------------------------------

TP.core.StateMachine.describe('transition details',
function() {

    var machine;

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
    });

    this.afterEach(function() {
        machine.deactivate(true);
        machine = null;
    });

    this.it('stores transition details', function(test, options) {
        var details;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish', {test: 'yay'});
        machine.defineState('finish');

        details = machine.get('byInitial').at('start');
        details = details.first();

        this.assert.isEqualTo(details.last(), TP.hc('test', 'yay'));
    });

    this.it('triggers based on transition details', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish', {
            trigger: TP.ac(TP.ANY, 'Fluffy')});
        machine.defineState('finish');

        TP.sys.getApplication().defineHandler('FinishEnter',
        function() {
            called = true;
        });

        machine.activate();
        TP.signal(TP.ANY, 'Fluffy');

        this.assert.isTrue(called);
    });

    this.it('can have multiple triggers for a transition', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState('start', 'finish', {
            triggers: TP.ac(
                TP.ac(TP.ANY, 'Fluffy'),
                TP.ac(TP.ANY, 'Fuzzy'))
        });
        machine.defineState('finish');

        TP.sys.getApplication().defineHandler('FinishEnter',
        function() {
            called = true;
        });

        machine.activate();
        TP.signal(TP.ANY, 'Fluffy');

        this.assert.isTrue(called);

        machine.deactivate(true);
        called = false;

        machine.activate();
        TP.signal(TP.ANY, 'Fuzzy');

        this.assert.isTrue(called);
    });

    this.it('guards based on transition details', function(test, options) {
        var called;

        machine.defineState(null, 'start');
        machine.defineState(
                'start', 'finish', {guard: 'checkItOut'});
        machine.defineState('finish');

        machine.defineMethod('checkItOut', function(trigger) {
            called = true;
            return true;
        });

        machine.addTrigger(TP.ac(TP.ANY, 'Fluffy'));
        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        this.assert.isTrue(called);
    });

    this.it('fails with multiple pathways', function(test, options) {

        machine.defineState(null, 'start');
        machine.defineState('start', 'option1');
        machine.defineState('start', 'option2');
        machine.defineState('option1', 'finish');
        machine.defineState('option2', 'finish');
        machine.defineState('finish');

        machine.addTrigger(TP.ANY, 'Fluffy');

        this.assert.raises(
            function() {
                machine.activate();
                TP.signal(TP.ANY, 'Fluffy');
            },
            'InvalidStateTransition');
    });

    this.it('selects pathways based on trigger', function(test, options) {
        var called1,
            called2;

        machine.defineState(null, 'start');
        machine.defineState('start', 'option1', {
            trigger: TP.ac(TP.ANY, 'Fluffy')});
        machine.defineState('start', 'option2', {
            trigger: TP.ac(TP.ANY, 'Foofy')});
        machine.defineState('option1', 'finish');
        machine.defineState('option2', 'finish');
        machine.defineState('finish');

        called1 = false;
        TP.sys.getApplication().defineHandler('Option1Enter',
        function() {
            called1 = true;
        });

        called2 = false;
        TP.sys.getApplication().defineHandler('Option2Enter',
        function() {
            called2 = true;
        });

        machine.activate();

        TP.signal(TP.ANY, 'Fluffy');

        this.assert.isEqualTo(machine.getCurrentState(), 'option1');

        //  Force deactivation, we won't be in a final state here.
        machine.deactivate(true);

        this.assert.isTrue(called1);
        this.assert.isFalse(called2);
    });
});

//  ========================================================================
//  TP.core.StateResponder
//  ========================================================================

TP.core.StateResponder.describe('inputState tests',
function() {

    var machine,
        Responder,
        responder;

        Responder = TP.lang.Object.defineSubtype('TestResponder');
        Responder.addTraits(TP.core.StateResponder);

    this.beforeEach(function() {
        machine = TP.core.StateMachine.construct();
        machine.defineState(null, 'start');
        machine.defineState('start', 'finish');
        machine.defineState('finish', null);

        responder = Responder.construct();
        responder.addStateMachine(machine);
    });

    this.afterEach(function() {
        responder.teardownStateResponder();
        machine.deactivate(true);
        machine = null;
        responder = null;
    });

    this.it('filters state input signals when inputState set',
            function(test, options) {

        //  TODO
        test.assert.isTrue(true);
    });
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
