//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

/**
 * @type {TP.tsh.import}
 * @summary A subtype of TP.core.ActionElementNode that knows how to
 *     conditionally process its child actions based on a binding expression.
 */

//  ------------------------------------------------------------------------

TP.core.ActionElementNode.defineSubtype('tsh:import');

TP.tsh.import.addTraits(TP.tsh.Element);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tsh.import.Type.defineMethod('tshExecute',
function(aRequest) {

    /**
     * @method tshExecute
     * @summary Runs the receiver, effectively invoking its action.
     * @description This command imports the source file referenced if it can be
     *     found. The primary value of this command is that it allows simple
     *     file patterns to be used to determine which file might be desired.
     *     For example, :import TIBETGlobals or simply Globals is enough for
     *     this command to locate the full path to the proper file and to
     *     import it.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue. Common values are TP.CONTINUE, TP.DESCEND, and
     *     TP.BREAK.
     */

    var shell,

        input,

        len,
        i,

        ref,
        options,

        file,
        flag,

        url,
        resp,
        src,

        debug,

        urlLoc,
        urlName,
        urlTypeName,
        urlType;

    shell = aRequest.at('cmdShell');

    //  If either one of the debugging flags is turned on, then echo the
    //  debugging information.
    if (shell.getArgument(aRequest, 'tsh:debug', null, false)) {
        return this.printDebug(aRequest, true, false);
    }

    if (shell.getArgument(aRequest, 'tsh:debugresolve', null, false)) {
        return this.printDebug(aRequest, true, true);
    }

    //  No arguments means we dump usage.
    if (!shell.hasArguments(aRequest)) {
        return this.printUsage(aRequest);
    }

    if (TP.notValid(aRequest.at('cmdNode'))) {
        return aRequest.fail();
    }

    //  NB: We supply 'null' as the default value if 'tsh:href' wasn't
    //  specified.
    input = shell.getArgument(aRequest, 'tsh:href', null, true);
    if (TP.notValid(input)) {
        if (TP.isEmpty(input = aRequest.stdin())) {
            return aRequest.fail(
                'Unable to find reference for ' + TP.str(ref));
        }
    } else {
        input = TP.ac(input);
    }

    len = input.getSize();
    for (i = 0; i < len; i++) {
        ref = input.at(i);

        ref = TP.uriExpandPath(ref);

        options = TP.boot.$$loadpaths.grep(ref);
        if (TP.isEmpty(options)) {
            //  a file we've never seen before
            options = TP.ac(ref);
        }

        //  ambiguous...
        if (options.getSize() > 1) {
            aRequest.fail(
                'Multiple choices: ' + TP.src(options));

            continue;
        }

        file = options.collapse();
        try {
            flag = TP.sys.shouldLogCodeChanges();
            TP.sys.shouldLogCodeChanges(false);

            /*
            root.stdout('tsh:import loading source from ' + file,
                            aRequest);
            */

            url = TP.uc(file);
            if (TP.notValid(url)) {
                aRequest.fail(
                    'tsh:import failed to load ' + file);

                continue;
            }

            resp = url.getResource(TP.hc('refresh', true, 'async', false));
            if (TP.notValid(src = resp.get('result'))) {
                aRequest.fail(
                    'tsh:import failed to load ' + file);

                continue;
            }

            debug = TP.sys.shouldUseDebugger();
            TP.sys.shouldUseDebugger(false);
            TP.boot.$sourceImport(src, null, TP.str(url), true);

            //  Grab the location of the URL, trim it down so that its only
            //  the name of the file with no extension and see if there's
            //  now a 'type' with that name. If so, call its 'initialize()'
            //  method.
            urlLoc = url.getLocation();
            urlName = TP.uriName(urlLoc);
            urlTypeName = urlName.slice(0, urlName.lastIndexOf('.'));
            urlTypeName = urlTypeName.replace(/_/, ':');

            if (TP.isType(urlType = urlTypeName.asType()) &&
                !urlType.isInitialized() &&
                urlType.ownsMethod('initialize')) {
                try {
                    urlType.initialize();
                    urlType.isInitialized(true);
                } catch (e) {
                    this.raise(
                        'TP.sig.InitializationException',
                        'Unable to initialize ' + urlType.getName());
                }
            }
        } catch (e) {
            aRequest.fail(
                TP.ec(e, 'tsh:import failed to load ' + file));

            continue;
        } finally {
            TP.sys.shouldLogCodeChanges(flag);
            TP.sys.shouldUseDebugger(debug);
        }
    }

    aRequest.complete(url.getLocation());

    return;
});

//  ------------------------------------------------------------------------

TP.core.TSH.addHelpTopic(
    TP.tsh.import.Type.getMethod('cmdRunContent'),
    'Loads/executes a JavaScript/TIBET source file.',
    ':import',
    '');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================