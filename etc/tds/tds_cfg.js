//  ============================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ============================================================================

/**
 * @overview Server-side TDS configuration data. This file is loaded by the
 *     tds_base.js file and CLI but _NOT_ by the client code (tibet_loader.js).
 *     Content here consists of all TDS-related flags which should not be
 *     exposed to the client. There are a handful of TDS flags, primarily those
 *     which expose TDS URI endpoints, in the tibet_cfg.js file.
 */

(function(root) {
    'use strict';

    var Config;

    //  ---
    //  baseline
    //  ---

    /**
     * A configuration function that expects to be passed the setcfg call to
     * invoke. This will normally be either TDS.setcfg or TP.sys.setcfg.
     */
    Config = function(setcfg) {

        setcfg('path.tds_file', '~/tds.json');
        setcfg('path.tds_plugins', '~/plugins');
        setcfg('path.tds_tasks', '~tds_plugins/tasks');

        //  paths specific to definitions used to push "couchapp" content
        setcfg('path.tds_couch_defs', '~/couch/app');
        setcfg('path.couchapp', '~/couch/tws');

        //  paths specific to definitions used to push TWS documents
        setcfg('path.tds_task_defs', '~/couch/tws');
        setcfg('path.tws', '~/couch/tws');

        //  CLI flag defaulting
        setcfg('cli.tws.confirm', true);    //  should tws confirm db target?

        //  default definitions for cookie keys. should be changed for real work
        setcfg('tds.cookie.key1', 'T1B3TC00K13');   //   change this too :)
        setcfg('tds.cookie.key2', '31K00CT3B1T');   //   change this too :)

        setcfg('tds.https', false);

        //  NOTE we don't set this here but provide it as a reminder that you
        //  can choose to map https TDS operations to a non-priviledged port
        setcfg('tds.https_port', null);

        setcfg('tds.log.color', true);
        setcfg('tds.log.count', 5);
        setcfg('tds.log.file', '~app_log/tds-{{env}}.log');
        setcfg('tds.log.format', 'dev');
        setcfg('tds.log.level', 'info');
        setcfg('tds.log.routes', false);
        setcfg('tds.log.size', 5242880); // 5MB

        setcfg('tds.max_bodysize', '5mb');

        //  NOTE we do _not_ default this here so env.PORT etc can be used when
        //  the parameter isn't being explicitly set. 1407 is hardcoded in
        //  server.js.
        setcfg('tds.port', null);

        setcfg('tds.secret.key', 'ThisIsNotSecureChangeIt');
        setcfg('tds.session.key', 'T1B3TS3SS10N');   //  change this too :)
        setcfg('tds.session.store', 'memory');

        setcfg('tds.stop_onerror', true);

        //  ---
        //  plugins
        //  ---

        //  Null here will cause default list (hardcoded in server.js) to load.
        //  Normally that's fine. Alterations are done via tds.json.
        setcfg('tds.plugins.core', null);

        //  Null here will cause them all to load (as will '*'). Otherwise the
        //  set is defined in tds.json in most cases.
        setcfg('tds.plugins.tds', null);


        setcfg('tds.auth.strategy', 'tds');

        setcfg('tds.couch.db_app', 'tibet');
        setcfg('tds.couch.db_name', null);
        setcfg('tds.couch.host', '127.0.0.1');
        setcfg('tds.couch.port', '5984');
        setcfg('tds.couch.scheme', 'http');

        setcfg('tds.couch.watch.couch2fs', true);
        setcfg('tds.couch.watch.empty', '\n');
        setcfg('tds.couch.watch.feed', 'continuous');
        setcfg('tds.couch.watch.filter', '*');
        setcfg('tds.couch.watch.fs2couch', true);
        setcfg('tds.couch.watch.heartbeat', 500);
        setcfg('tds.couch.watch.ignore', ['node_modules', 'TIBET-INF/tibet']);
        setcfg('tds.couch.watch.inactivity_ms', null);
        setcfg('tds.couch.watch.initial_retry_delay', 1000);
        setcfg('tds.couch.watch.max_retry_seconds', 360);
        setcfg('tds.couch.watch.response_grace_time', 5000);
        setcfg('tds.couch.watch.root', '~app');
        setcfg('tds.couch.watch.since', 'now');

        setcfg('tds.patch.root', '~');

        setcfg('tds.pouch.name', 'tds');
        setcfg('tds.pouch.prefix', './pouch/');
        setcfg('tds.pouch.route', '/db');

        setcfg('tds.proxy.map', null);

        setcfg('tds.static.private', []);

        setcfg('tds.tasks.db_app', 'tws');
        setcfg('tds.tasks.db_name', 'tasks');   //  often a suffix on proj db

        setcfg('tds.tasks.watch.feed', 'continuous');
        setcfg('tds.tasks.watch.heartbeat', 500);
        setcfg('tds.tasks.watch.inactivity_ms', null);
        setcfg('tds.tasks.watch.initial_retry_delay', 1000);
        setcfg('tds.tasks.watch.max_retry_seconds', 360);
        setcfg('tds.tasks.watch.response_grace_time', 5000);
        setcfg('tds.tasks.watch.since', 'now');

        //  NOTE these are off here. We want to force them to be turned on via
        //  the tds.json file which will enforce an environment-based setting.
        setcfg('tds.use_mocks', false);
        setcfg('tds.use_proxy', false);
        setcfg('tds.use_tasks', false);

        setcfg('tds.watch.heartbeat', 10000);
        setcfg('tds.watch.ignore', ['node_modules', 'TIBET-INF/tibet']);

        setcfg('tds.webdav.mount', '/');
        setcfg('tds.webdav.root', '~app');
    };

    module.exports = Config;

}(this));
