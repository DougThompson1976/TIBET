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
//  TP.svg.svg
//  ========================================================================

/**
 * @type {TP.svg.svg}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:svg');

TP.svg.svg.addTraits(TP.svg.Element);

TP.svg.svg.Type.set('uriAttrs', TP.ac('clip-path', 'cursor', 'filter', 'mask'));

//  ========================================================================
//  TP.svg.g
//  ========================================================================

/**
 * @type {TP.svg.g}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:g');

TP.svg.g.addTraits(TP.svg.Element);

TP.svg.g.Type.set('uriAttrs', TP.ac('clip-path', 'cursor', 'filter', 'mask'));

//  ========================================================================
//  TP.svg.defs
//  ========================================================================

/**
 * @type {TP.svg.defs}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:defs');

TP.svg.defs.addTraits(TP.svg.Element);

TP.svg.defs.Type.set('uriAttrs', TP.ac('clip-path', 'cursor', 'filter', 'mask'));

//  ========================================================================
//  TP.svg.desc
//  ========================================================================

/**
 * @type {TP.svg.desc}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:desc');

TP.svg.desc.addTraits(TP.svg.Element);

//  ========================================================================
//  TP.svg.title
//  ========================================================================

/**
 * @type {TP.svg.title}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:title');

TP.svg.title.addTraits(TP.svg.Element);

//  ========================================================================
//  TP.svg.metadata
//  ========================================================================

/**
 * @type {TP.svg.metadata}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:metadata');

TP.svg.metadata.addTraits(TP.svg.Element);

//  ========================================================================
//  TP.svg.symbol
//  ========================================================================

/**
 * @type {TP.svg.symbol}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:symbol');

TP.svg.symbol.addTraits(TP.svg.Element);

TP.svg.symbol.Type.set('uriAttrs', TP.ac('clip-path', 'cursor', 'filter', 'mask'));

//  ========================================================================
//  TP.svg.use
//  ========================================================================

/**
 * @type {TP.svg.use}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('svg:use');

TP.svg.use.addTraits(TP.svg.Element);

TP.svg.use.Type.set('uriAttrs', TP.ac('clip-path', 'cursor', 'filter', 'mask'));

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
