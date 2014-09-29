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
//  TP.html.abbr
//  ========================================================================

/**
 * @type {TP.html.abbr}
 * @synopsis 'abbr' tag. Abbreviation.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('abbr');

//  ========================================================================
//  TP.html.acronym
//  ========================================================================

/**
 * @type {TP.html.acronym}
 * @synopsis 'acronym' tag. Acronym.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('acronym');

//  ========================================================================
//  TP.html.address
//  ========================================================================

/**
 * @type {TP.html.address}
 * @synopsis 'address' tag. Address information.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('address');

//  ========================================================================
//  TP.html.blockquote
//  ========================================================================

/**
 * @type {TP.html.blockquote}
 * @synopsis 'blockquote' tag. Inline quotation.
 */

//  ------------------------------------------------------------------------

TP.html.Citation.defineSubtype('blockquote');

TP.html.blockquote.set('uriAttrs', TP.ac('cite'));

//  ========================================================================
//  TP.html.br
//  ========================================================================

/**
 * @type {TP.html.br}
 * @synopsis 'br' tag. Paragraph break.
 */

//  ------------------------------------------------------------------------

TP.html.CoreAttrs.defineSubtype('br');

TP.html.br.addTraitsFrom(TP.core.EmptyElementNode);
TP.html.br.Inst.resolveTraits(
        TP.ac('getContent', 'setContent'),
        TP.core.EmptyElementNode);

//  Resolve the traits right away as type methods of this type are called during
//  content processing when we only have type methods involved.
TP.html.br.executeTraitResolution();

//  ========================================================================
//  TP.html.cite
//  ========================================================================

/**
 * @type {TP.html.cite}
 * @synopsis 'cite' tag. Citation.
 */

//  ------------------------------------------------------------------------

TP.html.Citation.defineSubtype('cite');

//  ========================================================================
//  TP.html.code
//  ========================================================================

/**
 * @type {TP.html.code}
 * @synopsis 'code' tag. Program code.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('code');

//  ========================================================================
//  TP.html.dfn
//  ========================================================================

/**
 * @type {TP.html.dfn}
 * @synopsis 'dfn' tag. Definition.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('dfn');

//  ========================================================================
//  TP.html.div
//  ========================================================================

/**
 * @type {TP.html.div}
 * @synopsis DIV tag. Generic block container.
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('div');

//  ========================================================================
//  TP.html.em
//  ========================================================================

/**
 * @type {TP.html.em}
 * @synopsis 'em' tag. Emphasis.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('em');

//  ========================================================================
//  TP.html.h1
//  ========================================================================

/**
 * @type {TP.html.h1}
 * @synopsis 'h1' tag. Heading.
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('h1');

//  ========================================================================
//  TP.html.h2
//  ========================================================================

/**
 * @type {TP.html.h2}
 * @synopsis 'h2' tag. Sub-heading.
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('h2');

//  ========================================================================
//  TP.html.h3
//  ========================================================================

/**
 * @type {TP.html.h3}
 * @synopsis 'h3' tag. Sub-sub-heading.
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('h3');

//  ========================================================================
//  TP.html.h4
//  ========================================================================

/**
 * @type {TP.html.h4}
 * @synopsis 'h4' tag. Sub-sub-sub-heading.
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('h4');

//  ========================================================================
//  TP.html.h5
//  ========================================================================

/**
 * @type {TP.html.h5}
 * @synopsis 'h5' tag. Sub-sub-sub-sub-heading. Are we there yet?
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('h5');

//  ========================================================================
//  TP.html.h6
//  ========================================================================

/**
 * @type {TP.html.h6}
 * @synopsis 'h6' tag. You get the picture ;).
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('h6');

//  ========================================================================
//  TP.html.kbd
//  ========================================================================

/**
 * @type {TP.html.kbd}
 * @synopsis 'kbd' tag. Example keyboard input.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('kbd');

//  ========================================================================
//  TP.html.mark (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.mark}
 * @synopsis 'mark' tag. A run of text highlighted for reference purposes.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('mark');

//  ========================================================================
//  TP.html.p
//  ========================================================================

/**
 * @type {TP.html.p}
 * @synopsis 'p' tag. Paragraph.
 */

//  ------------------------------------------------------------------------

TP.html.Aligned.defineSubtype('p');

//  ========================================================================
//  TP.html.pre
//  ========================================================================

/**
 * @type {TP.html.pre}
 * @synopsis 'pre' tag. Preserve formatting.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('pre');

//  ========================================================================
//  TP.html.q
//  ========================================================================

/**
 * @type {TP.html.q}
 * @synopsis 'q' tag. Inline quotation.
 */

//  ------------------------------------------------------------------------

TP.html.Citation.defineSubtype('q');

TP.html.q.set('uriAttrs', TP.ac('cite'));

//  ========================================================================
//  TP.html.ruby (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.ruby}
 * @synopsis 'ruby' tag. Mark up 'Ruby text' annotations.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('ruby');

//  ========================================================================
//  TP.html.rp (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.rp}
 * @synopsis 'rp' tag. Mark up 'Ruby text' annotations.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('rp');

//  ========================================================================
//  TP.html.rt (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.rt}
 * @synopsis 'rt' tag. Mark up 'Ruby text' annotations.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('rt');

//  ========================================================================
//  TP.html.samp
//  ========================================================================

/**
 * @type {TP.html.samp}
 * @synopsis 'samp' tag. Sample.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('samp');

//  ========================================================================
//  TP.html.span
//  ========================================================================

/**
 * @type {TP.html.span}
 * @synopsis 'span' tag. Generic inline container.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('span');

//  ========================================================================
//  TP.html.strong
//  ========================================================================

/**
 * @type {TP.html.strong}
 * @synopsis 'strong' tag. Strong emphasis.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('strong');

//  ========================================================================
//  TP.html.var
//  ========================================================================

/**
 * @type {TP.html.var}
 * @synopsis 'var' tag. Variable.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('var');

//  ========================================================================
//  TP.html.wbr (HTML 5)
//  ========================================================================

/**
 * @type {TP.html.wbr}
 * @synopsis 'wbr' tag. Line break opportunity.
 */

//  ------------------------------------------------------------------------

TP.html.Attrs.defineSubtype('wbr');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
