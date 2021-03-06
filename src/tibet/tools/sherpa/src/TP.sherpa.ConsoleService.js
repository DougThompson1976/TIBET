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
 * @type {TP.sherpa.ConsoleService}
 */

//  ----------------------------------------------------------------------------

TP.core.UserIOService.defineSubtype('sherpa.ConsoleService');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  the input cell textarea itself
TP.sherpa.ConsoleService.Inst.defineAttribute('$consoleGUI');

//  an Array that is used to collect 'all results of a command sequence' (i.e
//  multiple shell statements separated by ';' or pipes, etc.)
TP.sherpa.ConsoleService.Inst.defineAttribute('$multiResults');

//  how many characters wide should the output display be? too large a
//  number here will cause horizontal scrolling.
TP.sherpa.ConsoleService.Inst.defineAttribute('width', 80);

//  the underlying TP.core.Shell instance serving as the model for this console
TP.sherpa.ConsoleService.Inst.defineAttribute('model');

//  are we currently blocking on input from the user
TP.sherpa.ConsoleService.Inst.defineAttribute('awaitingInput', false);

//  should IO be concealed? this is used to simulate "password" mode
TP.sherpa.ConsoleService.Inst.defineAttribute('conceal', false);
TP.sherpa.ConsoleService.Inst.defineAttribute('concealedInput');

//  the last input request processed by the receiver
TP.sherpa.ConsoleService.Inst.defineAttribute('lastInputRequest');

//  is this a system console, i.e. should it have logging?
TP.sherpa.ConsoleService.Inst.defineAttribute('systemConsole', false);

//  a timer that runs to mark the current text to be processed after a certain
//  key is held down for a particular amount of time
TP.sherpa.ConsoleService.Inst.defineAttribute('markingTimer');

//  the ID of the last 'non cmd output item' - usually a logging item that we
//  just want to append to.
TP.sherpa.ConsoleService.Inst.defineAttribute('lastNonCmdItemID');

//  a state machine handling keyboard states
TP.sherpa.ConsoleService.Inst.defineAttribute('keyboardStateMachine');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Type.defineMethod('construct',
function(aResourceID, aRequest) {

    /**
     * @method construct
     * @summary Constructs a new console service instance.
     * @description The primary purpose of this custom constructor is to provide
     *     defaulting for the resource ID so we can ensure that a default
     *     SystemConsole instance can be constructed. By leaving the resource ID
     *     null when creating console instances you can ensure that the first
     *     such instance is the SystemConsole.
     * @param {String} aResourceID The unique resource ID for this resource
     *     instance.
     * @param {TP.sig.Request|TP.core.Hash} aRequest A request object or hash
     *     containing parameters including: consoleWindow and consoleNode which
     *     name the window and node to use for the console. A consoleTabs
     *     parameter determines whether a tabset is used.
     * @returns {TP.sherpa.ConsoleService} A new instance.
     */

    var name;

    if (TP.isEmpty(aResourceID)) {
        if (TP.notValid(
                TP.core.Resource.getResourceById('SherpaConsoleService'))) {
            name = 'SherpaConsoleService';
        } else {
            name = 'Console' + Date.now();
        }
    } else {
        name = aResourceID;
    }

    return this.callNextMethod(name, aRequest);
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('init',
function(aResourceID, aRequest) {

    /**
     * @method init
     * @summary Constructor for new instances.
     * @param {String} aResourceID The unique resource ID for this resource
     *     instance.
     * @param {TP.sig.Request|TP.core.Hash} aRequest A request object or hash
     *     containing parameters including: consoleWindow and consoleNode which
     *     name the window and node to use for the console. A consoleTabs
     *     parameter determines whether a tabset is used.
     * @returns {TP.sherpa.ConsoleService} A new instance.
     */

    var request,
        model,

        user,
        userName;

    this.callNextMethod();

    //  make to register ourself before we start signing up for signals... this
    //  way, our registration is not considered a 'handler' registration and
    //  won't be GC'ed when we ignore those signals. This observe/ignore cycle
    //  happens frequently throughout the run of this service.
    this.register();

    //  make sure we have a proper request object and a shell that can
    //  assist us with producing both our user interface and responses
    request = TP.request(aRequest);

    this.set('$consoleGUI', request.at('consoleView'));

    //  set up our model -- the shell
    this.set('model', request.at('consoleModel'));

    //  Make sure that we have a real model
    if (TP.notValid(model = this.getModel())) {
        this.raise('TP.sig.InvalidParameter',
            'Console configuration did not include a shell.');

        return;
    }

    //  list of results from a 'command sequence' that can all be output at once
    this.set('$multiResults', TP.ac());

    //  set up this object to manage stdin, stdout and stderr
    this.configureSTDIO();

    //  get our shell to start by triggering its start method
    model.start(request);

    //  update our overall status
    this.get('$consoleGUI').updateStatus();

    //  put our project identifier in place in the notifier bar
    this.notify(TP.sc(
            'Welcome to Sherpa&#8482; Shift-Right-Click in page to begin editing.'
        ));

    //  Process whatever initial request(s) might be sitting in the queue
    this[TP.composeHandlerName('NextRequest')]();

    //  get started by scrolling to the end (causes the scroller to
    //  resize/reposition)
    this.get('$consoleGUI').scrollOutputToEnd();

    //  observe the console GUI for when it's shown/hidden
    this.observe(this.get('$consoleGUI'), 'HiddenChange');

    //  observe the halo for focus/blur

    this.observe(TP.byId('SherpaHalo', TP.win('UIROOT')),
                    'TP.sig.HaloDidFocus');

    this.observe(TP.byId('SherpaHalo', TP.win('UIROOT')),
                    'TP.sig.HaloDidBlur');

    //  if we're configured to auto-login, try to do that now.
    if (TP.sys.cfg('sherpa.auto_login') &&
        TP.isValid(user = TP.sys.getEffectiveUser()) &&
        TP.notEmpty(userName = user.getUsername())) {

        TP.sig.UserOutputRequest.construct(
            TP.hc('output', 'Sherpa auto-login configured to log in current' +
                            ' effective user "' + userName + '"',
                    'cssClass', 'inbound_announce',
                    'cmdAsIs', true
                    )).fire(model);

        model.login();
    }

    this.observe(TP.ANY, 'TP.sig.ConsoleInput');

    //  Configure the keyboard state machine
    this.configureKeyboardStateMachine();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('configureKeyboardStateMachine',
function() {

    /**
     * @method configureKeyboardStateMachine
     * @summary Configures the keyboard state machine with key responders to
     *     handle the various console modes.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    var keyboardSM,

        currentKeyboard,

        consoleGUI,

        normalResponder,
        autocompleteResponder;

    keyboardSM = TP.core.StateMachine.construct();
    this.set('keyboardStateMachine', keyboardSM);

    currentKeyboard = TP.core.Keyboard.getCurrentKeyboard();

    consoleGUI = this.get('$consoleGUI');

    //  ---  normal

    //  NB: In addition to being responders for state transition signals,
    //  KeyResponder objects also supply handlers for keyboard signals.

    keyboardSM.addTrigger(currentKeyboard,
                            'TP.sig.DOMKeyDown');
    keyboardSM.addTrigger(currentKeyboard,
                            'TP.sig.DOMKeyUp');
    keyboardSM.addTrigger(currentKeyboard,
                            'TP.sig.DOM_Shift_Up__TP.sig.DOM_Shift_Up');

    //  The state machine will transition to 'normal' when it is activated.
    keyboardSM.defineState(null, 'normal');         //  start-able state
    keyboardSM.defineState('normal');               //  final-able state

    normalResponder = TP.sherpa.NormalKeyResponder.construct();
    normalResponder.set('$consoleService', this);
    normalResponder.set('$consoleGUI', consoleGUI);

    keyboardSM.defineHandler('NormalInput', function(aSignal) {
        var triggerSignal;

        triggerSignal = aSignal.getPayload().at('trigger');

        //  Update the 'keyboardInfo' part of the status.
        consoleGUI.updateStatus(triggerSignal, 'keyboardInfo');

        if (normalResponder.isSpecialSignal(triggerSignal)) {
            normalResponder.handle(triggerSignal);
        }

        aSignal.stopPropagation();

        return;
    });

    normalResponder.addStateMachine(keyboardSM);
    normalResponder.addInputState('normal');

    //  ---  autocomplete

    keyboardSM.defineState(
        'normal',
        'autocompletion',
        {
            trigger: TP.ac(currentKeyboard, 'TP.sig.DOM_Ctrl_A_Up')
        });

    keyboardSM.defineState(
        'autocompletion',
        'normal',
        {
            trigger: TP.ac(TP.ANY, 'TP.sig.EndAutocompleteMode')
        });

    autocompleteResponder = TP.sherpa.AutoCompletionKeyResponder.construct();
    autocompleteResponder.set('$consoleService', this);
    autocompleteResponder.set('$consoleGUI', consoleGUI);

    autocompleteResponder.addStateMachine(keyboardSM);
    autocompleteResponder.addInputState('autocompletion');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('configureSTDIO',
function() {

    /**
     * @method configureSTDIO
     * @summary Configures TIBET's stdio hooks to look at the receiver. This
     *     method can be run to cause the receiver to 'own' stdio from the TIBET
     *     system and is usually invoked for system consoles.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    var model;

    //  configure the shell's output to pipe to us...
    if (TP.isValid(model = this.get('model'))) {
        model.attachSTDIO(this);
    }

    if (TP.isWindow(TP.global.$$TIBET) &&
        this.get('$consoleGUI').getNativeWindow() !== TP.global.$$TIBET) {

        TP.tpwin(TP.global.$$TIBET).attachSTDIO(this);
    }

    return this;
});

//  ------------------------------------------------------------------------
//  Display Primitives
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('isAwaitingInput',
function(aFlag) {

    /**
     * @method isAwaitingInput
     * @summary Combined setter/getter for whether the receiver is waiting for
     *     input. This method will interrogate the input cell as part of the
     *     process.
     * @param {Boolean} aFlag An optional new setting.
     * @returns {Boolean} The current input state.
     */

    var val;

    val = this.get('$consoleGUI').getInputContent();

    if (TP.isBoolean(aFlag)) {
        this.$set('awaitingInput', aFlag);
    }

    /* eslint-disable no-extra-parens */
    return (this.$get('awaitingInput') || TP.notEmpty(val));
    /* eslint-enable no-extra-parens */
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('shouldConcealInput',
function(aFlag) {

    /**
     * @method shouldConcealInput
     * @summary Whether or not to conceal input by 'masking' it (i.e. with
     *     something like the '*' character). Returns false for now.
     * @param {Boolean} aFlag The new value to set.
     * @returns {Boolean} Whether or not we should conceal input.
     */

    return false;
});

//  ------------------------------------------------------------------------
//  Event Handling
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('HiddenChange',
function(aSignal) {

    /**
     * @method handleHiddenChangeFromSherpaConsole
     * @summary Handles notifications of when the 'hidden' state of the
     *     SherpaConsole object changes.
     * @param {TP.sig.Change} aSignal The TIBET signal which triggered this
     *     method.
     */

    var isHidden;

    isHidden = TP.bc(aSignal.getOrigin().getAttribute('hidden'));

    //  Install or remove event handlers based on whether the SherpaConsole is
    //  being shown or not.
    if (isHidden) {
        this.removeHandlers();
    } else {
        this.installHandlers();
    }

    return this;
}, {
    origin: 'SherpaConsole'
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('HaloDidFocus',
function(aSignal) {

    /**
     * @method handleHaloDidFocus
     * @summary Handles notifications of when the halo focuses on an object.
     * @param {TP.sig.HaloDidFocus} aSignal The TIBET signal which triggered
     *     this method.
     */

    //  Set the shell '$HALO' and the corresponding '$HALO_TYPE' variables.
    this.get('model').setVariable('HALO',
                                    aSignal.at('haloTarget'));
    this.get('model').setVariable('HALO_TYPE',
                                    aSignal.at('haloTarget').getType());

    this.get('$consoleGUI').focusInput();
    this.get('$consoleGUI').setInputCursorToEnd();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('HaloDidBlur',
function(aSignal) {

    /**
     * @method handleHaloDidBlur
     * @summary Handles notifications of when the halo blurs on an object.
     * @param {TP.sig.HaloDidBlur} aSignal The TIBET signal which triggered
     *     this method.
     */

    //  Set the shell '$HALO' and the corresponding '$HALO_TYPE' variables to
    //  null
    this.get('model').setVariable('HALO', null);
    this.get('model').setVariable('HALO_TYPE', null);

    return this;
});

//  ------------------------------------------------------------------------
//  Key Handling
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('installHandlers',
function() {

    /**
     * @method installHandlers
     * @summary Installs key & mouse handlers to manage the console.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    //  activate the keyboard state machine - note that we do this only if the
    //  Sherpa set up is already complete. Otherwise the core Sherpa will
    //  activate this the first time. This is to allow other components who want
    //  to register responders with this state machine the change to do so
    //  before it is activated.

    if (TP.bySystemId('Sherpa').get('setupComplete')) {
        this.get('keyboardStateMachine').activate();
    }

    //  set up other keyboard observations

    this.observe(TP.core.Keyboard.getCurrentKeyboard(),
                    'TP.sig.DOMModifierKeyChange');

    //  set up mouse observation for status updating

    this.observe(TP.core.Mouse, 'TP.sig.DOMMouseMove');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('removeHandlers',
function() {

    /**
     * @method removeHandlers
     * @summary Removes key & mouse handlers currently managing the console.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    //  deactivate the keyboard state machine
    this.get('keyboardStateMachine').deactivate(true);

    //  remove other keyboard observations

    this.ignore(TP.core.Keyboard.getCurrentKeyboard(),
                'TP.sig.DOMModifierKeyChange');

    //  remove mouse observation for status updating

    this.ignore(TP.core.Mouse, 'TP.sig.DOMMouseMove');

    return this;
});

//  ------------------------------------------------------------------------
//  Other Key Handling
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('DOMModifierKeyChange',
function(aSignal) {

    /**
     * @method handleDOMModifierKeyChange
     * @param {TP.sig.DOMModifierKeyChange} aSignal The TIBET signal which
     *     triggered this handler.
     */

    //  Update the 'keyboardInfo' part of the status.
    this.get('$consoleGUI').updateStatus(aSignal, 'keyboardInfo');

    return;
});

//  ------------------------------------------------------------------------
//  Mouse Handling
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('DOMMouseMove',
function(aSignal) {

    /**
     * @method handleDOMMouseMove
     * @param {TP.sig.DOMMouseMove} aSignal The TIBET signal which
     *     triggered this handler.
     */

    //  Update the 'mouseInfo' part of the status.

    //  If the event happened in our UI canvas, then update with real data from
    //  the signal, otherwise update with 'null' to clear the info.
    if (aSignal.getWindow() === TP.sys.getUICanvas()) {
        this.get('$consoleGUI').updateStatus(aSignal, 'mouseInfo');
    } else {
        this.get('$consoleGUI').updateStatus(null, 'mouseInfo');
    }

    return;
});

//  ------------------------------------------------------------------------
//  Request Handling
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('cancelUserInputRequest',
function(aRequest) {

    /**
     * @method cancelUserInputRequest
     * @summary Cancels a pending user input request, returning control to the
     *     console. The next pending queued request is processed if any are
     *     queued. If no request is provided the last input request is
     *     cancelled.
     * @param {TP.sig.UserInputRequest} aRequest The request to cancel.
     */

    var req,
        consoleGUI;

    //  operate on the request provided, unless we're being asked to default
    //  to the current input request
    req = aRequest;
    if (TP.notValid(req)) {
        req = this.get('lastInputRequest');
        if (TP.notValid(req)) {
            return;
        }
    }

    //  clear our input wait flag so any new input request can be processed
    this.isAwaitingInput(false);

    //  reset the current input request if the request was identical to it.
    if (this.get('lastInputRequest') === req) {
        this.set('lastInputRequest', null);
    } else {
        this.get('requestQueue').remove(req);
    }

    //  cancel the request and let the user know that we did.
    req.cancel();
    this.stdout('Request cancelled.');

    consoleGUI = this.get('$consoleGUI');

    //  reset the prompt and input cell
    consoleGUI.clearInput();

    //  this will default to the GUI's prompt if the model (TSH) doesn't have
    //  one.
    consoleGUI.setPrompt(this.get('model').getPrompt());

    //  process whatever might be sitting in the input request queue
    this[TP.composeHandlerName('NextRequest')]();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('ConsoleRequest',
function(aRequest) {

    /**
     * @method handleConsoleRequest
     * @summary Responds to a request for special console processing. These
     *     requests are used by models to request behavior from the view, if
     *     any, without having to hold a view reference. A good example of a
     *     console request is the ':clear' command.
     * @param {TP.sig.ConsoleRequest} aRequest The signal instance that
     *     triggered this call.
     * @returns {TP.sig.ConsoleResponse} The supplied request's response.
     */

    var cmd,
        consoleGUI,
        response;

    //  consoles only work in response to their model's ID
    if (aRequest.get('requestor') !== this.getModel() &&
        aRequest.getOrigin() !== this.getModel()) {

        return;
    }

    if (TP.notValid(cmd = aRequest.at('cmd'))) {
        return;
    }

    consoleGUI = this.get('$consoleGUI');

    //  If the command is one of the 'built ins' for the console, then perform
    //  the action. Otherwise, it's not one we recognize so we do nothing.
    switch (cmd) {
        case 'clear':
            consoleGUI.clear();
            break;

        case 'input':
            consoleGUI.setInputContent(aRequest.at('body'));
            break;

        default:
            break;
    }

    //  Make sure to complete the request's response and return it.
    response = aRequest.getResponse();
    response.complete();

    return response;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('NoMoreRequests',
function(aRequest) {

    /**
     * @method handleNoMoreRequests
     * @summary Performs any processing required when all queued requests have
     *     been processed. For the console the proper response is typically to
     *     clear the input cell to ensure it's ready for input.
     * @param {TP.sig.Request} aRequest The last request, which sometimes will
     *     need to provide information to this process.
     */

    if (!this.isSystemConsole()) {
        if (TP.isValid(aRequest) && !aRequest.at('cmdInput')) {

            //  this will default to the GUI's prompt if the model (TSH) doesn't
            //  have one.
            this.get('$consoleGUI').setPrompt(this.get('model').getPrompt());
        }
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('RequestCompleted',
function(aSignal) {

    /**
     * @method handleRequestCompleted
     * @summary Responds to notifications that a request is complete, most
     *     often when the receiver was the requestor for the signal.
     * @param {TP.sig.RequestCompleted} aSignal The signal instance that
     *     triggered this call.
     */

    var id,
        consoleGUI,
        request;

    if (TP.canInvoke(aSignal, 'getRequestID')) {
        id = aSignal.getRequestID();
    } else {
        id = aSignal.getOrigin();
    }

    consoleGUI = this.get('$consoleGUI');

    //  if the request is a registered one then we were the responder
    request = this.getRequestById(id);
    if (TP.isValid(request)) {
        //  turn off observation of this origin. NOTE that we ignore both
        //  signal types here since we don't want to assume we should ignore
        //  the update signals during an event sequence
        this.ignore(aSignal.getOrigin(), 'TP.sig.RequestCompleted');
        this.ignore(aSignal.getOrigin(), 'TP.sig.RequestModified');

        //  this will default to the GUI's prompt if the model (TSH) doesn't
        //  have one.
        consoleGUI.setPrompt(this.get('model').getPrompt());

        //  if the registered request was the last input request, then clear it,
        //  clear the console GUI and reset 'awaiting input' and 'should conceal
        //  input'
        if (request === this.get('lastInputRequest')) {

            this.set('lastInputRequest', null);

            consoleGUI.clearInput();

            this.isAwaitingInput(false);
            this.shouldConcealInput(false);
        }
    }

    this[TP.composeHandlerName('NextRequest')]();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('RequestModified',
function(aSignal) {

    /**
     * @method handleRequestModified
     * @summary Responds to notifications that a request has been altered or
     *     updated. These are typically fired by TP.sig.UserInputRequests such
     *     as the TP.sig.UserInputSeries subtype during intermediate stages of
     *     data capture.
     * @param {TP.sig.RequestModified} aSignal The signal instance that
     *     triggered this call.
     */

    //  NOTE:   we don't ignore() here since this signal can be repeated and
    //          we don't want to miss out on the followups
    this.refreshFromRequest(this.getRequestById(aSignal.getRequestID()));

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('ShellRequestCompleted',
function(aSignal) {

    /**
     * @method handleShellRequestCompleted
     * @summary Responds to notifications that a shell request is complete. The
     *     typical response is to output the response via the view.
     * @param {TP.sig.ShellRequest} aSignal The signal instance that
     *     triggered this call.
     */

    this.get('$consoleGUI').updateStatus(aSignal.getRequest());
    this[TP.composeHandlerName('NextRequest')](aSignal);

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('UserInputRequest',
function(aSignal) {

    /**
     * @method handleUserInputRequest
     * @summary Responds to user input requests by either passing control of
     *     the input cell content to the request, or by queueing the request if
     *     the input cell is already spoken for.
     * @param {TP.sig.UserInputRequest} aSignal The signal instance which
     *     triggered this call.
     */

    var model;

    model = this.getModel();

    //  consoles only work in response to their model's ID as either the
    //  origin or the requestor
    if (aSignal.get('requestor') !== model &&
        aSignal.getOrigin() !== model) {
        return;
    }

    if (aSignal.get('responder') !== this) {
        aSignal.set('responder', this);
    }

    this.observe(aSignal.getRequestID(), 'TP.sig.RequestCompleted');
    this.observe(aSignal.getRequestID(), 'TP.sig.RequestModified');

    //  note that if we're busy we have to queue it
    if (this.isAwaitingInput()) {
        this.queueIORequest(aSignal);

        //  when we queue we don't complete the signal so things don't get
        //  ahead of themselves
        return;
    }

    //  track the last request so when input is provided we can bind the
    //  response to the last request and make sure any new requests that
    //  come in will get queued
    this.set('lastInputRequest', aSignal);
    this.isAwaitingInput(true);

    //  track whether we're concealing input too
    this.shouldConcealInput(TP.isTrue(aSignal.at('hideInput')));

    //  it's important to note the use of stdin to do the real work. by
    //  doing it this way we unify the signal and direct-call methods of
    //  getting input
    if (aSignal.isError()) {
        this.stderr(aSignal.at('query'), aSignal);
        this.stdin(null, aSignal.at('default'), aSignal);
    } else {
        if (TP.notValid(aSignal.at('messageType'))) {
            aSignal.atPut('messageType', 'prompt');
        }

        TP.prompt(aSignal.at('query'), aSignal.at('default')).then(
            function(retVal) {

                //  If the value came back empty, then cancel the request. This
                //  is important to close the loop so that we don't have an open
                //  request hanging around.
                if (TP.isEmpty(retVal)) {
                    this.cancelUserInputRequest();

                    return;
                }

                //  Otherwise, send the raw text on to the currently waiting
                //  request and submit that to the shell.
                this.submitRawInput(retVal);

            }.bind(this));
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('UserInputSeries',
function(aSignal) {

    /**
     * @method handleUserInputSeries
     * @summary Responds to user input series by either passing control of the
     *     input cell content to the request, or by queueing the request if the
     *     input cell is already spoken for.
     * @param {TP.sig.UserInputSeries} aSignal The signal instance which
     *     triggered this call.
     */

    return this[TP.composeHandlerName('UserInputRequest')](aSignal);
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('UserOutputRequest',
function(aRequest) {

    /**
     * @method handleUserOutputRequest
     * @summary Responds to user output requests by either displaying the
     *     output or queuing the request if necessary.
     * @param {TP.sig.UserOutputRequest} aRequest The signal instance which
     *     triggered this call.
     */

    //  consoles only work in response to their model's ID as either the
    //  origin or the requestor
    if (aRequest.get('requestor') !== this.getModel() &&
        aRequest.getOrigin() !== this.getModel()) {
        return;
    }

    aRequest.set('responder', this);

    if (aRequest.isError()) {
        if (TP.notEmpty(aRequest.at('message'))) {
            this.stderr(aRequest.at('message'), aRequest);
        } else {
            this.stderr(aRequest.at('output'), aRequest);
        }
    } else {
        this.stdout(aRequest.at('output'), aRequest);
    }

    aRequest.complete();

    //  NOTE that some shell execution pathways use a TP.sig.UserOutputRequest
    //  as their way of doing all the work, so we update from that request
    this.get('$consoleGUI').updateStatus(aRequest);
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('refreshFromRequest',
function(aRequest) {

    /**
     * @method refreshFromRequest
     * @summary Refreshes the input cell, along with optional prompt and
     *     default data.
     * @param {TP.sig.UserInputRequest} aRequest An input request containing
     *     processing instructions.
     */

    var query,
        consoleGUI,
        def,
        hide;

    consoleGUI = this.get('$consoleGUI');

    if (TP.notEmpty(query = aRequest.at('query'))) {
        consoleGUI.setPrompt(query);
    }

    if (TP.notEmpty(def = aRequest.at('default'))) {
        consoleGUI.setInputContent(def);

        //  If the request specifies to select the default text, then do it.
        if (aRequest.at('select')) {
            consoleGUI.get('consoleInput').get('$editorObj').execCommand(
                                                            'selectAll');
        }
    }

    if (TP.isValid(hide = aRequest.at('hideInput'))) {
        this.shouldConcealInput(hide);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('submitRawInput',
function(anInput) {

    /**
     * @method submitRawInput
     * @summary Submits the supplied raw input to the shell for execution.
     * @param {String} anInput The text to submit to the shell as input
     */

    //  Fire off the input content to the shell. Note here how we configure the
    //  request to:
    //      1. Generate a history entry
    //      2. Not be silent with it's output
    //      3. Echo the input as output
    this.sendShellRequest(
        anInput,
        TP.hc('cmdHistory', true, 'cmdSilent', false, 'cmdEcho', true));

    return;
});

//  ------------------------------------------------------------------------
//  Model Signals
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('Cancel',
function(anEvent) {

    /**
     * @method handleCancel
     * @summary Processes requests to cancel the current job and return control
     *     of the input cell to the shell.
     * @param {Event} anEvent A JS/DOM Event object.
     */

    TP.eventPreventDefault(anEvent);

    //  NOTE:   the implication here is that the input cell in the console is
    //          currently waiting for user input, and the user has decided to
    //          'Esc' the prior request. In that state the command itself has
    //          made an input request and hasn't gotten notification of input
    //          being ready, so we can cancel it.
    this.cancelUserInputRequest();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('Change',
function(aSignal) {

    /**
     * @method handleChange
     * @summary Responds to signals the the model has changed state. This is
     *     typically reflected in the tool/status bar.
     * @param {Change} aSignal The change signal which triggered this method.
     */

    if (aSignal.get('origin') === this.getModel()) {

        //  avoid inheritance firing's dispatch to shell hierarchy
        aSignal.stopPropagation();
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('ClearInput',
function(anEvent) {

    /**
     * @method handleClearInput
     * @summary Processes requests to clear the input cell completely.
     * @param {Event} anEvent A JS/DOM Event object.
     */

    TP.eventPreventDefault(anEvent);
    this.get('$consoleGUI').clearInput();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('HistoryNext',
function(anEvent) {

    /**
     * @method handleHistoryNext
     * @summary Processes requests to move the history index forward one
     *     position. Note that this operates on the current responder so that
     *     each responder can maintain its own history list.
     * @param {Event} anEvent A JS/DOM Event object.
     */

    var model,
        consoleGUI,
        cmd;

    if (TP.notValid(model = this.get('model'))) {
        return;
    }

    consoleGUI = this.get('$consoleGUI');

    //  Move forward in the history index and, if there is a valid command, use
    //  it. Otherwise, clear the input.
    cmd = model.getHistory(model.incrementHistoryIndex());
    if (TP.isValid(cmd)) {
        consoleGUI.setInputContent(cmd);
    } else {
        consoleGUI.clearInput();
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('HistoryPrev',
function(anEvent) {

    /**
     * @method handleHistoryPrev
     * @summary Processes requests to move the history index back one position.
     *     Note that this operates on the current responder so that each
     *     responder can maintain its own history list.
     * @param {Event} anEvent A JS/DOM Event object.
     */

    var model,
        consoleGUI,
        cmd;

    if (TP.notValid(model = this.get('model'))) {
        return;
    }

    consoleGUI = this.get('$consoleGUI');

    //  Move backward in the history index and, if there is a valid command, use
    //  it. Otherwise, clear the input.
    cmd = model.getHistory(model.decrementHistoryIndex());
    if (TP.isValid(cmd)) {
        consoleGUI.setInputContent(cmd);
    } else {
        consoleGUI.clearInput();
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineHandler('ConsoleInput',
function(aSignal) {

    /**
     * @method handleConsoleInput
     * @summary Handles raw input and converts it into an appropriate input
     *     response.
     * @param {TP.sig.ConsoleInput} aSignal The signal which triggered this
     *     method.
     */

    var consoleGUI,
        input;

    consoleGUI = this.get('$consoleGUI');

    //  capture the text content of the input cell. we'll be passing this
    //  along to the responder if it's got any content
    input = consoleGUI.getInputContent();
    if (TP.notValid(input)) {
        //  oops, not even an empty string value - the value must not be 'ready'
        return;
    }

    //  always clear the input cell to provide visual feedback that we've
    //  accepted the input and are working on it
    consoleGUI.clearInput();

    //  Reset the number of 'new output items' in the console GUI to 0
    consoleGUI.set('newOutputCount', 0);

    this.submitRawInput(input);

    //  Make sure that the console GUI clears its eval mark
    consoleGUI.teardownEvalMark();

    return;
});

//  ------------------------------------------------------------------------
//  General Purpose
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('sendConsoleRequest',
function(rawInput, options) {

    /**
     * @method sendConsoleRequest
     * @summary Sends a 'console request', which may be input to the shell or
     *     just command text that only the console itself processes.
     * @param {String} rawInput A String of raw input.
     * @param {Request|TP.core.Hash} [options] Options for the request.
     * @returns {TP.sig.ShellRequest|TP.sig.ConsoleRequest} The newly created
     *     request.
     */

    var consoleGUI,
        text,
        params,
        req;

    if (TP.notEmpty(rawInput)) {

        consoleGUI = this.get('$consoleGUI');

        //  Strip off any enclosing quotes (either single or double) wrapping
        //  the raw input.
        text = rawInput.stripEnclosingQuotes();

        //  If the input is a shell command, then execute it as one.
        if (this.isShellCommand(text)) {
            req = this.sendShellRequest(text, options);
        } else {

            //  Otherwise, just execute it as a command to the console.
            params = TP.hc(options);

            text = text.slice(1);
            params.atPut('cmd', text);

            //  Configure the request to:
            //      1. Not generate a history entry
            //      2. Be silent
            //      3. Echo the command to the output
            params.atPutIfAbsent('cmdHistory', false);
            params.atPutIfAbsent('cmdSilent', true);
            params.atPutIfAbsent('cmdEcho', true);

            req = TP.sig.ConsoleRequest.construct(params);

            req.fire(this.get('model'));

            consoleGUI.setPrompt(this.get('model').getPrompt());
        }

        consoleGUI.focusInput();
        consoleGUI.setInputCursorToEnd();
    }

    return req;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('sendShellRequest',
function(rawInput, options) {

    /**
     * @method sendShellRequest
     * @summary Sends a 'shell request', which, unlike a ConsoleRequest, *must*
     *     be input to the shell.
     * @param {String} rawInput A String of raw input.
     * @param {Request|TP.core.Hash} [options] Options for the request.
     * @returns {TP.sig.ShellRequest} The newly created request.
     */

    var res,
        req,
        params,
        model;

    if (TP.notEmpty(rawInput)) {

        //  two options here...one is we find an input request that caused
        //  display of the input cell (in which case that request "owns" the
        //  input and we forward to that input request) or we got new input in
        //  which case we build a shell request and forward it to the shell
        if (TP.notValid(req = this.get('lastInputRequest'))) {
            if (TP.notValid(model = this.get('model'))) {
                this.raise('TP.sig.InvalidModel',
                            'Console has no attached shell instance');

                return;
            }

            params = TP.hc(options);

            params.atPut('cmd', rawInput);
            params.atPutIfAbsent('async', true);

            //  Control these for interactive use. Normally off for "UI
            //  triggered" activity
            params.atPutIfAbsent('cmdHistory', false);
            params.atPutIfAbsent('cmdSilent', false);
            params.atPutIfAbsent('cmdEcho', true);

            params.atPutIfAbsent('cmdAllowSubs', true);
            params.atPutIfAbsent('cmdExecute', true);
            params.atPutIfAbsent('cmdBuildGUI', true);
            params.atPutIfAbsent('cmdLogin', true);
            params.atPutIfAbsent('cmdPhases', 'nocache');

            req = TP.sig.ShellRequest.construct(params);

            req.set('requestor', this);
            TP.handle(model, req);
        } else {
            //  input request owns the response data...ask it to handle the
            //  response so it can manage what that means. effectively by
            //  calling handle directly we're simulating having fired the
            //  response without the overhead of actually doing the signaling.
            res = req.getResponse();
            res.set('result', rawInput);

            TP.handle(req, res);
        }
    }

    return req;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('getModel',
function() {

    /**
     * @method getModel
     * @summary Returns the model which this view is displaying IO for.
     * @returns {TP.core.Shell} The shell instance serving out output.
     */

    return this.$get('model');
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('getWidth',
function() {

    /**
     * @method getWidth
     * @summary Returns the maximum width of unbroken strings in the console.
     *     This value will default to the WIDTH variable setting.
     * @returns {Number} The maximum width of an unbroken String in the console.
     */

    var model,
        val;

    if (TP.isValid(model = this.getModel())) {
        if (TP.isValid(val = model.getVariable('WIDTH'))) {
            return val;
        }
    }

    if (TP.notValid(val)) {
        val = this.$get('width');
    }

    //  push value to model if it exists
    if (TP.isValid(model)) {
        model.setVariable('WIDTH', val);
    }

    return val;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('isShellCommand',
function(aCommandText) {

    /**
     * @method isShellCommand
     * @summary Returns whether the supplied command text is a 'shell command'.
     *     Certain commands, like ':clear', are not.
     * @param {String} aCommandText A String of raw input.
     * @returns {Boolean} Whether or not the supplied command text is a shell
     *     command.
     */

    //  These are pure console commands, not shell commands
    if (aCommandText === ':clear' || aCommandText === ':input') {
        return false;
    }

    return true;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('isSystemConsole',
function(aFlag) {

    /**
     * @method isSystemConsole
     * @summary Returns true if the receiver is a system console. The system
     *     console 'owns' the TIBET stdio hooks allowing it to display log
     *     output etc.
     * @param {Boolean} aFlag An optional flag to set as the new system console
     *     status.
     * @returns {Boolean} Whether or not the receiver is a system console.
     */

    //  TODO:   use this flag to control which console has stdio ownership
    if (TP.isBoolean(aFlag)) {
        this.$set('systemConsole', aFlag);
    }

    return this.$get('systemConsole');
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('setModel',
function(aModel) {

    /**
     * @method setModel
     * @summary Sets the model (shell) the console is interacting with.
     * @param {TP.core.Shell} aModel The model instance.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    var model;

    //  clear observations of any prior model
    if (TP.isValid(model = this.getModel())) {
        this.ignore(model);
    }

    //  TODO:   do we want to default to a system-level TSH instance here?
    if (TP.notValid(aModel)) {
        return this.raise('TP.sig.InvalidModel');
    }

    this.$set('model', aModel);

    //  this will default to the GUI's prompt if the model (TSH) doesn't have
    //  one.
    this.get('$consoleGUI').setPrompt(aModel.getPrompt());

    //  watch model for events so we keep things loosely coupled
    this.observe(aModel, TP.ANY);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('setWidth',
function(aWidth) {

    /**
     * @method setWidth
     * @summary Sets the maximum width of unbroken strings in the console. Note
     *     that this only affects newly constructed items; older items are not
     *     reflowed.
     * @param {Number} aWidth The character count to use.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    var model,
        width;

    width = aWidth;
    if (TP.notValid(width)) {
        width = this.$get('width');
    }

    if (TP.isValid(model = this.getModel())) {
        model.setVariable('WIDTH', width);
    } else {
        this.$set('width', width);
    }

    return this;
});

//  ------------------------------------------------------------------------
//  STDIO Handling
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('notify',
function(anObject, aRequest) {

    /**
     * @method notify
     * @summary Updates the console notice bar using data from the object. A
     *     few common object types are handled specifically including
     *     TP.sig.Requests, Error/Exceptions, and Strings. Other objects are
     *     converted as well as possible and use the optional level parameter
     *     when they can't provide one.
     * @param {Object} anObject The message and level source.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object with optional
     *     values for messageType, cmdAsIs, etc.
     */

    var notifier,
        notifierContent,

        triggerTPDoc;

    notifier = TP.byId('SherpaNotifier', TP.win('UIROOT'));
    notifier.setStyleProperty(
                '--sherpa-notifier-fadeout-duration',
                TP.sys.cfg('sherpa.notifier_fadeout_duration', 5000) + 'ms');
    notifier.setStyleProperty(
                '--sherpa-notifier-fadeout-delay',
                TP.sys.cfg('sherpa.notifier_fadeout_delay', 5000) + 'ms');

    notifierContent = TP.byId('SherpaNotifierContent', TP.win('UIROOT'));
    if (TP.notValid(notifierContent)) {
        return;
    }

    notifierContent.setContent(
        TP.xhtmlnode('<div>' + TP.str(anObject) + '</div>'),
        aRequest);

    triggerTPDoc = TP.tpdoc(TP.win('UIROOT'));

    this.signal(
        'OpenNotifier',
        TP.hc(
            'overlayID', 'SherpaNotifier',
            'contentID', 'SherpaNotifierContent',
            'noPosition', true,
            'triggerTPDocument', triggerTPDoc));

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('stderr',
function(anError, aRequest) {

    /**
     * @method stderr
     * @summary Outputs the error provided using any parameters in the request
     *     to assist with formatting etc. Parameters include messageType,
     *     messageLevel, cmdAsIs, etc.
     * @param {String} anError The error to output.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object with optional
     *     values for messageType, cmdAsIs, etc.
     */

    var request,
        err;

    if (TP.isValid(aRequest)) {
        aRequest.atPutIfAbsent('messageType', 'failure');
        request = aRequest;
    } else {
        request = TP.hc('messageType', 'failure');
    }

    request.atPutIfAbsent('messageLevel', 'error');

    err = TP.isError(anError) ? anError : new Error(anError);
    request.set('result', err);

    try {

        //  Write input content if we haven't already written it.
        if (TP.notTrue(request.at('inputWritten'))) {
            this.writeInputContent(request);
        }

        //  Write output content
        this.writeOutputContent(err, request);

    } catch (e) {
        TP.ifError() ?
            TP.error(TP.ec(
                        e,
                        TP.join('TP.sherpa.ConsoleService.stderr(',
                                TP.str(err), ') generated error.')
                     )) : 0;
    }

    //  Clear any 'multi results' that were getting batched
    this.get('$multiResults').empty();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('stdin',
function(aQuery, aDefault, aRequest) {

    /**
     * @method stdin
     * @summary Displays the input cell, along with optional prompt and default
     *     data. This method must be called at least once to provide an input
     *     cell for the user.
     * @param {String} aQuery An optional query string to format as a question
     *     for the user.
     * @param {String} aDefault An optional string value to insert into the
     *     input cell.
     * @param {TP.sig.UserInputRequest} aRequest An input request containing
     *     processing instructions.
     */

    var consoleGUI;

    consoleGUI = this.get('$consoleGUI');

    consoleGUI.setPrompt(aQuery);
    consoleGUI.setInputContent(aDefault);

    //  If the request specifies to select the default text, then do it.
    if (aRequest.at('select')) {
        consoleGUI.get('consoleInput').get('$editorObj').execCommand(
                                                            'selectAll');
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('stdout',
function(anObject, aRequest) {

    /**
     * @method stdout
     * @summary Outputs the object provided using any parameters in the request
     *     to assist with formatting etc. Parameters include messageType,
     *     cmdAsIs, etc.
     * @param {Object} anObject The object to output in string form.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object with optional
     *     values for messageType, cmdAsIs, etc.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     */

    var request,

        cmdSequence,

        outObject,

        append;

    //  We should see multiple output calls, at least one of which is the
    //  cmdConstruct notifier which tells us to build our output item.
    if (aRequest && aRequest.at('cmdConstruct') === true) {
        return;
    }

    request = TP.request(aRequest);

    outObject = anObject;

    //  If the supplied request is part of a command sequence and the sequence
    //  has more than one item in it, then we gather them all up in a 'multi
    //  result' set for flushing to the GUI all at once.
    if ((cmdSequence = request.at('cmdSequence')) &&
         cmdSequence.getSize() > 1) {

        this.get('$multiResults').push(outObject);

        //  If it's not the last one - return
        if (request !== cmdSequence.last()) {
            return this;
        } else {
            //  It's the last one - collapse the contents of the $multiResults
            //  Array as the thing to report. Having an Array here with one item
            //  is a common case - a piping sequence will generate a
            //  'cmdSequence' with a single 'out object'.
            outObject = TP.collapse(this.get('$multiResults'));
        }
    }

    //  when a command is set as silent it means we don't do console output
    if (request.at('cmdSilent') || TP.sys.cfg('sherpa.silent')) {

        //  TODO: FIXME
        if (request.atIfInvalid('messageLevel', 0) <= TP.ERROR) {
            return this;
        }
    }

    //  logging output defaults 'append' to true
    if (request.at('messageType') === 'log') {
        append = TP.ifKeyInvalid(request, 'cmdAppend', true);
        request.atPutIfAbsent('cmdAppend', append);
    }

    try {

        //  Write input content if we haven't already written it.
        if (TP.notTrue(request.at('inputWritten'))) {
            this.writeInputContent(request);
        }

        //  Write output content
        this.writeOutputContent(outObject, request);

    } catch (e) {
        TP.ifError() ?
            TP.error(TP.ec(
                        e,
                        TP.join('TP.sherpa.ConsoleService.stdout(',
                                TP.str(outObject), ') generated error.')
                     )) : 0;
    }

    //  Clear any 'multi results' that were getting batched
    this.get('$multiResults').empty();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('writeInputContent',
function(aRequest) {

    /**
     * @method writeInputContent
     * @summary Writes input content to the console GUI.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object with optional
     *     values for messageType, cmdAsIs, etc.
     * @returns {TP.tsh.ConsoleService} The receiver.
     */

    var request,
        rootRequest,

        hid,
        str,
        cssClass,

        inputData,

        itemID;

    request = TP.request(aRequest);

    //  Don't do this twice
    if (TP.isTrue(request.at('inputWritten'))) {
        return;
    }

    //  Let this request and its handlers know that its input has been written.
    request.atPut('inputWritten', true);

    //  If we're 'echo'ing the input, then build up data for the 'input
    //  readout'.
    if (TP.notFalse(request.at('cmdEcho'))) {

        //  update the command title bar based on the latest output from
        //  the particular cmdID this request represents.
        if (TP.notValid(rootRequest = request.at('rootRequest'))) {
            hid = TP.ifKeyInvalid(request, 'cmdHistoryID', '');
            if (TP.isEmpty(str = TP.ifKeyInvalid(request, 'cmdTitle', ''))) {
                str = TP.ifKeyInvalid(request, 'cmd', '');
            }
        } else {
            hid = TP.ifKeyInvalid(rootRequest, 'cmdHistoryID', '');
            if (TP.isEmpty(str =
                            TP.ifKeyInvalid(rootRequest, 'cmdTitle', ''))) {
                str = TP.ifKeyInvalid(rootRequest, 'cmd', '');
            }
        }
    }

    //  We're either not configured to echo input content or we couldn't
    //  generate any - exit here.
    if (TP.isEmpty(str)) {
        return;
    }

    //  Compute the CSS class that we'll use to style the input readout.
    if (TP.isValid(request.at('messageLevel'))) {
        cssClass = request.at('messageLevel').getName().toLowerCase();
    }
    cssClass = TP.ifInvalid(cssClass, 'info');

    //  Build up the input data for the console GUI to template.
    inputData = TP.hc('hid', hid,
                        'cmdText', str,
                        'cssClass', cssClass,
                        'request', request);

    //  Get the unique ID used for the overall output item (containing both the
    //  input readout and the output from the command) for the supplied request.
    itemID = aRequest.at('cmdID');
    if (TP.isEmpty(itemID)) {
        //  Fail - shouldn't get here
        //  empty
    } else {
        //  Replace illegal ID characters with '_' to avoid X(HT)ML naming
        //  issues.
        TP.regex.INVALID_ID_CHARS.lastIndex = 0;
        itemID = itemID.replace(TP.regex.INVALID_ID_CHARS, '_');
        this.get('$consoleGUI').createOutputItem(itemID, inputData);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleService.Inst.defineMethod('writeOutputContent',
function(anObject, aRequest) {

    /**
     * @method writeOutputContent
     * @summary Writes output content to the console GUI.
     * @param {Object} anObject The object to output in string form.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object with optional
     *     values for messageType, cmdAsIs, etc.
     * @returns {TP.sherpa.Console} The receiver.
     */

    var request,

        tiledOutput,

        asIs,

        data,
        tap,
        isLoggingMessage,

        possibleElem,

        cssClass,
        outputData,

        itemID,

        consoleGUI;

    request = TP.request(aRequest);

    tiledOutput = false;

    tap = request.at('cmdTAP');

    //  If the request has structured output, then we blank out the data.
    if (TP.isTrue(request.at('tiledOutput'))) {
        data = '';
        tiledOutput = true;
    } else {

        //  ---
        //  Produce valid XHTML node to test string content, otherwise do our
        //  best to get an XHTML node we can serialize and inject. There are two
        //  flags that drive the logic here: the 'cmdAsIs' flag and the 'cmdBox'
        //  flag. If the 'cmdAsIs' flag is set, then no further operation will
        //  be performed on the output.

        //  ---
        //  asIs() processing
        //  ---

        //  a "common flag" is the asIs flag telling us to skip formatting
        asIs = TP.ifInvalid(request.at('cmdAsIs'), false);

        //  if 'asIs' is not true, we format the data.
        if (TP.notTrue(asIs) && TP.notTrue(tap)) {
            request.atPutIfAbsent('shouldWrap', false);

            data = TP.format(
                    anObject,
                    TP.sys.cfg('sherpa.default_format', 'sherpa:pp').asType(),
                    TP.hc('level', 1,
                            'shouldWrap', false));
        } else {
            //  Otherwise it's 'as is' - take it as it is.

            //  For 'as is' content, we typically are 'rendering markup'. If we
            //  got an Array (a distinct possibility, given the nature of pipes,
            //  etc.), we don't want separators such as commas (',') showing up
            //  in the rendered output. So we set the Array's delimiter to ''
            //  perform an 'asString()' on it.
            if (TP.isArray(anObject)) {
                anObject.set('delimiter', '');
                data = anObject.asString();
            } else if (TP.isElement(possibleElem = TP.unwrap(anObject)) &&
                        TP.w3.Xmlns.getNativeURIs().contains(
                                                possibleElem.namespaceURI)) {
                //  It's an element in a namespace that we support native
                //  rendering of. Just pass it through.
                data = anObject;
            } else {

                //  just use the raw object.
                data = anObject;

                //  make sure its always a String though.
                data = TP.str(data);

                //  and, since we're not feeding it through a formatter (who is
                //  normally responsible for this), make sure its escaped

                //  (ss) We really shouldn't be doing the line below...the asIs
                //  flag is here to say "what's coming through should not be
                //  altered" so we shouldn't alter it.
                // data = data.asEscapedXML();
            }
        }

        //  TODO: replace this hack with an update to direct to the proper
        //  Logger/Appender so we get the output we want via layout/appender.

        if (TP.isTrue(tap)) {
            if (/^ok /.test(data) || /# PASS/i.test(data)) {
                cssClass = 'tap-pass';
            } else if (/^not ok /.test(data) || /# FAIL/i.test(data)) {
                cssClass = 'tap-fail';
            } else if (/^Error /.test(data)) {
                cssClass = 'tap-error';
            } else if (/^#/.test(data)) {
                cssClass = 'tap-comment';
            } else {
                cssClass = 'tap-unknown';
            }
            isLoggingMessage = true;

        } else if (TP.isValid(request.at('messageLevel'))) {
            cssClass = request.at('messageLevel').getName().toLowerCase();
            isLoggingMessage = true;
        } else {
            isLoggingMessage = false;
        }
    }

    //  Build up the output data for the console GUI to template.
    outputData = TP.hc('output', data,
                        'cssClass', cssClass,
                        'rawData', anObject,
                        'request', request,
                        'tiledOutput', tiledOutput,
                        'tiledTarget', request.at('tiledTarget'),
                        'tiledModal', request.at('tiledModal'));

    consoleGUI = this.get('$consoleGUI');

    //  If the request has no cmdID for us to use as a item ID, then this was
    //  probably a call to stdout() that wasn't a direct result of a command
    //  being issued.
    if (TP.isEmpty(itemID = aRequest.at('cmdID')) ||
        TP.isFalse(aRequest.at('reuseItem'))) {

        //  See if there's a current 'non cmd' item that we're using to write
        //  this kind of output. If there isn't one, then create one (but don't
        //  really hand it any data to write out - we'll take care of that
        //  below).
        if (TP.isEmpty(itemID = this.get('lastNonCmdItemID')) ||
            !consoleGUI.shouldCoalesceLogMessages()) {

            //  Replace illegal ID characters with '_' to avoid X(HT)ML naming
            //  issues.
            TP.regex.INVALID_ID_CHARS.lastIndex = 0;
            itemID = 'log' + TP.genID().replace(TP.regex.INVALID_ID_CHARS, '_');

            consoleGUI.createOutputItem(itemID, TP.hc());
            this.set('lastNonCmdItemID', itemID);
        }

        //  Stub in an empty String  for the stats and the word 'LOG' for the
        //  result data type information.
        outputData.atPut('stats', '');
        outputData.atPut('typeinfo', 'LOG');
        outputData.atPut('messageLevel', request.at('messageLevel'));
    } else {
        //  Replace illegal ID characters with '_' to avoid X(HT)ML naming
        //  issues.
        TP.regex.INVALID_ID_CHARS.lastIndex = 0;
        itemID = itemID.replace(TP.regex.INVALID_ID_CHARS, '_');

        this.set('lastNonCmdItemID', null);
        if (isLoggingMessage) {
            //  Stub in an empty String  for the stats and the word 'LOG' for
            //  the result data type information.
            outputData.atPut('stats', '');
            outputData.atPut('typeinfo', 'LOG');
            outputData.atPut('messageLevel', request.at('messageLevel'));
        }
    }

    //  Update the output entry item with the output data.
    consoleGUI.updateOutputItem(itemID, outputData);

    return this;
});

//  ========================================================================
//  TP.sig.ConsoleRequest
//  ========================================================================

/**
 * @type {TP.sig.ConsoleRequest}
 * @summary Request type specific to asking the console to perform some
 *     activity. Requests are used to avoid hard linkages between various
 *     requestors and the console itself. These requests can be made by shells
 *     when they can't be sure there even _is_ a console that's listening.
 */

//  ------------------------------------------------------------------------

TP.sig.Request.defineSubtype('ConsoleRequest');

//  ========================================================================
//  TP.sherpa.ConsoleKeyResponder
//  ========================================================================

TP.core.KeyResponder.defineSubtype('TP.sherpa.ConsoleKeyResponder');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleKeyResponder.Inst.defineAttribute('$consoleService');
TP.sherpa.ConsoleKeyResponder.Inst.defineAttribute('$consoleGUI');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.ConsoleKeyResponder.Inst.defineMethod('isCommandEvent',
function(anEvent) {

    /**
     * @method isCommandEvent
     * @summary Returns true if the event represents a key binding used to
     *     trigger command processing of some kind for the console.
     * @param {Event} anEvent The native event that fired.
     * @returns {Boolean} Whether or not the supplied event has a key binding
     *     that triggers command processing.
     */

    var keyname;

    keyname = TP.eventGetDOMSignalName(anEvent);

    /* eslint-disable no-fallthrough */
    switch (keyname) {

        case 'DOM_Down_Down':
        case 'DOM_Up_Down':

        case 'DOM_Subtract_Down':
        case 'DOM_Add_Down':

        case 'DOM_PageDown_Down':
        case 'DOM_PageUp_Down':

        case 'DOM_Shift_Enter_Down':
        case 'DOM_Shift_Enter_Press':
        case 'DOM_Shift_Enter_Up':

        case 'DOM_Ctrl_Down_Down':
        case 'DOM_Ctrl_Down_Up':
        case 'DOM_Ctrl_Up_Down':
        case 'DOM_Ctrl_Up_Up':

        case 'DOM_Shift_Down_Down':
        case 'DOM_Shift_Down_Up':
        case 'DOM_Shift_Up_Down':
        case 'DOM_Shift_Up_Up':
        case 'DOM_Shift_Right_Down':
        case 'DOM_Shift_Right_Up':
        case 'DOM_Shift_Left_Down':
        case 'DOM_Shift_Left_Up':

        case 'DOM_Alt_Shift_Down_Down':
        case 'DOM_Alt_Shift_Down_Up':
        case 'DOM_Alt_Shift_Up_Down':
        case 'DOM_Alt_Shift_Up_Up':
        case 'DOM_Alt_Shift_Right_Down':
        case 'DOM_Alt_Shift_Right_Up':
        case 'DOM_Alt_Shift_Left_Down':
        case 'DOM_Alt_Shift_Left_Up':

        case 'DOM_Ctrl_U_Down':
        case 'DOM_Ctrl_U_Press':
        case 'DOM_Ctrl_U_Up':

        case 'DOM_Ctrl_K_Down':
        case 'DOM_Ctrl_K_Press':
        case 'DOM_Ctrl_K_Up':

        case 'DOM_Shift_Esc_Down':
        case 'DOM_Shift_Esc_Up':

            return true;

        default:
            return false;
    /* eslint-enable no-fallthrough */
    }
});

//  ------------------------------------------------------------------------

TP.sherpa.ConsoleKeyResponder.Inst.defineMethod('isSpecialSignal',
function(aSignal) {

    /**
     * @method isSpecialSignal
     * @summary Returns whether or not the signal is a 'special signal' that
     *     should be handled by one of this responders handlers.
     * @param {TP.sig.Signal} aSignal The signal that fired.
     * @returns {Boolean} Whether or not the supplied signal is considered to be
     *     a 'special signal'.
     */

    var signame;

    signame = aSignal.getSignalName();

    if (!TP.isKindOf(aSignal, TP.sig.DOMUISignal)) {
        return false;
    }

    switch (signame) {
        case 'TP.sig.DOM_Shift_Up__TP.sig.DOM_Shift_Up':

            return true;

        default:
            return this.isCommandEvent(aSignal.getEvent());
    }
});

//  ========================================================================
//  TP.sherpa.NormalKeyResponder
//  ========================================================================

TP.sherpa.ConsoleKeyResponder.defineSubtype('NormalKeyResponder');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOMKeySignal',
function(aSignal) {

    /**
     * @method handleDOMKeySignal
     * @summary Executes the handler on the receiver (if there is one) for the
     *     trigger signal (the underlying signal that caused a StateInput signal
     *     to be fired from the state machine to this object).
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var sigName,
        handlerName;

    sigName = aSignal.getSignalName();

    switch (sigName) {

        case 'TP.sig.DOM_Shift_Up__TP.sig.DOM_Shift_Up':
            handlerName = TP.composeHandlerName('DOM_Shift_Up__DOM_Shift_Up');
            break;

        default:
            handlerName = TP.composeHandlerName(aSignal.getKeyName());
    }

    if (TP.canInvoke(this, handlerName)) {
        this[handlerName](aSignal);
    }

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Shift_Enter_Up',
function(aSignal) {

    /**
     * @method handleDOM_Shift_Enter_Up
     * @summary Executes the current console input.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    this.get('$consoleService')[TP.composeHandlerName('ConsoleInput')](aSignal);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Shift_Up__DOM_Shift_Up',
function(aSignal) {

    /**
     * @method handleDOM_Shift_Up__DOM_Shift_Up
     * @summary Focuses the input cell.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleGUI;

    consoleGUI = this.get('$consoleGUI');

    //  Focus the console GUI's input and set its cursor to the end.
    consoleGUI.focusInput();
    consoleGUI.setInputCursorToEnd();

    aSignal.stopPropagation();

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Ctrl_Down_Up',
function(aSignal) {

    /**
     * @method handleDOM_Ctrl_Down_Up
     * @summary 'Decreases' the setting of the output mode. This direction moves
     *     from 'all' to 'one' to 'growl'.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleGUI;

    consoleGUI = this.get('$consoleGUI');
    consoleGUI.decreaseOutputDisplayMode();

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Ctrl_Up_Up',
function(aSignal) {

    /**
     * @method handleDOM_Ctrl_Up_Up
     * @summary 'Increases' the setting of the output mode. This direction moves
     *     from 'growl' to 'one' to 'all'.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleGUI;

    consoleGUI = this.get('$consoleGUI');
    consoleGUI.increaseOutputDisplayMode();

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Down_Down',
function(aSignal) {

    /**
     * @method handleDOM_Down_Down
     * @summary Scrolls the last output item down by a line.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleOutput,
        itemContentElems;

    consoleOutput = this.get('$consoleGUI').get('consoleOutput');

    itemContentElems = consoleOutput.get('outputItemsContents');

    if (TP.notEmpty(itemContentElems)) {
        itemContentElems.last().scrollBy(TP.DOWN, TP.LINE, 'height');
    }

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Up_Down',
function(aSignal) {

    /**
     * @method handleDOM_Up_Down
     * @summary Scrolls the last output item up by a line.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleOutput,
        itemContentElems;

    consoleOutput = this.get('$consoleGUI').get('consoleOutput');

    itemContentElems = consoleOutput.get('outputItemsContents');

    if (TP.notEmpty(itemContentElems)) {
        itemContentElems.last().scrollBy(TP.UP, TP.LINE, 'height');
    }

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_PageDown_Down',
function(aSignal) {

    /**
     * @method handleDOM_PageDown_Down
     * @summary Scrolls the last output item down by a page.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleOutput,
        itemContentElems;

    consoleOutput = this.get('$consoleGUI').get('consoleOutput');

    itemContentElems = consoleOutput.get('outputItemsContents');

    if (TP.notEmpty(itemContentElems)) {
        itemContentElems.last().scrollBy(TP.DOWN, TP.PAGE, 'height');
    }

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_PageUp_Down',
function(aSignal) {

    /**
     * @method handleDOM_PageUp_Down
     * @summary Scrolls the last output item up by a page.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    var consoleOutput,
        itemContentElems;

    consoleOutput = this.get('$consoleGUI').get('consoleOutput');

    itemContentElems = consoleOutput.get('outputItemsContents');

    if (TP.notEmpty(itemContentElems)) {
        itemContentElems.last().scrollBy(TP.UP, TP.PAGE, 'height');
    }

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Shift_Down_Up',
function(aSignal) {

    /**
     * @method handleDOM_Shift_Down_Up
     * @summary Places the content of the 'next' history entry, if there is one,
     *     into the input cell.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    this.get('$consoleService')[TP.composeHandlerName('HistoryNext')](aSignal);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Shift_Up_Up',
function(aSignal) {

    /**
     * @method handleDOM_Shift_Up_Up
     * @summary Places the content of the 'previous' history entry, if there is
     *     one, into the input cell.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    this.get('$consoleService')[TP.composeHandlerName('HistoryPrev')](aSignal);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Ctrl_U_Up',
function(aSignal) {

    /**
     * @method handleDOM_Ctrl_U_Up
     * @summary Clears the input cell of any content.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    this.get('$consoleService')[TP.composeHandlerName('ClearInput')](
            aSignal.getEvent());

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Ctrl_K_Up',
function(aSignal) {

    /**
     * @method handleDOM_Ctrl_K_Up
     * @summary Clears the console output of any content
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    //  Clear the output
    this.get('$consoleGUI').get('consoleOutput').clear();

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.NormalKeyResponder.Inst.defineHandler('DOM_Shift_Esc_Up',
function(aSignal) {

    /**
     * @method handleDOM_Shift_Esc_Up
     * @summary Cancels whatever multi-step console command that is in process.
     * @param {TP.sig.StateInput} aSignal The signal that caused the state
     *     machine to get further input. The original triggering signal (most
     *     likely a keyboard-related signal) will be in this signal's payload
     *     under the key 'trigger'.
     * @returns {TP.core.NormalKeyResponder} The receiver.
     */

    this.get('$consoleService')[TP.composeHandlerName('Cancel')](
            aSignal.getEvent());

    return this;
});

//  ========================================================================
//  TP.sherpa.AutoCompletionKeyResponder
//  ========================================================================

TP.sherpa.NormalKeyResponder.defineSubtype('AutoCompletionKeyResponder');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$closeFunc');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$changeHandler');

TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute(
                                                '$finishedCompletion');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$popupContainer');

TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$tshHistoryMatcher');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute(
                                                '$tshExecutionInstanceMatcher');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute(
                                                '$tshCommandsMatcher');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$keywordsMatcher');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$cfgMatcher');
TP.sherpa.AutoCompletionKeyResponder.Inst.defineAttribute('$uriMatcher');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineMethod('init',
function() {

    /**
     * @method init
     * @summary Constructor for new instances.
     * @returns {TP.sherpa.AutoCompletionKeyResponder} A new instance.
     */

    var backgroundElem;

    this.callNextMethod();

    this.set('$tshHistoryMatcher',
                TP.core.TSHHistoryMatcher.construct(
                    'TSH_HISTORY'));

    this.set('$tshExecutionInstanceMatcher',
                TP.core.KeyedSourceMatcher.construct(
                    'TSH_CONTEXT',
                    TP.core.TSH.getDefaultInstance().
                                        getExecutionInstance()));

    this.set('$tshCommandsMatcher',
                TP.core.ListMatcher.construct(
                    'TSH_COMMANDS',
                    TP.ac(
                        'about',
                        'alias',
                        'apropos',
                        'clear',
                        'flag',
                        'reflect',
                        'save',
                        'set')));

    this.set('$keywordsMatcher',
                TP.core.ListMatcher.construct(
                    'JS_COMMANDS',
                    TP.boot.$keywords.concat(TP.boot.$futurereservedwords),
                    'match_keyword'));

    this.set('$cfgMatcher',
                TP.core.ListMatcher.construct(
                    'TIBET_CFG',
                    TP.sys.cfg().getKeys()));

    this.set('$uriMatcher',
                TP.core.URIMatcher.construct(
                    'TIBET_URIS'));


    backgroundElem = TP.byId('background', TP.win('UIROOT'), false);
    this.set('$popupContainer', backgroundElem);

    this.set('$finishedCompletion', false);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('AutocompletionEnter',
function(aSignal) {

    /**
     * @method handleAutocompletionEnter
     * @summary Invoked when the receiver enters it's 'main state'.
     * @param {TP.sig.StateEnter} aSignal The signal that caused the state
     *     machine to enter a state that matches the receiver's 'main state'.
     * @returns {TP.core.AutoCompletionKeyResponder} The receiver.
     */

    var consoleGUI,
        editorObj,

        backgroundElem,
        hintFunc,

        handler;

    consoleGUI = this.get('$consoleGUI');
    editorObj = consoleGUI.get('consoleInput').get('$editorObj');

    backgroundElem = this.get('$popupContainer');
    hintFunc = this.showHint.bind(this);

    //  We manually manage the showing of the autocomplete popup to get better
    //  control.
    editorObj.on(
        'change',
        handler = function(cm, evt) {

            if (this.get('$finishedCompletion')) {
                this.set('$finishedCompletion', false);

                return;
            }

            cm.showHint(
                {
                    hint: hintFunc,
                    container: backgroundElem,  //  undocumented property
                    completeSingle: false,
                    closeOnUnfocus: false
                });

            //  This is pathetic - no way to programmatically shut down the hint
            //  properly, so we have to fish around and get the special,
            //  hardcoded handler for 'Esc' for the hint and invoke that
            //  whenever we want to terminate the hinting programmatically.
            if (TP.isValid(cm.state.keyMaps[0])) {
                this.set('$closeFunc', cm.state.keyMaps[0].Esc);
            } else {
                this.set('$closeFunc', null);
            }

            this.set('$finishedCompletion', false);

        }.bind(this));

    this.set('$changeHandler', handler);

    //  Show the hint (if there are any completions) because we might have
    //  existing content that might match.
    editorObj.showHint(
        {
            hint: hintFunc,
            container: backgroundElem,  //  undocumented property
            completeSingle: false,
            closeOnUnfocus: false
        });

    this.observe(TP.core.Keyboard.getCurrentKeyboard(), 'TP.sig.DOM_Esc_Up');

    consoleGUI.toggleIndicatorVisibility('autocomplete', true);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('AutocompletionExit',
function(aSignal) {

    /**
     * @method handleAutocompletionExit
     * @summary Invoked when the receiver exits it's 'main state'.
     * @param {TP.sig.StateExit} aSignal The signal that caused the state
     *     machine to exit a state that matches the receiver's 'main state'.
     * @returns {TP.sherpa.AutoCompletionKeyResponder} The receiver.
     */

    var consoleGUI,
        editorObj,
        closeFunc;

    consoleGUI = this.get('$consoleGUI');
    editorObj = consoleGUI.get('consoleInput').get('$editorObj');

    if (TP.isCallable(closeFunc = this.get('$closeFunc'))) {
        closeFunc();
        this.set('$closeFunc', null);
    }

    //  Remove the change handler that manages the autocomplete popup. We
    //  installed it when we entered this state.
    editorObj.off(
        'change',
        this.get('$changeHandler'));

    this.set('$changeHandler', null);

    this.ignore(TP.core.Keyboard.getCurrentKeyboard(), 'TP.sig.DOM_Esc_Up');

    consoleGUI.toggleIndicatorVisibility('autocomplete', false);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('DOM_Down_Down',
function(aSignal) {

    //  This key handler does nothing in autocompletion mode.
    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('DOM_Up_Down',
function(aSignal) {

    //  This key handler does nothing in autocompletion mode.
    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('DOM_PageDown_Down',
function(aSignal) {

    //  This key handler does nothing in autocompletion mode.
    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('DOM_PageUp_Down',
function(aSignal) {

    //  This key handler does nothing in autocompletion mode.
    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineHandler('DOM_Esc_Up',
function(aSignal) {
    TP.signal(TP.ANY, 'TP.sig.EndAutocompleteMode');
});

//  ----------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineMethod('showHint',
function(cm, options) {

    /**
     * @method showHint
     */

    var completions,

        consoleGUI,
        consoleInput,
        editorObj,

        backgroundElem;

    completions = this.supplyCompletions(cm, options);

    consoleGUI = this.get('$consoleGUI');
    consoleInput = consoleGUI.get('consoleInput');
    editorObj = consoleInput.get('$editorObj');

    backgroundElem = this.get('$popupContainer');

    TP.extern.CodeMirror.on(
        completions,
        'select',
        function(completion) {
            var matcher,

                theText,

                cursor,
                range,
                marker,

                selectedItem;

            consoleGUI.teardownCompletionMark();

            matcher = TP.rc('^' + completion.input);

            if (matcher.test(completion.text)) {

                theText = completion.text.slice(completion.input.length);

                if (TP.notEmpty(theText)) {
                    cursor = editorObj.getCursor();

                    range = {
                        anchor: {
                            line: cursor.line,
                            ch: cursor.ch
                        },
                        head: {
                            line: cursor.line,
                            ch: cursor.ch
                        }
                    };

                    marker = consoleGUI.generateCompletionMarkAt(
                                                        range, theText);
                    consoleGUI.set('currentCompletionMarker', marker);
                }
            }

            //  Scroll the selected item into view... because the regular hint
            //  stuff doesn't... sigh.
            selectedItem = TP.byCSSPath('.CodeMirror-hint-active',
                                        backgroundElem,
                                        true,
                                        false);

            if (TP.isElement(selectedItem)) {
                TP.wrap(selectedItem).smartScrollIntoView(TP.VERTICAL);
            }
        });

    TP.extern.CodeMirror.on(
        completions,
        'shown',
        function(completion) {
            var hintsElem;

            //  Make sure to mark the hints element with a 'nomutationtracking'
            //  flag to avoid a lot of extra mutation signaling.
            hintsElem = TP.byCSSPath('.CodeMirror-hints',
                                        backgroundElem,
                                        true,
                                        false);

            if (TP.isElement(hintsElem)) {
                TP.elementSetAttribute(
                    hintsElem, 'tibet:nomutationtracking', true, true);
            }

            consoleInput.setAttribute('showingHint', true);
        });

    TP.extern.CodeMirror.on(
        completions,
        'pick',
        function(completion) {
            this.set('$finishedCompletion', true);

            consoleGUI.teardownCompletionMark();
        }.bind(this));

    TP.extern.CodeMirror.on(
        completions,
        'close',
        function() {
            this.set('$finishedCompletion', true);

            consoleGUI.teardownCompletionMark();

            consoleInput.removeAttribute('showingHint');
        }.bind(this));

    return completions;
});

//  ------------------------------------------------------------------------

TP.sherpa.AutoCompletionKeyResponder.Inst.defineMethod('supplyCompletions',
function(editor, options) {

    /**
     * @method supplyCompletions
     */

    var completions,

        inputContent,

        matchers,

        info,
        tokenizedFragment,
        fromIndex,

        resolvedObj,
        resolutionChunks,

        closestMatchIndex,
        closestMatchMatcher,

        resolveTopLevelObjectReference,

        cursor,

        fromPos,
        toPos,

        matches,

        topLevelObjects,
        i;

    inputContent = editor.getValue();

    completions = TP.ac();

    closestMatchIndex = TP.NOT_FOUND;

    resolveTopLevelObjectReference = function(startObj, propertyPaths) {

        var pathObj,
            paths,

            path;

        pathObj = startObj;
        paths = propertyPaths.copy();

        while (TP.isValid(pathObj) && TP.notEmpty(paths)) {
            path = paths.shift();
            pathObj = pathObj[path];
        }

        //  If we haven't exhausted the path, then it doesn't matter what we've
        //  currently resolved - we must return null
        if (TP.notEmpty(paths)) {
            return null;
        }

        return pathObj;
    };

    matchers = TP.ac();

    if (TP.isEmpty(inputContent)) {

        matchers.push(
            TP.core.KeyedSourceMatcher.construct('JS_CONTEXT', TP.global).
                                                set('input', inputContent),
            this.get('$keywordsMatcher').set('input', inputContent));

    } else {

        info = TP.core.Sherpa.tokenizeForMatches(inputContent);
        tokenizedFragment = info.at('fragment');
        fromIndex = info.at('index');

        switch (info.at('context')) {
            case 'KEYWORD':
            case 'JS':

                topLevelObjects = TP.ac(
                    TP.global,
                    TP.core.TSH.getDefaultInstance().getExecutionInstance()
                );

                resolutionChunks = info.at('resolutionChunks');

                for (i = 0; i < topLevelObjects.getSize(); i++) {

                    resolvedObj = resolveTopLevelObjectReference(
                                                topLevelObjects.at(i),
                                                resolutionChunks);
                    if (TP.isValid(resolvedObj)) {
                        break;
                    }
                }

                //  If we couldn't get a resolved object and there were no
                //  further resolution chunks found after the original tokenized
                //  fragment, then we just set the resolved object to TP.global
                //  and use a keyed source matcher on that object. Since we're
                //  at the global context, we also add the keywords matcher.
                if (TP.notValid(resolvedObj) &&
                    TP.isEmpty(info.at('resolutionChunks'))) {

                    resolvedObj = TP.global;

                    matchers.push(
                        TP.core.KeyedSourceMatcher.construct(
                                            'JS_CONTEXT', resolvedObj).
                            set('input', tokenizedFragment),
                        this.get('$keywordsMatcher').
                            set('input', inputContent));
                } else {
                    matchers.push(
                        TP.core.KeyedSourceMatcher.construct(
                                            'JS_CONTEXT', resolvedObj).
                            set('input', tokenizedFragment));
                }

                /*
                } else {

                    matchers.push(
                        TP.core.KeyedSourceMatcher.construct(
                                            'JS_CONTEXT', resolvedObj).
                            set('input', inputContent),
                        this.get('$keywordsMatcher').
                            set('input', inputContent));
                        this.get('$tshExecutionInstanceMatcher').
                            set('input', inputContent));
                        this.get('$tshHistoryMatcher').
                            set('input', inputContent));
                }
                */

                break;

            case 'TSH':

                matchers.push(this.get('$tshCommandsMatcher').
                                set('input', inputContent));

                break;

            case 'CFG':

                matchers.push(this.get('$cfgMatcher').
                                set('input', inputContent));

                break;

            case 'URI':

                matchers.push(this.get('$uriMatcher').
                                set('input', inputContent));

                break;

            default:
                break;
        }
    }

    if (TP.notEmpty(matchers)) {

        matchers.forEach(
            function(matcher) {

                var matchInput;

                matcher.prepareForMatch();

                matchInput = matcher.get('input');
                matches = matcher.match();

                matches.forEach(
                    function(anItem, anIndex) {
                        var itemEntry;

                        if (TP.isArray(itemEntry = anItem.original)) {
                            itemEntry = itemEntry.at(2);
                        }

                        completions.push(
                            {
                                matcherName: anItem.matcherName,
                                input: matchInput,
                                text: itemEntry,
                                score: anItem.score,
                                className: anItem.cssClass,
                                displayText: anItem.string,
                                suffix: anItem.suffix,
                                render: function(elem, self, data) {

                                    //  'innerHTML' seems to throw
                                    //  exceptions in XHTML documents on
                                    //  Firefox
                                    if (TP.notEmpty(data.suffix)) {
                                        elem.innerHTML = data.displayText +
                                                            data.suffix;
                                    } else {
                                        elem.innerHTML = data.displayText;
                                    }

                                    /*
                                    var contentNode;
                                    contentNode = TP.xhtmlnode(
                                                        data.displayText);
                                    TP.nodeAppendChild(
                                            elem, contentNode, false);
                                            */
                                }
                            });
                    });
            });

        if (TP.notEmpty(completions)) {

            //  Sort all of the completions together using a custom sorting
            //  function to go after parts of the completion itself.
            completions.sort(
                function(completionA, completionB) {

                    //  Sort by matcher name, score and then text, in that
                    //  order.
                    return TP.sort.COMPARE(
                                completionB.matcherName,
                                completionA.matcherName) ||
                            TP.sort.COMPARE(
                                completionB.score,
                                completionA.score) ||
                            TP.sort.COMPARE(
                                completionA.text.length,
                                completionB.text.length) ||
                            TP.sort.COMPARE(
                                completionA.text,
                                completionB.text);
                });

            closestMatchIndex = TP.NOT_FOUND;
            closestMatchMatcher = TP.rc('^' + TP.regExpEscape(inputContent));

            //  Try to determine if we have a 'best match' here and set the
            //  'exact match' index to it.
            completions.forEach(
                    function(aCompletion, anIndex) {

                        //  Test each completion to see if it starts with
                        //  text matching inputContent. Note here that we
                        //  stop at the first one.
                        if (closestMatchMatcher.test(aCompletion.text) &&
                            closestMatchIndex === TP.NOT_FOUND) {
                            closestMatchIndex = anIndex;
                        }
                    });
        }
    }

    cursor = editor.getCursor();

    if (TP.isEmpty(completions)) {
        fromIndex = cursor.ch;
    }

    fromPos = TP.extern.CodeMirror.Pos(cursor.line, fromIndex);
    toPos = TP.extern.CodeMirror.Pos(cursor.line, cursor.ch);

    //  CodeMirror doesn't like values less than 0
    if (closestMatchIndex === TP.NOT_FOUND) {
        closestMatchIndex = 0;
    }

    return {
        list: completions,
        from: fromPos,
        to: toPos,
        selectedHint: closestMatchIndex
    };
});

//  ----------------------------------------------------------------------------
//  end
//  ============================================================================
