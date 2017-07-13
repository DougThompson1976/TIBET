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
 * @type {TP.tibet.transform}
 * @summary A subtype of TP.core.ActionTag that knows how to transform
 *     source data (supplied by stdin) against registered templates (or
 *     templates embedded as child nodes) and write it to stdout.
 * @todo This entire type needs to be reviewed and updated.
 */

//  ------------------------------------------------------------------------

TP.core.ActionTag.defineSubtype('tibet:transform');

TP.tibet.transform.addTraits(TP.core.PipeSegmentElementNode);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tibet.transform.Type.defineMethod('compileTemplates',
function(transformElem) {

    /**
     * @method compileTemplates
     * @summary Compiles all of the 'tibet:template' elements under the supplied
     *     transform element
     * @param {TP.tibet.transform} transformElem The transform element to look
     *     for templates.
     */

    var templateElems,
        transformID;

    //  Get all of the template elements under the transform element.
    templateElems = TP.nodeGetElementsByTagName(transformElem,
                                                'tibet:template');

    //  Grab the transform elem's ID (making sure we have one and
    //  generate/assign one if we don't)
    transformID = TP.lid(transformElem, true);

    templateElems.perform(
        function(anElem) {

            var templateName,
                templateURI,

                resp,

                compileRequest,

                templateContentElem;

            //  If the template doesn't have a 'template name', then we
            //  construct one out of our ID and the template name and set
            //  it.
            if (TP.isEmpty(
                    templateName =
                        TP.elementGetAttribute(anElem, 'tibet:name', true))) {
                templateName = 'template_' + transformID + '_' + TP.genID();

                TP.elementSetAttribute(anElem,
                                        'tibet:name',
                                        templateName,
                                        true);
            }

            //  Construct a URI from the 'tibet' urn scheme and the name.
            templateURI = TP.uc(TP.TIBET_URN_PREFIX + templateName);

            //  Try to fetch the compiled template (which will be the
            //  resource of that URI) and, if its not available, compile it.
            resp = templateURI.getResource(TP.hc('async', false));

            if (TP.notValid(resp.get('result'))) {
                //  Set the 'tibet:generator' to be the transform element's ID
                TP.elementSetAttribute(anElem,
                                        'tibet:generator',
                                        transformID,
                                        true);

                //  Create a 'compile request' to compile the template.
                compileRequest = TP.request(
                    TP.hc('cmdExecute', false,
                            'cmdSilent', true,
                            'cmdTargetDoc', TP.nodeGetDocument(transformElem),
                            'cmdPhases', TP.core.TSH_COMPILE_PHASES,
                            'targetPhase', 'Compile'));

                //  Compile the template
                TP.process(anElem, compileRequest);

                templateContentElem = TP.nodeGetFirstChildElement(anElem);

                //  Set the resource to a clone of the node. We do this
                //  in case the DOM where the node is sitting goes away.
                templateURI.setResource(
                            TP.wrap(TP.nodeCloneNode(templateContentElem)));
            }
        });

    return;
});

//  ------------------------------------------------------------------------

TP.tibet.transform.Type.defineMethod('transformInput',
function(anInput, cmdNode, aRequest) {

    /**
     * @method transformInput
     * @summary Transforms an input object using information from the request
     *     provided.
     * @description This type's version of this method executes the templates
     *     configured for it against the supplied input and returns the result.
     * @param {Object} anInput The object to transform.
     * @param {Node} cmdNode The original transformation node.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @exception TP.sig.InvalidTransform
     * @returns {Object} The transformed input.
     */

    var rootName,
        templateName,
        resp,
        template,
        params,
        result;

    //  The transform must reference the "root template" in a tibet:template
    //  attribute. This attribute can be provided manually, or it is
    //  injected on the transform by a child template tag during
    //  compilation.
    rootName = TP.elementGetAttribute(cmdNode, 'tibet:root_template', true);
    if (TP.isEmpty(rootName)) {
        aRequest.fail('Invalid root template name.');

        return;
    }

    //  Compute a URI that is a 'tibet:' URN that will point to the template
    //  (which should have been registered with the same URN)
    templateName = rootName.startsWith(TP.TIBET_URN_PREFIX) ?
                    rootName :
                    TP.TIBET_URN_PREFIX + rootName;

    //  Fetch the template from the URI.
    resp = TP.uc(templateName).getResource(TP.hc('async', false, 'resultType', TP.TEXT));

    if (TP.notValid(template = resp.get('result'))) {

        //  The template couldn't be found. Compile any templates under us.
        this.compileTemplates(cmdNode);

        //  Try again.
        resp = TP.uc(templateName).getResource(TP.hc('async', false, 'resultType', TP.TEXT));

        if (TP.notValid(template = resp.get('result'))) {
            aRequest.fail('Unable to find template: ' + templateName);

            return;
        }
    }

    //  If the transform has a 'repeat' attribute on it, then set up a hash
            //  that will have 'repeat' so the template invocation will iterate.
    if (TP.elementGetAttribute(cmdNode, 'tibet:repeat', true) === 'true') {
        params = TP.hc('repeat', true);
    }

    //  Execute the template
    result = TP.format(anInput, template, params);

    if (TP.isValid(result)) {
        return result;
    } else {
        aRequest.fail('Transform failed to produce output.');

        return;
    }
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.tibet.transform.Inst.defineMethod('isSingleValued',
function(aspectName) {

    /**
     * @method isSingleValued
     * @summary Returns true if the receiver binds to single values.
     * @description This method on this type always returns 'false', since we
     *     can handle 'collection' data, not just single values.
     * @param {String} [aspectName] An optional aspect name that is being used
     *     by the caller to determine whether the receiver is single valued for.
     * @returns {Boolean} True when single valued.
     */

    return false;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
