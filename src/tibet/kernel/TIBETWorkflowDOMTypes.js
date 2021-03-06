//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

//  ========================================================================
//  TP.vcard.vcard
//  ========================================================================

/**
 * @type {TP.vcard.vcard}
 * @summary A VCard originally based on the Jabber/XEP-0054 vcard-temp spec.
 * @description The primary purpose of this type in TIBET is to support
 *     TP.core.User instances in the definition of their organization and role
 *     affiliations. By virtue of vcard association types can autoload
 *     organization-specific role/unit types which serve as delegates for
 *     permission-specific behaviors and as keepers of associated keys/keyrings.
 *
 *     Given the relatively limited goals for this type at the present time we
 *     focus only on the <fn>, <role>, <org> and <x-orgunit> elements.
 *     Additional aspect mappings, and an expanded node template, would allow
 *     this type to be a full-featured wrapper for the full XEP-0054 vcard
 *     element.
 *
 *     See http://www.xmpp.org/extensions/xep-0054.html for more info.
 *
 *     See the vcards.xml sample file for specific markup examples.
 */

//  ------------------------------------------------------------------------

TP.core.ElementNode.defineSubtype('vcard:vcard');

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

/**
 * The dictionary of registered vcards.
 * @type {TP.core.Hash}
 */
TP.vcard.vcard.Type.defineAttribute('instances', TP.hc());

//  ------------------------------------------------------------------------
//  Types Methods
//  ------------------------------------------------------------------------

TP.vcard.vcard.Type.defineMethod('initialize',
function() {

    /**
     * @method initialize
     * @summary Performs one-time type initialization.
     */

    var url;

    url = TP.sys.cfg('path.lib_vcards');
    if (TP.notEmpty(url)) {
        TP.vcard.vcard.loadVCards(url).then(function(result) {
            TP.vcard.vcard.initVCards(result);
        }).catch(function(err) {
            TP.ifError() ?
                TP.error('Error loading library vcards: ' +
                            TP.str(err)) : 0;
        });
    }

    url = TP.sys.cfg('path.app_vcards');
    if (TP.notEmpty(url)) {
        TP.vcard.vcard.loadVCards(url).then(function(result) {
            TP.vcard.vcard.initVCards(result);
        }).catch(function(err) {
            TP.ifError() ?
                TP.error('Error loading application vcards: ' +
                            TP.str(err)) : 0;
        });
    }
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Type.defineMethod('generate',
function(userInfo) {

    /**
     * @method generate
     * @summary Generates a new vcard instance using data contained in userInfo.
     *     Keys can include 'fn', 'n', 'role', 'org', and 'orgunit'. Defaults
     *     are taken from the user.default_* keys in TIBET's configuration data.
     * @param {TP.core.Hash} userInfo The user information to build a card for.
     * @returns {TP.vcard.vcard} The new instance.
     */

    var params,
        node;

    params = TP.hc(userInfo);
    params.atPutIfAbsent('fn', TP.sys.cfg('user.default_name'));
    params.atPutIfAbsent('n', params.at('fn'));
    params.atPutIfAbsent('nickname', params.at('fn'));
    params.atPutIfAbsent('role', TP.sys.cfg('user.default_role'));
    params.atPutIfAbsent('org', TP.sys.cfg('user.default_org'));
    params.atPutIfAbsent('orgunit', params.at('org'));

    node = TP.elementFromString(TP.join(
        '<vcard xmlns="urn:ietf:params:xml:ns:vcard-4.0"',
                ' xmlns:vcard-ext="http://www.technicalpursuit.com/vcard-ext">',
            '<fn><text>', params.at('fn'), '</text></fn>',
            '<n><text>', params.at('n'), '</text></n>',
            '<nickname><text>', params.at('nickname'), '</text></nickname>',
            '<role><text>', params.at('role'), '</text></role>',
            '<org><text>', params.at('org'), '</text></org>',
            '<vcard-ext:x-orgunit>',
                '<text>', params.at('orgunit'), '</text>',
            '</vcard-ext:x-orgunit>',
        '</vcard>'));

    return TP.vcard.vcard.construct(node);
});


//  ------------------------------------------------------------------------

TP.vcard.vcard.Type.defineMethod('getInstanceById',
function(anID) {

    /**
     * @method getInstanceById
     * @summary Returns the vcard instance whose <fn> value matches the ID
     *     provided. If the ID matches that of the user.default_name value and
     *     the vcard isn't found a default version will be created.
     * @returns {vcard.vcard} A vcard element wrapper.
     */

    var vcards,
        inst;

    //  NOTE the access to the top-level type here, not 'this'.
    vcards = TP.vcard.vcard.get('instances');

    inst = vcards.at(anID);
    if (TP.isValid(inst)) {
        return inst;
    }

    //  Due to startup sequencing we may need to create the default instance on
    //  demand. Role/Unit initializers trigger a call to this method.
    return this.generate(TP.hc('fn', anID));
});

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.vcard.vcard.Type.defineMethod('initVCards',
function(aDocument) {

    /**
     * @method initVCards
     * @summary Initializes instances of vcard based on vcard elements found
     *     in the document provided. This method is usually invoked after a call
     *     to loadVCards to acquire a vcard-containing document.
     * @param {Document} aDocument A TIBET vcards document. See the
     *     documentation on TIBET vcard files for more information.
     * @returns {Array.<TP.vcard.vcard>} An array of vcard instances.
     */

    var vcards,
        type,
        list;

    if (!TP.isDocument(aDocument)) {
        return this.raise('InvalidDocument', aDocument);
    }

    type = TP.vcard.vcard;

    vcards = TP.nodeEvaluateXPath(aDocument, '//$def:vcard', TP.NODESET);
    list = vcards.collect(function(elem) {
        return type.construct(elem);
    });

    return list;
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Type.defineMethod('loadVCards',
function(aURI) {

    /**
     * @method loadVCards
     * @summary Loads vcard data from the URI provided, or from the default
     *     vcard path if one is defined. The resulting document can then be
     *     passed to initVCards() which will construct instances for each of
     *     the vcard elements found in the document.
     * @returns {TP.sig.Response} A TIBET Response object (which is
     *     Promise-compatible) which will resolve on completion.
     */

    var url,
        fname;

    url = aURI;

    if (TP.notValid(url)) {
        //  If we don't have a viable setting for application-level vcards we
        //  should try library-level vcards.
        url = TP.sys.cfg('path.app_vcards');
        if (TP.isEmpty(url)) {

            //  If we don't have a viable setting for library-level vcards then
            //  we should just return quietly.
            url = TP.sys.cfg('path.lib_vcards');
            if (TP.isEmpty(url)) {
                return;
            }
        }
    }

    //  If we got a URI or path of some kind it's time to validate it and create
    //  the URI instance needed to perform the data load.
    if (!TP.isKindOf(url, TP.core.URI)) {
        fname = TP.uriExpandPath(url);
        if (!TP.isURI(url = TP.uc(fname))) {
            return this.raise('InvalidURI', aURI);
        }
    }

    return url.getResource(TP.hc('resultType', TP.DOM));
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Type.defineMethod('registerVCard',
function(aVCard) {

    /**
     * @method registerVCard
     * @summary Registers a single vcard with the vcard type using the
     *     'fullname' (i.e. the <text> value of <fn>) as the key to register it
     *     under. This method is invoked automatically during vcard instance
     *     creation so you don't normally need to call it yourself.
     * @param {TP.vcard.vcard} aVCard The vcard instance to register.
     * @returns {TP.vcard.vcard} The registered vcard instance.
     */

    var id,
        keys;

    if (!TP.canInvoke(aVCard, 'get')) {
        return this.raise('InvalidVCard', aVCard);
    }

    id = aVCard.get('fullname');
    if (TP.isEmpty(id)) {
        return this.raise('InvalidVCard', aVCard);
    }

    //  NOTE the access to the top-level type here, not 'this'.
    keys = TP.vcard.vcard.get('instances');
    keys.atPut(id, aVCard);

    return aVCard;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  Note the use of the non-standard '$def:' TIBET extension used to query
//  elements in default namespaces.

TP.vcard.vcard.Inst.defineAttribute('fullname',
    TP.xpc('./$def:fn/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('shortname',
    TP.xpc('./$def:n/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('surname',
    TP.xpc('./$def:n/$def:surname',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('givenname',
    TP.xpc('./$def:n/$def:given',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('prefix',
    TP.xpc('./$def:n/$def:prefix',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('nickname',
    TP.xpc('./$def:nickname/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('jid',
    TP.xpc('./$def:impp/$def:uri',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('url',
    TP.xpc('./$def:url/$def:uri',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('email',
    TP.xpc('./$def:email/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('tel',
    TP.xpc('./$def:tel/$def:uri',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('url',
    TP.xpc('./$def:url/$def:uri',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('timezone',
    TP.xpc('./$def:tz/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('role',
    TP.xpc('./$def:role/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('orgname',
    TP.xpc('./$def:org/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('orgunit',
    TP.xpc('./vcard-ext:x-orgunit/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('key',
    TP.xpc('./$def:key/$def:text',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('secretkey',
    TP.xpc('./vcard-ext:x-secret-key',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('username',
    TP.xpc('./vcard-ext:x-username',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('password',
    TP.xpc('./vcard-ext:x-password',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('auth',
    TP.xpc('./vcard-ext:x-auth',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

TP.vcard.vcard.Inst.defineAttribute('iswebdav',
    TP.xpc('./vcard-ext:x-is-webdav',
        TP.hc('shouldCollapse', true, 'extractWith', 'value')));

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.vcard.vcard.Inst.defineMethod('init',
function(aVCard) {

    /**
     * @method  init
     * @summary Creates a new vcard instance from the input data provided.
     *     Note that if the inbound vcard has an <fn> matching one already
     *     registered the new vcard will override the existing one. Also note
     *     that this method will update the associated resource instance if one
     *     is found for the 'id' (fullname) portion of the vcard.
     * @param {Element} aVCard The vcard element to wrap in an instance.
     * @returns {TP.vcard.vcard} The newly created vcard instance.
     */

    var id,
        resource;

    this.callNextMethod();

    //  Must have an ID to be a viable instance.
    if (TP.isEmpty(this.get('fullname'))) {
        return this.raise('InvalidVCard', aVCard);
    }

    TP.vcard.vcard.registerVCard(this);

    //  Update the associated resource to have the updated vCard instance.
    id = this.get('fullname');
    if (TP.notEmpty(id)) {
        resource = TP.core.Resource.getResourceById(id);
        if (TP.isValid(resource)) {
            resource.setVCard(this);
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Inst.defineMethod('getAccessKeys',
function() {

    /**
     * @method getAccessKeys
     * @summary Returns an array of permission keys defined by the receiver's
     *     role and unit definitions.
     * @returns {Array} An array of permission keys (strings).
     */

    var keys,
        roles,
        units;

    //  NOTE
    //  we cache the key string to avoid recomputation overhead
    if (TP.notEmpty(keys = this.getAttribute('keys'))) {
        return keys.split(' ');
    }

    keys = TP.ac();

    roles = this.getRoles();
    keys = roles.injectInto(
            keys,
            function(role, accum) {

                accum.push.apply(accum, role.getAccessKeys());

                return accum;
            });

    units = this.getUnits();
    keys = units.injectInto(
            keys,
            function(unit, accum) {

                accum.push.apply(accum, unit.getAccessKeys());

                return accum;
            });

    //  since we've blended keys from a number of sources, unique and sort
    //  for easier debugging in the UI
    return keys.unique().sort();
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Inst.defineMethod('getRoleNames',
function() {

    /**
     * @method getRoleNames
     * @summary Returns an array of role names found in the vcard instance.
     *     NOTE that TIBET automatically "namespace-qualifies" the content of
     *     the <role> element with the content of the <org> element to produce
     *     these names.
     * @returns {Array} An array of role names (TP.core.Role subtype names).
     */

    var org,
        role,
        names;

    org = this.get('orgname');
    role = this.get('role');
    if (TP.isEmpty(role)) {
        return TP.ac();
    }

    names = role.split(';');
    return names.collect(
            function(name) {

                return TP.join(org, ':', name);
            });
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Inst.defineMethod('getRoles',
function() {

    /**
     * @method getRoles
     * @summary Returns an array of TP.core.Role types that were found for the
     *     receiver. When a named role can't be loaded it won't be included in
     *     this list, and a warning will be logged.
     * @returns {Array} An array containing loadable TP.core.Role types.
     */

    var names;

    names = this.getRoleNames();

    return names.collect(
                function(name) {

                    return TP.sys.getTypeByName(name);
                }).compact();
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Inst.defineMethod('getUnitNames',
function() {

    /**
     * @summary Returns an array of unit names found in the vcard instance.
     *     NOTE that TIBET automatically "namespace-qualifies" the content of
     *     the ORGUNIT element with the content of the ORGNAME element in
     *     producing this list.
     * @returns {Array} An array of unit names (TP.core.Unit subtype names).
     * @method
     */

    var org,
        unit,
        names;

    org = this.get('orgname');
    unit = this.get('orgunit');
    if (TP.isEmpty(unit)) {
        return TP.ac();
    }

    names = unit.split(';');
    return names.collect(
            function(name) {

                return TP.join(org, ':', name);
            });
});

//  ------------------------------------------------------------------------

TP.vcard.vcard.Inst.defineMethod('getUnits',
function() {

    /**
     * @method getUnits
     * @summary
     * @returns {Array}
     */

    var names;

    names = this.getUnitNames();

    return names.collect(
                function(name) {

                    return TP.sys.getTypeByName(name);
                }).compact();
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================

//  ========================================================================
//  TP.tibet.keyring
//  ========================================================================

/**
 * @type {TP.tibet.keyring}
 * @summary A keyring is a container for one or more keys, strings that
 *     represent individual permissions within an application. Obviously this
 *     isn't a security feature, it's designed more with allowing easy CSS
 *     and functionality switching based on user role assignments, helping to
 *     ease development of applications that have role-specific UI features.
 *     Data security is presumed to be managed at the server as appropriate.
 * @description To help manage permissions in the most flexible way possible
 *     TIBET uses the concept of keys, strings you define to have some meaning
 *     relative to permissions in your application. These keys can be grouped
 *     within keyrings, which can be nested to keep things easier to maintain.
 *
 *     After a user logs in you can supply a vcard which defines the user's
 *     organization-qualified role and unit affiliations. The role and unit
 *     definitions found in the vcard provide one or more keyrings to their
 *     associated user(s), granting members their permissions. The permission
 *     strings are added to TIBET's UICANVAS <body> element for help in driving
 *     CSS rules which alter UI based on a user's particular role/unit.
 *
 *     See the keyrings.xml sample file for specific markup examples.
 */

//  ------------------------------------------------------------------------

TP.core.ElementNode.defineSubtype('tibet:keyring');

//  ------------------------------------------------------------------------
//  Types Attributes
//  ------------------------------------------------------------------------

/**
 * The dictionary of registered keyrings.
 * @type {TP.core.Hash}
 */
TP.tibet.keyring.Type.defineAttribute('instances', TP.hc());

//  ------------------------------------------------------------------------
//  Types Methods
//  ------------------------------------------------------------------------

TP.tibet.keyring.Type.defineMethod('initialize',
function() {

    /**
     * @method initialize
     * @summary Performs one-time type initialization.
     */

    var url;

    url = TP.sys.cfg('path.app_keyrings');
    if (TP.notEmpty(url)) {
        TP.tibet.keyring.loadKeyrings(url).then(function(result) {
            TP.tibet.keyring.initKeyrings(result);
        }).catch(function(err) {
            TP.ifError() ?
                TP.error('Error loading application keyrings: ' +
                            TP.str(err)) : 0;
        });
    }

    url = TP.sys.cfg('path.lib_keyrings');
    if (TP.notEmpty(url)) {
        TP.tibet.keyring.loadKeyrings(url).then(function(result) {
            TP.tibet.keyring.initKeyrings(result);
        }).catch(function(err) {
            TP.ifError() ?
                TP.error('Error loading library keyrings: ' +
                            TP.str(err)) : 0;
        });
    }
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Type.defineMethod('generate',
function(anID) {

    /**
     * @method generate
     * @summary Generates a new keyring instance using the ID provided.
     * @param {String} anID The keyring ID to build.
     * @returns {TP.tibet.keyring} The new instance.
     */

    var id,
        node;

    id = TP.ifEmpty(anID, TP.sys.cfg('user.default_keyring'));

    node = TP.elementFromString(
                    '<keyring' +
                    ' xmlns="' + TP.w3.Xmlns.TIBET + '"' +
                    ' id="' + id + '"/>');

    return TP.tibet.keyring.construct(node);
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Type.defineMethod('getInstanceById',
function(anID) {

    /**
     * @method getInstanceById
     * @summary Returns the keyring instance whose id attribute matches the ID
     *     provided. If the ID matches that of the user.default_keys value and
     *     the keyring isn't found a default version will be created.
     * @returns {tibet:keyring} A keyring element wrapper.
     */

    var keyrings,
        inst;

    //  NOTE the access to the top-level type here, not 'this'.
    keyrings = TP.tibet.keyring.get('instances');

    inst = keyrings.at(anID);
    if (TP.isValid(inst)) {
        return inst;
    }

    //  Due to startup sequencing we may need to create the default instance on
    //  demand. Role/Unit initializers trigger a call to this method.
    return this.generate(anID);
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Type.defineMethod('initKeyrings',
function(aDocument) {

    /**
     * @method initKeyrings
     * @summary Initializes instances of keyring based on keyring elements found
     *     in the document provided. This method is usually invoked after a call
     *     to loadKeyrings to acquire a keyrings document.
     * @param {Document} aDocument A TIBET keyrings document. See the
     *     documentation on TIBET Keyring files for more information.
     * @returns {Array.<TP.tibet.keyring>} An array of keyring instances created.
     */

    var keyrings,
        type,
        list;

    if (!TP.isDocument(aDocument)) {
        return this.raise('InvalidDocument', aDocument);
    }

    type = TP.tibet.keyring;

    keyrings = TP.nodeEvaluateXPath(aDocument, '//$def:keyring', TP.NODESET);
    list = keyrings.collect(
                function(elem) {
                    if (TP.isEmpty(TP.elementGetAttribute(elem, 'id'))) {
                        return;
                    }
                    return type.construct(elem);
                });

    return list.compact();
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Type.defineMethod('loadKeyrings',
function(aURI) {

    /**
     * @method loadKeyrings
     * @summary Loads keyring data from the URI provided, or from the default
     *     keyring path if one is defined. The resulting document can then be
     *     passed to initKeyrings() which will construct instances for each of
     *     the keyring elements found in the document.
     * @returns {TP.sig.Response} A TIBET Response object (which is
     *     Promise-compatible) which will resolve on completion.
     */

    var url,
        fname;

    url = aURI;

    if (TP.notValid(aURI)) {
        //  If we don't have a viable setting for application-level keyrings we
        //  should try library-level keyrings.
        url = TP.sys.cfg('path.app_keyrings');
        if (TP.isEmpty(url)) {

            //  If we don't have a viable setting for library-level keyrings
            //  then we should just return quietly.
            url = TP.sys.cfg('path.lib_keyrings');
            if (TP.isEmpty(url)) {
                return;
            }
        }
    }

    //  If we got a URI or path of some kind it's time to validate it and create
    //  the URI instance needed to perform the data load.
    if (!TP.isKindOf(url, TP.core.URI)) {
        fname = TP.uriExpandPath(url);
        if (!TP.isURI(url = TP.uc(fname))) {
            return this.raise('InvalidURI', aURI);
        }
    }

    return url.getResource(TP.hc('resultType', TP.DOM));
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Type.defineMethod('registerKeyring',
function(aKeyring) {

    /**
     * @method registerKeyring
     * @summary Registers a single keyring with the keyring type. This method is
     *     invoked automatically during keyring instance creation so you don't
     *     normally need to call it yourself.
     * @param {TP.tibet.keyring} aKeyring The keyring instance to register.
     * @returns {TP.tibet.keyring} The registered keyring instance.
     */

    var id,
        keys;

    if (!TP.canInvoke(aKeyring, 'getKeyID')) {
        return this.raise('InvalidKeyring', aKeyring);
    }

    id = aKeyring.getKeyID();
    if (TP.isEmpty(id)) {
        //  Might be a ref to another one (which we ignore).
        if (TP.isEmpty(aKeyring.getNativeNode().getAttribute('ref'))) {
            return this.raise('InvalidKeyring', aKeyring);
        } else {
            return;
        }
    }

    //  NOTE the access to the top-level type here, not 'this'.
    keys = TP.tibet.keyring.get('instances');
    keys.atPut(id, aKeyring);

    return aKeyring;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.tibet.keyring.Inst.defineMethod('init',
function(aKeyring) {

    /**
     * @method  init
     * @summary Creates a new keyring instance from the input data provided.
     *     Note that if the inbound keyring has an ID matching one already
     *     registered the new keyring will override the existing one.
     * @param {Element} aKeyring The keyring element to wrap in an instance.
     * @returns {TP.tibet.keyring} The newly created keyring instance.
     */

    this.callNextMethod();

    //  Must have an ID to be a viable instance.
    if (TP.isEmpty(this.getID())) {
        return this.raise('InvalidKeyring', aKeyring);
    }

    TP.tibet.keyring.registerKeyring(this);

    return this;
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Inst.defineMethod('getAccessKeys',
function() {

    /**
     * @method getAccessKeys
     * @summary Returns an array of the string keys found in the receiver.
     * @returns {Array} An array containing the string keys of the receiver.
     */

    var keys,
        arr,
        rings;

    //  NOTE: we cache the key string to avoid recomputation overhead,
    //  particularly around nested keyrings.

    //  ALSO: since we use the keys attribute as a cache this can be leveraged
    //  by any web service you may write as a way to return an element of the
    //  form <keyring keys="ab cd ef"/> rather than a nested structure.
    if (TP.notEmpty(keys = this.getAttribute('keys'))) {
        return keys.split(' ');
    }

    //  build an empty array we can inject into the following processes
    keys = TP.ac();

    //  first we'll gather up any keys from our "child" keyrings
    rings = this.getKeyrings();
    keys = rings.injectInto(
                keys,
                function(ring, accum) {

                    //  the apply will flatten the nested keys into the keyset
                    accum.push.apply(accum, ring.getAccessKeys());

                    //  injectInto requires that we return the injected data
                    return accum;
                });

    //  now we want to add our local keys (make sure that we get an Array even
    //  if there's only one)
    arr = this.evaluateXPath('./$def:key/@name', TP.NODESET);
    keys = arr.injectInto(
                keys,
                function(attr, accum) {

                    //  turn attribute nodes into string values
                    accum.push(TP.str(attr.value));

                    //  injectInto requires that we return the injected data
                    return accum;
                });

    //  since we've blended keys from a number of sources, unique and sort for
    //  easier debugging in the UI
    keys = keys.unique().sort();

    //  cache the result
    this.setAttribute('keys', keys.join(' '));

    return keys;
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Inst.defineMethod('getKeyrings',
function() {

    /**
     * @method getKeyrings
     * @summary Returns an array of any nested keyrings found in the receiver.
     *     This list's related keys also become part of the overall key set
     *     returned by the getAccessKeys() method so you rarely need to call it
     *     directly.
     * @returns {Array} An array containing the string keys of the receiver.
     */

    var arr;

    //  NB: we make sure that we get an Array even if there's only one
    arr = this.evaluateXPath('./$def:keyring/@ref', TP.NODESET);
    arr.convert(
        function(attr) {

            return TP.tibet.keyring.getInstanceById(TP.str(attr.value));
        });

    return arr;
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Inst.defineMethod('getKeyID',
function() {

    /**
     * @method getKeyID
     * @summary Returns the receiver's key ID, the unique keyring ID it uses.
     * @returns {String} The ID value.
     */

    return TP.elementGetAttribute(this.getNativeNode(), 'id');
});

//  ------------------------------------------------------------------------

TP.tibet.keyring.Inst.defineMethod('hasAccessKey',
function(aKey) {

    /**
     * @method hasAccessKey
     * @summary Returns true if the receiving key ring has the named key.
     * @returns {Boolean} True if the key is found.
     */

    return this.getAccessKeys().contains(aKey);
});

//  ========================================================================
//  TP.core.TagProcessor
//  ========================================================================

/**
 * @type {TP.core.TagProcessor}
 * @summary The core engine responsible for processing tags (or any type of DOM
 *     construct like PIs or Text nodes, really). This object holds a set of
 *     processing phases and is responsible for executing them against a chunk
 *     of supplied content.
 */

//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('core.TagProcessor');

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

//  A set of phase types used when 'attaching' content to a visual DOM
TP.core.TagProcessor.Type.defineConstant(
    'ATTACH_PHASES',
    TP.ac(
    'TP.core.AttachDOMPhase',       //  Late additions to the DOM needed for
                                    //  visual structuring
    'TP.core.AttachEventsPhase',    //  ev: namespace. NOTE others can generate
    'TP.core.AttachSignalsPhase',   //  on: namespace (for non-native events)
    'TP.core.AttachDataPhase',      //  model construct et. al.
    'TP.core.AttachInfoPhase',      //  other info tags (acl:, dnd:, etc)
    'TP.core.AttachBindsPhase',     //  data bindings in the bind: namespace
    'TP.core.AttachStylePhase',     //  CSS is near end so display: none can
                                    //  flip late
    'TP.core.AttachCompletePhase'
    ));

//  A set of phase types used when 'detaching' content from a visual DOM
//  Note how these are reversed from the attach phases, to give things that rely
//  on these phases chance to unwind in reverse order.
TP.core.TagProcessor.Type.defineConstant(
    'DETACH_PHASES',
    TP.ac(
    'TP.core.DetachStylePhase',
    'TP.core.DetachDataPhase',
    'TP.core.DetachBindsPhase',
    'TP.core.DetachInfoPhase',
    'TP.core.DetachSignalsPhase',
    'TP.core.DetachEventsPhase',
    'TP.core.DetachDOMPhase',
    'TP.core.DetachCompletePhase'
    ));

//  A set of phase types used when 'compiling' or transforming content from one
//  representation into another.
TP.core.TagProcessor.Type.defineConstant(
    'COMPILE_PHASES',
    TP.ac(
    'TP.core.IncludesPhase',        //  xi:includes, CSS @imports, etc.
    'TP.core.InstructionsPhase',    //  ?tibet, ?xsl-stylesheet, etc.
    'TP.core.PrecompilePhase',      //  conversion to compilable form
    'TP.core.CompilePhase',         //  tag/macro expansion (ACT)
    'TP.core.TidyPhase',            //  move non-DTD content out of html:head
                                    //  etc.

    'TP.core.ResolvePhase',         //  resolve xml:base TP.core.URI references,
                                    //  decode etc.

    'TP.core.LocalizePhase'         //  adjust for browser, lang, etc.
    ));

//  A common query used by some phases to find custom nodes - elements or
//  attributes.This query returns only nodes that are:
//      1. Element-type Nodes OR
//      2. Attribute-type Nodes that:
//          a. Have a namespace - most don't
//          b. Are not in the 'bind:' namespace
//          c. Are not in the 'ev:' namespace
//          d. Are not in the 'on:' namespace
TP.core.TagProcessor.Type.defineConstant(
    'CUSTOM_NODES_QUERY',
        'descendant-or-self::*' +
        ' | ' +
        '//@*[' +
        'namespace-uri() != ""' +
        ' and ' +
        'namespace-uri() != "' + TP.w3.Xmlns.XML + '"' +
        ' and ' +
        'namespace-uri() != "' + TP.w3.Xmlns.BIND + '"' +
        ' and ' +
        'namespace-uri() != "' + TP.w3.Xmlns.XML_EVENTS + '"' +
        ' and ' +
        'namespace-uri() != "' + TP.w3.Xmlns.ON + '"' +
        ']');

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

/**
 * A dictionary (hash) of tag types to tag identifiers. This is a cache so that
 * we don't have to look up the types each time.
 * @type {TP.core.Hash}
 */
TP.core.TagProcessor.Type.defineAttribute('$tagTypeDict');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.TagProcessor.Type.defineMethod('constructWithPhaseTypes',
function(phaseTypesArray) {

    /**
     * @method constructWithPhaseTypes
     * @summary Returns an instance of a tag processor with a set of instances
     *     of phases constructed from the supplied Array of phase types.
     * @param {Array} phaseTypesArray The Array of phase type objects to
     *     construct the phases from.
     * @returns {TP.core.TagProcessor} A new instance configured with instances
     *     of the phase types as its phase list.
     */

    var phaseInstances,
        newInst;

    phaseInstances = phaseTypesArray.collect(
                        function(phaseType) {
                            return phaseType.construct();
                        });

    newInst = this.construct(phaseInstances);

    return newInst;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

/**
 * The list of phases to run over the content when this processor is used
 * @type {Array}
 */
TP.core.TagProcessor.Inst.defineAttribute('phases');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.TagProcessor.Inst.defineMethod('init',
function(phases) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {Array} phases The list of phases to use when this processor is
     *     run over supplied content.
     * @returns {TP.core.TagProcessor} The receiver.
     */

    this.callNextMethod();

    this.set('phases', phases);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.TagProcessor.Inst.defineMethod('processTree',
function(aNode, aRequest, allowDetached) {

    /**
     * @method processTree
     * @summary Processes the supplied tree of content through this processor's
     *     configured set of phases.
     * @param {Node} aNode The node tree to use as the root to start the
     *     processing.
     * @param {TP.sig.Request} aRequest The request containing control
     *     parameters which may or may not be used, depending on the phase
     *     involved.
     * @param {Boolean} [allowDetached=false] Whether or not this method should
     *     allow detached nodes to be processed. Normally, this method does not
     *     process detached nodes, but sometimes (i.e. during node detachment
     *     unawaken processing), whether a node is detached or not needs to be
     *     ignored (obviously).
     * @exception TP.sig.InvalidNode
     * @returns {TP.core.TagProcessor} The receiver.
     */

    var phases,

        currentNode,

        len,
        i,

        wasACPTextNode,

        parentNode;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  Normalize the node to try to reduce the number of Text nodes as much as
    //  possible
    TP.nodeNormalize(aNode);

    phases = this.get('phases');

    currentNode = aNode;

    //  Iterate over the phases, processing the content through each one.
    len = phases.getSize();
    for (i = 0; i < len; i++) {

        //  A flag that is used if the currently processing node is a Text node
        //  containing ACP expressions.
        wasACPTextNode = false;

        //  If the node is a Text node and had ACP expressions, flag it and
        //  capture it's parent node.
        if (TP.isTextNode(currentNode) &&
            TP.regex.HAS_ACP.test(TP.nodeGetTextContent(currentNode))) {

            wasACPTextNode = true;
            parentNode = currentNode.parentNode;
        }

        phases.at(i).processNode(currentNode, this, aRequest, allowDetached);

        //  If we were processing a Text node containing ACP expressions and
        //  it's now detached, then we resume the next phase at it's (former)
        //  parent node (since it might have been replaced by a whole fragment).
        if (wasACPTextNode && TP.nodeIsDetached(currentNode)) {
            currentNode = parentNode;
        }
    }

    //  To reduce markup clutter, try to propagate namespaces as high
    //  up as possible.
    if (TP.isElement(aNode)) {
        TP.elementBubbleXMLNSAttributesOnDescendants(aNode);
    } else if (TP.isDocument(aNode)) {
        TP.elementBubbleXMLNSAttributesOnDescendants(aNode.documentElement);
    }

    return this;
});

//  ========================================================================
//  TP.core.TagProcessorPhase
//  ========================================================================

/**
 * @type {TP.core.TagProcessorPhase}
 * @summary The top-level tag processor 'phase' type, used in conjunction with
 *     the tag processor type. The tag processor holds 1...n phases and
 *     processes it's content through each one.
 */

//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('core.TagProcessorPhase');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.Inst.defineMethod('getFilteredNodes',
function(aNode, aProcessor) {

    /**
     * @method getFilteredNodes
     * @summary Given the supplied node, this method queries it (using the
     *     'queryForNodes()' method) and then filters that set down to the nodes
     *     whose TIBET wrapper type can respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @param {TP.core.TagProcessor} aProcessor The processor that 'owns' this
     *     phase.
     * @exception TP.sig.InvalidNode
     * @exception TP.sig.InvalidParameter
     * @returns {Array} An array containing a set of filtered Nodes.
     */

    var methodName,

        tagTypeDict,
        canInvokeInfo,

        queriedNodes,
        filteredNodes;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    if (!TP.isString(methodName = this.getTargetMethod())) {
        return this.raise('TP.sig.InvalidParameter');
    }

    //  Grab the processor-wide tag type hash that is used to cache tag types.
    tagTypeDict = aProcessor.getType().get('$tagTypeDict');
    if (TP.notValid(tagTypeDict)) {
        tagTypeDict = TP.hc();
        aProcessor.getType().set('$tagTypeDict', tagTypeDict);
    }

    //  Build a hash that will track whether certain tag types can invoke the
    //  target method for this phase.
    canInvokeInfo = TP.hc();

    //  Query the tree for the set of nodes to consider when processing. This
    //  can significantly reduce the number of nodes considered.
    queriedNodes = this.queryForNodes(aNode);

    //  Out of the batch of queried nodes, select only those whose TIBET wrapper
    //  type implement this phases's target method.
    filteredNodes = queriedNodes.select(
        function(node) {
            var type,
                elemKey,

                canInvoke;

            //  If the considered node is an element, see if there are entries
            //  for it in the tag type hash and invocation tracking hash under
            //  its full name. This means this type of element has already been
            //  found once and queried as to whether it can respond to this
            //  phase's target method.
            if (TP.isElement(node)) {
                elemKey = TP.elementComputeTIBETTypeKey(node);
                if (tagTypeDict.hasKey(elemKey) &&
                    canInvokeInfo.hasKey(elemKey)) {
                    return canInvokeInfo.at(elemKey);
                }
            }

            //  If we can't get a concrete type at all, then we just return
            //  false. Can't do anything from here.
            if (!TP.isType(type = TP.core.Node.getConcreteType(node))) {
                return false;
            }

            //  If the type is an abstract type, warn about it. It's probably
            //  not what we're looking for.
            if (!tagTypeDict.hasKey(elemKey) &&
                TP.notEmpty(elemKey) &&
                type.isAbstract()) {
                TP.ifWarn() ?
                    TP.warn('Abstract type: ' + TP.name(type) +
                            ' computed for element key: ' + elemKey + '.') : 0;
            }

            //  If we're processing an Element, elemKey will have been set
            //  above.
            if (TP.notEmpty(elemKey) &&
                elemKey !== 'processingroot' &&
                type === TP.core.XMLElementNode &&
                TP.sys.cfg('sherpa.autodefine_missing_tags')) {

                //  If the Sherpa is loaded and has been configured to
                //  automatically define missing tags, then we do so.
                if (TP.sys.hasFeature('sherpa')) {
                    TP.core.Sherpa.replaceWithUnknownElementProxy(node);
                }
            }

            canInvoke = TP.canInvoke(type, methodName);

            //  If the considered node is an element, then we can make an entry
            //  for it in our tag type hash and invocation tracking hash under
            //  that name for later fast lookup for the same type of element in
            //  the tree of nodes being considered.
            if (TP.isElement(node)) {
                tagTypeDict.atPut(elemKey, type);
                canInvokeInfo.atPut(elemKey, canInvoke);
            }

            return canInvoke;
        });

    return filteredNodes;
});

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return TP.override();
});

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.Inst.defineMethod('processNode',
function(aNode, aProcessor, aRequest, allowDetached) {

    /**
     * @method processNode
     * @summary Processes the content of the supplied Node through this
     *     processor phase.
     * @param {Node} aNode The root node to start the processing from.
     * @param {TP.core.TagProcessor} aProcessor The processor that 'owns' this
     *     phase.
     * @param {TP.sig.Request} aRequest The request containing control
     *     parameters which may or may not be used, depending on the phase
     *     involved.
     * @param {Boolean} [allowDetached=false] Whether or not this method should
     *     allow detached nodes to be processed. Normally, this method does not
     *     process detached nodes, but sometimes (i.e. during node detachment
     *     unawaken processing), whether a node is detached or not needs to be
     *     ignored (obviously).
     * @exception TP.sig.InvalidNode
     * @exception TP.sig.InvalidParameter
     * @returns {TP.core.TagProcessorPhase} The receiver.
     */

    var methodName,
        nodes,
        tagTypeDict,

        producedEntries,

        processingRequest,

        len,
        i,

        node,
        type,

        result,

        subPhases,
        subProcessor,
        subProcessingRequest,

        sources,

        nodeToProcess,
        source;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    if (!TP.isString(methodName = this.getTargetMethod())) {
        return this.raise('TP.sig.InvalidParameter');
    }

    if (TP.isEmpty(nodes = this.getFilteredNodes(aNode, aProcessor))) {
        return this;
    }

    //  Configure the processing request, starting with any parameters from the
    //  supplied request.
    processingRequest = TP.request(aRequest);

    processingRequest.atPut('currentPhase', this);
    processingRequest.atPut('phases', aProcessor.get('phases'));

    processingRequest.atPutIfAbsent('doc', TP.nodeGetDocument(aNode));

    //  Some invokers of this method will have the content in a 'processing
    //  root' element that takes into account that this engine holds onto the
    //  same node throughout the transformation process, so that's not the node
    //  that can itself be transformed. In any case, we want our 'root'
    //  parameter to be set to that root element's firstChild if it's present.
    if (TP.isElement(aNode) &&
        TP.elementGetLocalName(aNode) === 'processingroot') {
        processingRequest.atPut('root', aNode.firstChild);
    } else {
        processingRequest.atPut('root', aNode);
    }

    //  Grab the processor-wide tag type hash that is used to cache tag types.
    tagTypeDict = aProcessor.getType().get('$tagTypeDict');
    if (TP.notValid(tagTypeDict)) {
        tagTypeDict = TP.hc();
        aProcessor.getType().set('$tagTypeDict', tagTypeDict);
    }

    //  Any nodes that are actually newly-produced (and returned) by running the
    //  processor over the supplied content.
    producedEntries = TP.ac();

    //  Put a reference to all of the nodes that this phase identifier for
    //  processing. NOTE: This Array can be modified by the phase. See note
    //  below about why 'getSize()' is used each time through the loop.
    processingRequest.atPut('detectedNodes', nodes);

    //  NB: Do *not* change this to have a cached size - leave it as
    //  'getSize()', since processing steps can remove nodes from this Array as
    //  they process and this needs to be retested each time.
    for (i = 0; i < nodes.getSize(); i++) {
        node = nodes.at(i);

        //  If one of the phases detached this node, then just continue on.
        if (TP.nodeIsDetached(node) && TP.notTrue(allowDetached)) {
            continue;
        }

        processingRequest.atPut('node', node);

        //  If the considered node is an element, see if there are entries for
        //  it in the tag type hash under its full name. This means this type of
        //  element has already been found once. Otherwise, just go ahead and
        //  query it for it's TIBET wrapper type.
        if (TP.isElement(node)) {
            if (!TP.isType(type = tagTypeDict.at(
                                    TP.elementComputeTIBETTypeKey(node)))) {
                type = TP.core.Node.getConcreteType(node);
            }
        } else {
            type = TP.core.Node.getConcreteType(node);
        }

        try {
            //  Do the deed, invoking the target method against the wrapper type
            //  and supplying the request.
            result = type[methodName](processingRequest);
        } catch (e) {
            TP.ifError() ?
                TP.error(TP.ec(e,
                        'Error in ' +
                        type.getTypeName() + ' for: ' + TP.str(node))) : 0;
        }

        //  If we got a node we need to inspect that node and compare to result
        //  to determine the right action to take.
        if (TP.isNode(result)) {

            //  Compare result. If identical or equal we essentially have an
            //  "unprocessed" variation of the original node as our result.
            if (result === node || TP.nodeEqualsNode(result, node)) {

                //  If the node had a generator and it's not the same as the one
                //  for our result node we've got outstanding work to do due to
                //  the generator change, otherwise we're done here.
                if (TP.isValid(node[TP.GENERATOR]) &&
                    node[TP.GENERATOR] !== result[TP.GENERATOR]) {
                    void 0;
                } else {
                    //  If we were to reprocess here the likely result is an
                    //  endless recursion since we got back matching content the
                    //  first time through.
                    continue;
                }
            }

            producedEntries.push(TP.ac(result, node));
        }
    }

    //  If the list of nodes that executing this phase against the various
    //  target content Nodes is not empty, then we need to process them *from
    //  the processor's first phase up through ourself* (so as to have
    //  consistent results).
    if (TP.notEmpty(producedEntries)) {
        //  Grab the processor's phase list and slice a copy of it from the
        //  beginning to this phase (inclusive)
        subPhases = aProcessor.get('phases');

        subPhases = subPhases.slice(0, subPhases.indexOf(this) + 1);

        //  Configure a new processor with that phase list
        subProcessor = TP.core.TagProcessor.construct();
        subProcessor.set('phases', subPhases);

        subProcessingRequest = TP.request(aRequest);

        //  The 'sources' Array provides processing sub nodes with a reference
        //  back to the node that produced them
        if (!TP.isArray(sources = subProcessingRequest.at('sources'))) {
            sources = TP.ac();
            subProcessingRequest.atPut('sources', sources);
        }

        //  Run the subprocessor on the produced nodes, thereby recursively
        //  processing the tree.
        len = producedEntries.getSize();
        for (i = 0; i < len; i++) {

            nodeToProcess = producedEntries.at(i).first();
            source = producedEntries.at(i).last();

            //  If one of the phases detached this node, then just continue on.
            if (TP.nodeIsDetached(nodeToProcess) && TP.notTrue(allowDetached)) {
                continue;
            }

            //  Push the node that produced the node we're going to process into
            //  the sources Array. See above to see how producedEntries is
            //  populated.
            sources.push(source);

            subProcessor.processTree(nodeToProcess, subProcessingRequest);

            //  Pop the source that was in effect.
            sources.pop();
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  The default phase grabs *all* nodes here - not just Elements. Note that
    //  this expression will also grab aNode itself.
    query = 'descendant-or-self::node()';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.IncludesPhase
//  ========================================================================

/**
 * @type {TP.core.IncludesPhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.IncludesPhase');

//  ------------------------------------------------------------------------

TP.core.IncludesPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagIncludes';
});

//  ------------------------------------------------------------------------

TP.core.IncludesPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    query = 'descendant-or-self::*[namespace-uri() = "' +
                                        TP.w3.Xmlns.XINCLUDE +
                                        '"]';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.InstructionsPhase
//  ========================================================================

/**
 * @type {TP.core.InstructionsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.InstructionsPhase');

//  ------------------------------------------------------------------------

TP.core.InstructionsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagInstructions';
});

//  ------------------------------------------------------------------------

TP.core.InstructionsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    query = './/processing-instruction()[name()="tibet-stylesheet"]';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.PrecompilePhase
//  ========================================================================

/**
 * @type {TP.core.PrecompilePhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.PrecompilePhase');

//  ------------------------------------------------------------------------

TP.core.PrecompilePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagPrecompile';
});

//  ------------------------------------------------------------------------

TP.core.PrecompilePhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var queriedNodes;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  If the supplied node is a text node or an attribute node and has ACP
    //  (templating) expressions, then return an Array with that node's either
    //  ownerElement or parentNode (depending on whether it is an attribute or
    //  text node).
    if (TP.isAttributeNode(aNode) &&
        TP.regex.HAS_ACP.test(TP.nodeGetTextContent(aNode))) {
        queriedNodes = TP.ac(aNode.ownerElement);
    } else if (TP.isTextNode(aNode) &&
        TP.regex.HAS_ACP.test(TP.nodeGetTextContent(aNode))) {
        queriedNodes = TP.ac(aNode.parentNode);
    } else {

        //  Run an XPath query to find text within either attributes or elements
        //  that has ACP expressions *and return their parent Element* (i.e.
        //  either ownerElement or parentNode, depending on node type).

        //  NB: The attribute portion of this query does *not* pick attributes
        //  in the TP.w3.Xmlns.UI namespace - they might contain runtime
        //  formatting instructions (i.e. 'ui:display', etc.)
        queriedNodes = TP.nodeEvaluateXPath(
            aNode,
            './/@*[contains(.,"{{") and ' +
                        'namespace-uri() != "' + TP.w3.Xmlns.UI + '"]/..' +
            ' | ' +
            './/text()[contains(.,"{{")]/..',
            TP.NODESET);
    }

    if (TP.isEmpty(queriedNodes)) {
        return queriedNodes;
    }

    //  We only want the roots out of this node set - that'll give us the 'most
    //  shallow' nodes with ACP expressions.
    return TP.nodesGetRoots(queriedNodes);
});

//  ========================================================================
//  TP.core.CompilePhase
//  ========================================================================

/**
 * @type {TP.core.CompilePhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.CompilePhase');

//  ------------------------------------------------------------------------

TP.core.CompilePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return '$tagCompileAndRegister';
});

//  ------------------------------------------------------------------------

TP.core.CompilePhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  See the type constants for a description of this query.
    query = TP.core.TagProcessor.CUSTOM_NODES_QUERY;

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.TidyPhase
//  ========================================================================

/**
 * @type {TP.core.TidyPhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.TidyPhase');

//  ------------------------------------------------------------------------

TP.core.TidyPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagTidy';
});

//  ------------------------------------------------------------------------

TP.core.TidyPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var queriedNodes;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in Element-type Nodes.
    queriedNodes = TP.nodeGetElementsByTagName(aNode, '*');

    return queriedNodes;
});

//  ========================================================================
//  TP.core.ResolvePhase
//  ========================================================================

/**
 * @type {TP.core.ResolvePhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.ResolvePhase');

//  ------------------------------------------------------------------------

TP.core.ResolvePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagResolve';
});

//  ------------------------------------------------------------------------

TP.core.ResolvePhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var queriedNodes;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in Element-type Nodes.
    queriedNodes = TP.nodeGetElementsByTagName(aNode, '*');

    return queriedNodes;
});

//  ========================================================================
//  TP.core.LocalizePhase
//  ========================================================================

/**
 * @type {TP.core.LocalizePhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.LocalizePhase');

//  ------------------------------------------------------------------------

TP.core.LocalizePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagLocalize';
});

//  ========================================================================
//  TP.core.MutationPhase
//  ========================================================================

/**
 * @type {TP.core.MutationPhase}
 */

//  ------------------------------------------------------------------------

TP.core.TagProcessorPhase.defineSubtype('core.MutationPhase');

TP.core.MutationPhase.isAbstract(true);

//  ========================================================================
//  TP.core.AttachDOMPhase
//  ========================================================================

/**
 * @type {TP.core.AttachDOMPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachDOMPhase');

//  ------------------------------------------------------------------------

TP.core.AttachDOMPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachDOM';
});

//  ------------------------------------------------------------------------

TP.core.AttachDOMPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    if (!TP.isNode(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  See the type constants for a description of this query.
    query = TP.core.TagProcessor.CUSTOM_NODES_QUERY;

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.AttachEventsPhase
//  ========================================================================

/**
 * @type {TP.core.AttachEventsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachEventsPhase');

//  ------------------------------------------------------------------------

TP.core.AttachEventsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachEvents';
});

//  ------------------------------------------------------------------------

TP.core.AttachEventsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in elements that either are in the 'ev:' namespace
    //  or have attributes in the 'ev:' namespace
    query = 'descendant-or-self::*' +
            '[' +
            'namespace-uri() = "' + TP.w3.Xmlns.XML_EVENTS + '"' +
            ' or ' +
            '@*[namespace-uri() = "' + TP.w3.Xmlns.XML_EVENTS + '"]' +
            ']';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.AttachDataPhase
//  ========================================================================

/**
 * @type {TP.core.AttachDataPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachDataPhase');

//  ------------------------------------------------------------------------

TP.core.AttachDataPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachData';
});

//  ========================================================================
//  TP.core.AttachSignalsPhase
//  ========================================================================

/**
 * @type {TP.core.AttachSignalsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachSignalsPhase');

//  ------------------------------------------------------------------------

TP.core.AttachSignalsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachSignals';
});

//  ------------------------------------------------------------------------

TP.core.AttachSignalsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in elements that have attributes in the 'on:'
    //  namespace
    query = 'descendant-or-self::*' +
            '[' +
            '@*[namespace-uri() = "' + TP.w3.Xmlns.ON + '"]' +
            ']';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.AttachInfoPhase
//  ========================================================================

/**
 * @type {TP.core.AttachInfoPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachInfoPhase');

//  ------------------------------------------------------------------------

TP.core.AttachInfoPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachInfo';
});

//  ------------------------------------------------------------------------

TP.core.AttachInfoPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in elements that have a local name of 'info'.
    query = 'descendant-or-self::*[local-name() = "info"]';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.AttachBindsPhase
//  ========================================================================

/**
 * @type {TP.core.AttachBindsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachBindsPhase');

//  ------------------------------------------------------------------------

TP.core.AttachBindsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachBinds';
});

//  ------------------------------------------------------------------------

TP.core.AttachBindsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        boundElements,

        boundTextNodes,

        allBoundNodes,
        commonAncestor;

    //  According to DOM Level 3, we can't use DocumentFragments as the context
    //  node for evaluating a CSS expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  If this wasn't another type of collection node (i.e. Document or
    //  Element), then just return an empty Array here.
    if (!TP.isCollectionNode(aNode)) {
        return TP.ac();
    }

    //  Query for any attributes named 'io', 'in', 'scope' or 'repeat', no
    //  matter what namespace they're in. Note that this is about as
    //  sophisticated as we can get with namespaces using the querySelectorAll()
    //  call in most browsers. It is extremely fast, which is why we use it and
    //  then filter more later, but it's query capabilities around namespaces is
    //  quite pathetic.
    query = '*[*|io],' +
            '*[*|in],' +
            '*[*|scope],' +
            '*[*|repeat]';

    boundElements = TP.ac(aNode.ownerDocument.querySelectorAll(query));

    //  Since querySelectorAll always queries from the Document even though we
    //  messaged the Element (yet another limitation... sigh...) we have to
    //  filter further based on containment.
    boundElements = boundElements.filter(
            function(anElem) {
                return aNode.contains(anElem);
            });

    //  Grab any standalone text nodes that have binding expressions.
    boundTextNodes = TP.wrap(aNode).getTextNodesMatching(
            function(aTextNode) {

                var textContent;

                textContent = aTextNode.textContent;

                //  Note here that we not only check to see if the text content
                //  has double-bracket binding statements, but also to make sure
                //  that it's not a JSON String - we don't want to turn whole
                //  chunks of JSON data into the value of the 'bind:in'
                if (TP.regex.BINDING_STATEMENT_DETECT.test(textContent) &&
                    !TP.isJSONString(textContent)) {
                    return true;
                }

                return false;
            });

    //  If any node under the context node matches, then we need to find a
    //  common ancestor for the nodes that matched.

    //  Start by making a set of all bound nodes, Elements or Text nodes.
    allBoundNodes = boundElements.concat(boundTextNodes);

    //  If there is more than 1, then find the common ancestor and return an
    //  Array with that Element.
    if (allBoundNodes.getSize() > 1) {
        commonAncestor = TP.nodeGetCommonAncestor.apply(TP, allBoundNodes);

        return TP.ac(commonAncestor);
    } else if (allBoundNodes.getSize() === 1) {

        //  Otherwise, if its just 1 then if there are no bound *Elements*, it
        //  must be a single Text node. Return an Array with that Text node's
        //  parent node (i.e. the Element surrounding it).
        if (boundElements.getSize() === 0) {
            return TP.ac(boundTextNodes.first().parentNode);
        } else {

            //  Otherwise, the bound elements Array already has what we want.
            return boundElements;
        }
    }

    //  No binding Elements or Text nodes found.
    return TP.ac();
});

//  ========================================================================
//  TP.core.AttachStylePhase
//  ========================================================================

/**
 * @type {TP.core.AttachStylePhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachStylePhase');

//  ------------------------------------------------------------------------

TP.core.AttachStylePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachStyle';
});

//  ========================================================================
//  TP.core.AttachCompletePhase
//  ========================================================================

/**
 * @type {TP.core.AttachCompletePhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.AttachCompletePhase');

//  ------------------------------------------------------------------------

TP.core.AttachCompletePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagAttachComplete';
});

//  ========================================================================
//  TP.core.DetachDOMPhase
//  ========================================================================

/**
 * @type {TP.core.DetachDOMPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachDOMPhase');

//  ------------------------------------------------------------------------

TP.core.DetachDOMPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachDOM';
});

//  ========================================================================
//  TP.core.DetachEventsPhase
//  ========================================================================

/**
 * @type {TP.core.DetachEventsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachEventsPhase');

//  ------------------------------------------------------------------------

TP.core.DetachEventsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachEvents';
});

//  ------------------------------------------------------------------------

TP.core.DetachEventsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in elements that either are in the 'ev:' namespace
    //  or have attributes in the 'ev:' namespace
    query = 'descendant-or-self::*' +
            '[' +
            'namespace-uri() = "' + TP.w3.Xmlns.XML_EVENTS + '"' +
            ' or ' +
            '@*[namespace-uri() = "' + TP.w3.Xmlns.XML_EVENTS + '"]' +
            ']';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.DetachSignalsPhase
//  ========================================================================

/**
 * @type {TP.core.DetachSignalsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachSignalsPhase');

//  ------------------------------------------------------------------------

TP.core.DetachSignalsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachSignals';
});

//  ------------------------------------------------------------------------

TP.core.DetachSignalsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in elements that have attributes in the 'on:'
    //  namespace
    query = 'descendant-or-self::*' +
            '[' +
            '@*[namespace-uri() = "' + TP.w3.Xmlns.ON + '"]' +
            ']';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.DetachDataPhase
//  ========================================================================

/**
 * @type {TP.core.DetachDataPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachDataPhase');

//  ------------------------------------------------------------------------

TP.core.DetachDataPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachData';
});

//  ========================================================================
//  TP.core.DetachInfoPhase
//  ========================================================================

/**
 * @type {TP.core.DetachInfoPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachInfoPhase');

//  ------------------------------------------------------------------------

TP.core.DetachInfoPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachInfo';
});

//  ------------------------------------------------------------------------

TP.core.DetachInfoPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        queriedNodes;

    //  According to DOM Level 3 XPath, we can't use DocumentFragments as the
    //  context node for evaluating an XPath expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  We're only interested in elements that have a local name of 'info'.
    query = 'descendant-or-self::*[local-name() = "info"]';

    queriedNodes = TP.nodeEvaluateXPath(aNode, query, TP.NODESET);

    return queriedNodes;
});

//  ========================================================================
//  TP.core.DetachBindsPhase
//  ========================================================================

/**
 * @type {TP.core.DetachBindsPhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachBindsPhase');

//  ------------------------------------------------------------------------

TP.core.DetachBindsPhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachBinds';
});

//  ------------------------------------------------------------------------

TP.core.DetachBindsPhase.Inst.defineMethod('queryForNodes',
function(aNode) {

    /**
     * @method queryForNodes
     * @summary Given the supplied node, this method queries it using a query
     *     very specific to this phase.
     * @description This method should produce the sparsest result set possible
     *     for consideration by the next phase of the tag processing engine,
     *     which is to then filter this set by whether a) a TIBET wrapper type
     *     can be found for each result and b) whether that wrapper type can
     *     respond to this phase's target method.
     * @param {Node} aNode The root node to start the query from.
     * @returns {Array} An array containing the subset of Nodes from the root
     *     node that this phase should even consider to try to process.
     */

    var query,
        boundElements,

        boundTextNodes,

        allBoundNodes,
        commonAncestor;

    //  According to DOM Level 3, we can't use DocumentFragments as the context
    //  node for evaluating a CSS expression.
    if (!TP.isNode(aNode) || TP.isFragment(aNode)) {
        return this.raise('TP.sig.InvalidNode');
    }

    //  If this wasn't another type of collection node (i.e. Document or
    //  Element), then just return an empty Array here.
    if (!TP.isCollectionNode(aNode)) {
        return TP.ac();
    }

    //  Query for any attributes named 'io', 'in', 'scope' or 'repeat', no
    //  matter what namespace they're in. Note that this is about as
    //  sophisticated as we can get with namespaces using the querySelectorAll()
    //  call in most browsers. It is extremely fast, which is why we use it and
    //  then filter more later, but it's query capabilities around namespaces is
    //  quite pathetic.
    query = '*[*|io],' +
            '*[*|in],' +
            '*[*|scope],' +
            '*[*|repeat]';

    boundElements = TP.ac(aNode.ownerDocument.querySelectorAll(query));

    //  Since querySelectorAll always queries from the Document even though we
    //  messaged the Element (yet another limitation... sigh...) we have to
    //  filter further based on containment.
    boundElements = boundElements.filter(
            function(anElem) {
                return aNode.contains(anElem);
            });

    //  Grab any standalone text nodes that have binding expressions.
    boundTextNodes = TP.wrap(aNode).getTextNodesMatching(
            function(aTextNode) {

                var textContent;

                textContent = aTextNode.textContent;

                //  Note here that we not only check to see if the text content
                //  has double-bracket binding statements, but also to make sure
                //  that it's not a JSON String - we don't want to turn whole
                //  chunks of JSON data into the value of the 'bind:in'
                if (TP.regex.BINDING_STATEMENT_DETECT.test(textContent) &&
                    !TP.isJSONString(textContent)) {
                    return true;
                }

                return false;
            });

    //  If any node under the context node matches, then we need to find a
    //  common ancestor for the nodes that matched.

    //  Start by making a set of all bound nodes, Elements or Text nodes.
    allBoundNodes = boundElements.concat(boundTextNodes);

    //  If there is more than 1, then find the common ancestor and return an
    //  Array with that Element.
    if (allBoundNodes.getSize() > 1) {
        commonAncestor = TP.nodeGetCommonAncestor.apply(TP, allBoundNodes);

        return TP.ac(commonAncestor);
    } else if (allBoundNodes.getSize() === 1) {

        //  Otherwise, if its just 1 then if there are no bound *Elements*, it
        //  must be a single Text node. Return an Array with that Text node's
        //  parent node (i.e. the Element surrounding it).
        if (boundElements.getSize() === 0) {
            return TP.ac(boundTextNodes.first().parentNode);
        } else {

            //  Otherwise, the bound elements Array already has what we want.
            return boundElements;
        }
    }

    //  No binding Elements or Text nodes found.
    return TP.ac();
});

//  ========================================================================
//  TP.core.DetachStylePhase
//  ========================================================================

/**
 * @type {TP.core.DetachStylePhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachStylePhase');

//  ------------------------------------------------------------------------

TP.core.DetachStylePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachStyle';
});

//  ========================================================================
//  TP.core.DetachCompletePhase
//  ========================================================================

/**
 * @type {TP.core.DetachCompletePhase}
 */

//  ------------------------------------------------------------------------

TP.core.MutationPhase.defineSubtype('core.DetachCompletePhase');

//  ------------------------------------------------------------------------

TP.core.DetachCompletePhase.Inst.defineMethod('getTargetMethod',
function() {

    /**
     * @method getTargetMethod
     * @summary Returns the method that a target of this tag processor phase
     *     (usually a TIBET wrapper type for a node) needs to implement in order
     *     for this phase to consider that part of content in its processing.
     * @returns {String} The name of the method this phase will use to message
     *     the target content.
     */

    return 'tagDetachComplete';
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
