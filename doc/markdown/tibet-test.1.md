{{topic}}({{section}}) -- runs unit/functional tests on your application
=============================================

## SYNOPSIS

tibet test [<target>] [--suite <filter>] [--cases <filter>] [--karma] [--context <app|lib|all>]

## DESCRIPTION

Runs unit, functional, and/or integration tests on your application.

If the `--karma` flag is true, `tibet test` checks to see if the `karma-tibet`
testing module and `karma` have been installed in your project. If so the
command delegates to `karma start` to run your tests.

If `karma` isn't installed or the `--karma` flag is false (the default)
`phantomjs` is checked and tests will run in the context of `phantomjs` if
found.

In both cases (karma or phantom) you can specify a particular test target object
or test suite to run as the first argument to the command. If you need to
specify both a target and suite use `--target` and `--suite` respectively.

You can limit testing to a particular case or set of cases by using the
`--cases` parameter. Both `--suite` and `--cases` accept either a string or a
regular expression in JavaScript syntax such as `--cases /foo/i`.

For phantomjs testing output is to the terminal in colorized TAP format by
default. Future versions will support additional test output formatters.

You can use the built-in debugging facilities of PhantomJS by
specifying `--remote-debug-port` and a port number.

## OPTIONS

  * `target` :
    An optional target, usually a type name, to run tests on. Unlike other test
frameworks, TIBET's tests are typically associated with an object such as a
type. This lets you quickly test a type by simply specifying it as a `target`.

  * `--cases` :
    A specific case name or a /pattern/ to match to filter case names.

  * `--context` :
    Sets the context of the scan which is run. The default is `app`
which scans only application-level resources, ignoring any potential library
resources. Other values are `lib` and `all`.

  * `--karma` :
    Turns on/off the search for a `karma` binary and `karma.conf.js` file. Using
`--no-karma` will force TIBET's basic PhantomJS-driven test execution. The
default value is false.

  * `--suite` :
    A specific suite name or a /pattern/ to match to filter suite names.

## EXAMPLES

### Run default application tests via karma

Assuming you've followed the installation instructions for `karma-tibet` (https://github.com/TechnicalPursuit/karma-tibet) you can run your karma tests via `tibet test`:

    $ tibet test --karma

    30 06 2016 17:32:46.557:INFO [karma]: Karma v1.1.0 server started at http://0.0.0.0:9876/
    30 06 2016 17:32:46.560:INFO [launcher]: Launching browser Chrome with unlimited concurrency
    30 06 2016 17:32:46.567:INFO [launcher]: Starting browser Chrome
    30 06 2016 17:32:48.803:INFO [Chrome 51.0.2704 (Mac OS X 10.11.5)]: Connected on socket /#i8jwIIkTNAvAF27lAAAA with id 70331982
    Chrome 51.0.2704 (Mac OS X 10.11.5): Executed 3 of 3 SUCCESS (0.169 secs / 0 secs)

### Run default application tests via phantomjs

If you haven't installed `karma` but you do have `phantomjs` available you can
run tests via the `tibet test` command:

    $ tibet test

    # Loading TIBET via PhantomJS 2.1.1 at June 30, 2016 at 17:34:07 MDT
    # TIBET loaded in 2292 ms. Starting execution.
    # TIBET starting test run
    # 2 suite(s) found.
    1..3
    #
    # tibet test APP --suite 'APP suite'
    ok - Has a namespace.
    ok - Has an application type.
    # pass: 2 total, 2 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.
    #
    # tibet test APP.d2d.app --suite 'APP.d2d:app suite'
    ok - Is a templated tag.
    # pass: 1 total, 1 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.
    #
    # PASS: 3 total, 3 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.

    # Finished in 2385 ms w/TSH exec time of 93 ms.

NOTE that each test is prefixed with a comment of the form `# tibet test ..`
which allows you to run that specific test suite.

### Force default application tests via phantom in a karma-enabled project

    $ tibet test --no-karma

    # Loading TIBET via PhantomJS 2.1.1 at June 30, 2016 at 17:34:07 MDT
    # TIBET loaded in 2292 ms. Starting execution.
    # TIBET starting test run
    # 2 suite(s) found.
    1..3
    #
    # tibet test APP --suite 'APP suite'
    ok - Has a namespace.
    ok - Has an application type.
    # pass: 2 total, 2 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.
    #
    # tibet test APP.d2d.app --suite 'APP.d2d:app suite'
    ok - Is a templated tag.
    # pass: 1 total, 1 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.
    #
    # PASS: 3 total, 3 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.

    # Finished in 2385 ms w/TSH exec time of 93 ms.

### Run tests on a specific type

    $ tibet test --karma APP.hello.app

    overriding karma.script with: :test  -target='APP.hello.app'
    01 07 2016 13:56:55.444:INFO [karma]: Karma v1.1.0 server started at http://0.0.0.0:9876/
    01 07 2016 13:56:55.446:INFO [launcher]: Launching browser Chrome with unlimited concurrency
    01 07 2016 13:56:55.453:INFO [launcher]: Starting browser Chrome
    01 07 2016 13:56:56.838:INFO [Chrome 51.0.2704 (Mac OS X 10.11.5)]: Connected on socket /#CuLMZuXGzQV1Z_rjAAAA with id 78791384
    Chrome 51.0.2704 (Mac OS X 10.11.5): Executed 1 of 1 SUCCESS (0.131 secs / 0 secs)

### Run a specific test suite

    $ tibet test --suite 'APP suite' --no-karma

    # Loading TIBET via PhantomJS 2.1.1 at July 1, 2016 at 13:58:25 MDT
    # TIBET loaded in 2739 ms. Starting execution.
    # TIBET starting test run
    # 1 suite(s) found.
    1..2
    #
    # tibet test APP --suite='APP suite'
    ok - Has a namespace.
    ok - Has an application type.
    # pass: 2 total, 2 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.
    #
    # PASS: 2 total, 2 pass, 0 fail, 0 error, 0 skip, 0 todo, 0 only.

    # Finished in 2819 ms w/TSH exec time of 80 ms.

