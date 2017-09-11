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
 * @type {TP.couchdb.CouchDBURLHandler}
 * @summary A URL handler that manages URLs coming from CouchDB. Changes from
 *     CouchDB come in the form of the CouchDB changes feed, which this handler
 *     can be configured to observe. NOTE that CouchDB observations are done
 *     independently of the 'tds.watch' configuration. This independence lets
 *     you interact with both the TDS and CouchDB as needed.
 */

//  ------------------------------------------------------------------------

TP.core.HTTPURLHandler.defineSubtype('couchdb.CouchDBURLHandler');

TP.couchdb.CouchDBURLHandler.addTraits(TP.core.RemoteURLWatchHandler);

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineConstant(
    'DATABASE_PATH_MATCHER',
    /^[a-z]{1}[a-z0-9_$()+-]*\/$/);

TP.couchdb.CouchDBURLHandler.Type.defineConstant(
    'DATABASE_AND_DOCUMENT_PATH_MATCHER',
    /^[a-z]{1}[a-z0-9_$()+-]*\/[a-z0-9]+$/);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

//  Configuration names for the include/exclude configuration setting for the
//  remote url watcher types which mix this in.
TP.couchdb.CouchDBURLHandler.set('includeConfigName',
    'tds.couch.watch.include');
TP.couchdb.CouchDBURLHandler.set('excludeConfigName',
    'tds.couch.watch.exclude');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('activateRemoteWatch',
function() {

    /**
     * @method activateRemoteWatch
     * @summary Performs any processing necessary to activate observation of
     *     remote URL changes.
     */

    var sourceType,
        signalType,
        thisref;

    if (TP.notTrue(TP.sys.cfg('uri.watch_couchdb_changes'))) {
        return;
    }

    sourceType = this.getWatcherSourceType();
    signalType = this.getWatcherSignalType();

    thisref = this;

    //  For Couch we set up multiple observations against different URIs.
    this.getWatcherSourceURIs().perform(
        function(sourceURI) {
            var signalSource;

            signalSource = sourceType.construct(
                                        sourceURI.getLocation(),
                                        TP.hc('withCredentials', true));
            if (TP.notValid(signalSource)) {
                return thisref.raise('InvalidURLWatchSource');
            }

            thisref.observe(signalSource, signalType);
        });

    return;
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('deactivateRemoteWatch',
function() {

    /**
     * @method deactivateRemoteWatch
     * @summary Performs any processing necessary to shut down observation of
     *     remote URL changes.
     */

    return;
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('getWatcherSignalType',
function() {

    /**
     * @method getWatcherSignalType
     * @summary Returns the TIBET type of the watcher signal. This will be the
     *     signal that the signal source sends when it wants to notify URIs of
     *     changes.
     * @returns {TP.sig.RemoteURLChange} The type that will be
     *     instantiated to construct new signals that notify observers that the
     *     *remote* version of the supplied URI's resource has changed. At this
     *     level, this returns the common supertype of all such signals.
     */

    return TP.sig.CouchDBChange;
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('getWatcherSourceURIs',
function() {

    /**
     * @method getWatcherSourceURIs
     * @summary Returns an array of URIs which are needed to observe CouchDBs
     *     various change feeds.
     * @returns {TP.core.URI[]} An Array of URIs pointing to 'change feed'
     *     resources that will notify TIBET when the supplied URI's resource
     *     changes.
     */

    var watcherSourceURIs,

        rootURLs,
        targets;

    watcherSourceURIs = TP.ac();

    //  Grab the CouchDB 'root' URLs (i.e. servers) that the system knows about
    //  via the config system.
    rootURLs = TP.sys.getcfg('uri.couchdb_urls');

    //  Grab the non-server URI patterns that we should be watching.
    targets = TP.sys.getcfg('uri.watch_couchdb_uris');

    //  Iterate over the root server URLs and process them.
    rootURLs.forEach(
            function(aPair) {

                var rootURL;

                //  The rootURL will be the last part of the pair.
                rootURL = aPair.last();

                //  Join each URI pattern part onto the end of each root URL
                //  and, if a URI string can be formed, add it to the watcher
                //  source URI list.
                targets.forEach(
                        function(target) {
                            var url;

                            url = TP.uriJoinPaths(rootURL, target);
                            if (TP.isURIString(url)) {
                                watcherSourceURIs.push(TP.uc(url));
                            }
                        });
            });

    return watcherSourceURIs;
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineHandler('CouchDBChange',
function(aSignal) {

    /**
     * @method handleCouchDBChange
     * @summary Handles when a TDS-managed resource has changed.
     * @param {TP.sig.CouchDBChange} aSignal The signal indicating that a
     *     TDS-managed resource has changed.
     * @returns {TP.couchdb.CouchDBURLHandler} The receiver.
     */

    var payload,

        data,

        doc,
        attachments,

        rawRev,
        rev,

        entry,

        signalSourceURL,

        path,
        changesPathIndex,

        origin,

        urlLoc,
        url,

        id,
        dbDocPath,

        processed,
        docLoc;

    //  Make sure that we have a payload
    if (TP.notValid(payload = aSignal.getPayload())) {
        return;
    }

    //  And that we have SSE data in that payload
    data = payload.at('data');
    if (TP.notValid(data)) {
        return;
    }

    //  If there was a property named 'doc' in the data and it has a property
    //  named '_attachments', then we're observing a design document.
    if (TP.isValid(doc = data.at('doc')) &&
        TP.isValid(attachments = doc.at('_attachments'))) {

        //  Grab the '_rev' number
        rawRev = data.at('doc').at('_rev');
        rev = rawRev.slice(0, rawRev.indexOf('-')).asNumber();

        //  Iterate over all of the attachments and grab the one whose 'revpos'
        //  matches the rev number that changed.
        entry = attachments.detect(
                    function(kvPair) {
                        if (kvPair.last().at('revpos') === rev) {
                            return true;
                        }
                        return false;
                    });

        //  If we successfully found one, then the first item in it's key/value
        //  pair was the URL that changed.
        if (TP.isValid(entry)) {
            urlLoc = TP.uriJoinPaths(TP.uc('~app').getLocation(),
                                        entry.first());
        }

    } else {
        //  Otherwise, these changes came from a changes feed monitoring pure
        //  data, not the URLs making up a CouchApp.

        //  For CouchDB, we observe at a database-level, so we want the database
        //  URL.
        signalSourceURL = TP.uc(payload.at('sourceURL'));
        if (!TP.isURI(signalSourceURL)) {
            return;
        }

        path = signalSourceURL.getPath();

        //  Slice off the portion of the path from the first slash to where the
        //  '/_changes' portion starts. This will give us our database name -
        //  the database that changed. If there is no '/_changes' portion, then
        //  this must be an observation on the '_db_updates' feed, so we just
        //  set the path to the empty String.
        changesPathIndex = path.indexOf('/_changes');
        if (changesPathIndex !== TP.NOT_FOUND) {

            path = path.slice(1, changesPathIndex);

            //  Strip any enclosing quotes from the path.
            path = path.asString().stripEnclosingQuotes();

        } else {
            path = '';
        }

        //  The origin comes from the SSE data and will be server URL, minus the
        //  actual file path.
        origin = payload.at('origin').asString();

        //  Join the two together to form the full URL path
        urlLoc = TP.uriJoinPaths(origin, path);
    }

    //  If we can successfully create a URL from the data, then process the
    //  change.
    if (TP.isURI(url = TP.uc(urlLoc))) {

        processed = false;

        //  If the URL has subURIs, then we want to see if the change feed data
        //  mentions any of them as the 'id' of the document that changed.
        id = data.at('id');
        if (TP.notEmpty(id)) {

            //  Join the 'path' part of the URL (minus the root, and slicing off
            //  the leading '/') and the ID (which should be the ID of the
            //  document that changed).
            dbDocPath = TP.uriJoinPaths(url.getPath().slice(1), data.at('id'));

            //  Make sure that this path is pointing to a server/document.
            if (this.DATABASE_AND_DOCUMENT_PATH_MATCHER.test(dbDocPath)) {

                //  Join the whole URL's location with the ID. This will result
                //  in a URL that represents the full path to the CouchDB
                //  document.
                docLoc = TP.uriJoinPaths(url.getLocation(), data.at('id'));

                //  If there's a registered URL for that document, then we
                //  should fetch it from the server and signal a change
                if (TP.core.URI.hasInstance(docLoc)) {
                    url = TP.uc(docLoc);
                    url.getResource(
                            TP.hc('refresh', true, 'signalChange', true));

                    processed = true;
                }
            }
        }

        //  If we didn't process the URI, then it wasn't a regular document. We
        //  should let the regular processing machinery handle it.
        if (!processed) {

            //  NB: This will only actually process the resource change if the
            //  'uri.process_remote_changes' flag is true. Otherwise, it just
            //  tracks changes.
            TP.core.URI.processRemoteResourceChange(url);
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('isWatchableURI',
function(targetURI) {

    /**
     * @method isWatchableURI
     * @summary Tests a URI against include/exclude filters to determine if
     *     changes to the URI should be considered for processing.
     * @param {String|TP.core.URI} targetURI The URI to test.
     * @returns {Boolean} true if the URI passes include/exclude filters.
     */

    //  TODO: In actuality, only some CouchDB URIs are watchable, but for now we
    //  always return true.

    return true;
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('load',
function(targetURI, aRequest) {

    /**
     * @method load
     * @summary Loads URI data content, returning the TP.sig.Response object
     *     used to manage the low-level service response.
     * @param {TP.core.URI} targetURI The URI to load. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} The request's response object.
     */

    var request;

    request = TP.request(aRequest);

    //  Currently, CouchDB can only deal with 'simple CORS' (i.e. no preflight
    //  requests, etc.). Configure that here so that TIBET's low-level HTTP
    //  machinery doesn't try to send such things.
    request.atPut('simple_cors_only', true);

    return this.callNextMethod(targetURI, request);
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('delete',
function(targetURI, aRequest) {

    /**
     * @method delete
     * @summary Deletes a URI entirely, returning the TP.sig.Response object
     *     used to manage the low-level service response.
     * @param {TP.core.URI} targetURI The URI to delete. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} The request's response object.
     */

    var request;

    request = TP.request(aRequest);

    //  Currently, CouchDB can only deal with 'simple CORS' (i.e. no preflight
    //  requests, etc.). Configure that here so that TIBET's low-level HTTP
    //  machinery doesn't try to send such things.
    request.atPut('simple_cors_only', true);

    return this.callNextMethod(targetURI, request);
});

//  ------------------------------------------------------------------------

TP.couchdb.CouchDBURLHandler.Type.defineMethod('save',
function(targetURI, aRequest) {

    /**
     * @method save
     * @summary Saves URI data content. This is the default data persistence
     *     method for most URI content. Important request keys include 'method',
     *     'crud', and 'body'. Method will typically default to a POST unless
     *     TP.sys.cfg(http.use_webdav) is true and the crud parameter is set to
     *     'insert', in which case a PUT is used. The crud parameter effectively
     *     defaults to 'update' so you should set it to 'insert' when new
     *     content is being created. The 'body' should contain the new/updated
     *     content, but this is normally configured by the URI's save() method
     *     itself.
     * @param {TP.core.URI} targetURI The URI to save. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} The request's response object.
     */

    var request,
        saveURI;

    //  TODO: Only do this if targetURI is pointing to a CouchDB document

    request = TP.request(aRequest);

    saveURI = targetURI;

    //  Currently, CouchDB can only deal with 'simple CORS' (i.e. no preflight
    //  requests, etc.). Configure that here so that TIBET's low-level HTTP
    //  machinery doesn't try to send such things.
    request.atPut('simple_cors_only', true);

    //  Add a local handler for when the request succeeds that will update the
    //  '_rev' in the locally cached data to the new 'rev' sent back by the
    //  server.
    request.defineHandler('RequestSucceeded',
                function(aResponse) {
                    var newRev,
                        origData;

                    //  Grab the new 'rev' number from the result of the server
                    //  call.
                    newRev = aResponse.get('result').get('$.rev');

                    //  Using a JSONPath, set the value of '_rev' in the
                    //  original data to the new rev. This original data may be
                    //  used over and over again as updates are made, but per
                    //  CouchDB rules, it needs a new rev each time
                    origData = saveURI.getResource().get('result');

                    //  Note here that we pass 'false' to *not* signal changes
                    //  here.
                    origData.set('$._rev', newRev, false);
                });

    return this.callNextMethod(targetURI, request);
});

//  =======================================================================
//  Registration
//  ========================================================================

//  Make sure the remote url watcher knows about this handler type, but wait to
//  do this after the type has been fully configured to avoid api check error.
TP.core.RemoteURLWatchHandler.registerWatcher(TP.couchdb.CouchDBURLHandler);

//  =======================================================================
//  TP.sig.CouchDBChange
//  ========================================================================

TP.sig.RemoteURLChange.defineSubtype('CouchDBChange');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
