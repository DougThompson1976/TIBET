/**
 * @overview Simple task runner for sending email via nodemailer smtp.
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     open source waivers to keep your derivative work source code private.
 */

(function(root) {

    'use strict';

    /**
     *
     * @param {Object} options Configuration options shared across TDS modules.
     * @returns {Function} A function which will configure/activate the plugin.
     */
    module.exports = function(options) {
        var app,
            logger,
            TDS,
            nodemailer;

        app = options.app;
        logger = options.logger;
        TDS = app.TDS;

        nodemailer = require('nodemailer');

        //  ---
        //  Task
        //  ---

        /**
         * The actual task execution function which will be invoked by the task
         * runner.
         */
        return function(job, step, params) {
            var smtpOpts,
                mailOpts,
                transporter,
                template,
                send;

            logger.debug(job, JSON.stringify(step));

            //  Basic SMTP option sanity check
            if (!params.smtp) {
                return TDS.Promise.reject(new Error(
                    'Misconfigured SMTP task. No params.smtp.'));
            }

            //  Basic mail options sanity check
            if (!params.from || !params.subject) {
                return TDS.Promise.reject(new Error(
                'Misconfigured SMTP task. Missing params.from, ' +
                'params.to, and/or ' +
                'params.subject.'));
            }

            //  Basic content sanity check
            if (!params.text && !params.html) {
                logger.warn('Missing params.text and params.html.');
                params.text = '';
            }

            //  Map over the smtp parameters from the task as our top-level
            //  option data. This should give us service name, secure, host,
            //  port, auth: {user, pass} etc.
            smtpOpts = TDS.blend({}, params.smtp);

            //  Decrypt the username, which should always be provided from the
            //  database and stored in encrypted form.
            if (smtpOpts.auth && smtpOpts.auth.user) {
                smtpOpts.auth.user = TDS.decrypt(smtpOpts.auth.user);
            }

            //  Decrypt the password, which should always be provided from the
            //  database and stored in encrypted form.
            if (smtpOpts.auth && smtpOpts.auth.pass) {
                smtpOpts.auth.pass = TDS.decrypt(smtpOpts.auth.pass);
            }

            if (smtpOpts.secure === undefined) {
                smtpOpts.secure = true;
            }

            mailOpts = {};

            mailOpts.subject = params.subject;
            mailOpts.from = params.from;
            mailOpts.to = params.to;

            try {
                if (params.html) {
                    template = TDS.template.compile(params.html);
                    mailOpts.html = template(
                        {
                            job: job,
                            step: step,
                            params: params
                        });
                } else if (params.text) {
                    template = TDS.template.compile(params.text);
                    mailOpts.text = template(
                        {
                            job: job,
                            step: step,
                            params: params
                        });
                }
            } catch (e) {
                return TDS.Promise.reject(e);
            }

            //  Create the transport instance and verify the connection.
            transporter = nodemailer.createTransport(smtpOpts);

            //  Use promise lib's promisify to wrap standard callbacks as
            //  promises so we can work with promises consistently. NOTE
            //  we have to bind() since promisify won't and we need internal
            //  'this' references to be correct.
            send = TDS.Promise.promisify(transporter.sendMail.bind(transporter));

            logger.trace(job, ' sending email via smtp');

            return send(mailOpts);
        };
    };

}(this));
