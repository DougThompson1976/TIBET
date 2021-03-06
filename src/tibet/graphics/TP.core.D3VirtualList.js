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
 * @type {TP.core.D3VirtualList}
 * @summary A subtype of the TP.core.D3Tag trait type that is used to add
 *     'virtual scrolling behavior to any type that implements a scrolling list.
 * @description This code is a heavily adapted version of the d3.js virtual
 *     scrolling routine found here:
 *          http://www.billdwhite.com/wordpress/2014/05/17/d3-scalability-virtual-scrolling-for-large-visualizations/
 *      It has been adapted to not be specific to SVG and to conform to TIBET
 *      linting conventions.
 */

//  ------------------------------------------------------------------------

TP.core.D3Tag.defineSubtype('D3VirtualList');

//  This type is intended to be used as a trait type only, so we don't allow
//  instance creation
TP.core.D3VirtualList.isAbstract(true);

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineAttribute('$virtualScroller');

TP.core.D3VirtualList.Inst.defineAttribute('$startOffset');
TP.core.D3VirtualList.Inst.defineAttribute('$endOffset');
TP.core.D3VirtualList.Inst.defineAttribute('$totalRows');
TP.core.D3VirtualList.Inst.defineAttribute('$dataSize');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception
        return;
    }

    tpElem = TP.wrap(elem);

    //  Perform set up for instances of this type.
    tpElem.setup();

    return;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('adjustIterationIndex',
function(anIndex) {

    /**
     * @method adjustIterationIndex
     * @summary Adjusts any iteration index that we use when building or
     *     updating templated content.
     * @param {Number} The initial index as supplied by d3.
     * @returns {Number} The adjusted index.
     */

    //  At this level, this method returns the number it was handed plus the
    //  current start offset that it is tracking.
    return anIndex + this.$get('$startOffset');
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('computeHeight',
function() {

    /**
     * @method computeHeight
     * @summary Computes the receiver's height based on a variety of factors,
     *     including direct 'height' value, min/max height settings or a fixed
     *     'size' attribute on the receiver.
     * @returns {Number} The height of the receiver when rendered.
     */

    var rowHeight,
        fixedSize,

        currentHeight,

        styleObj,

        minHeight,
        maxHeight;

    //  NOTE: In this method, we follow the HTML5 semantics of allowing the CSS
    //  to 'override' whatever setting was given in the 'size' attribute.

    //  Get the current, computed height
    currentHeight = this.getHeight();

    //  If we have a direct 'height' value set on the '.style' property, then
    //  that overrides everything - return it.

    //  NB: Note here how we go after the *local* style object, *not* the
    //  computed style object.
    styleObj = TP.elementGetStyleObj(this.getNativeNode());
    if (TP.notEmpty(styleObj.height)) {
        return currentHeight;
    }

    //  If we have a 'maximum height' in our computed style then return the
    //  maximum height.
    maxHeight = this.getComputedStyleProperty('max-height', true);
    if (TP.isNumber(maxHeight) && maxHeight > 0) {
        return maxHeight;
    }

    //  If we have a 'minimum height' in our computed style and the current
    //  height is less than (shouldn't be, according to CSS) or equal to that,
    //  then return the minium height.
    minHeight = this.getComputedStyleProperty('min-height', true);
    if (TP.isNumber(minHeight) && minHeight > 0 &&
        currentHeight <= minHeight) {
        return minHeight;
    }

    rowHeight = this.getRowHeight();

    //  See if a fixed size is available
    fixedSize = this.getAttribute('size');
    fixedSize = fixedSize.asNumber();

    if (TP.isNumber(fixedSize)) {
        fixedSize = fixedSize * rowHeight;
    } else {
        fixedSize = 0;
    }

    //  If we have a fixed size due to a 'size' attribute, and the current
    //  height is less than that, then return that.
    if (fixedSize !== 0 && currentHeight < fixedSize) {
        return fixedSize;
    }

    //  If the current height is less than the row height, then return that.
    if (currentHeight < rowHeight) {
        return rowHeight;
    }

    return currentHeight;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('computeGeneratedRowCount',
function() {

    /**
     * @method computeGeneratedRowCount
     * @summary Returns the number of rows that the receiver has actually
     *     generated to display its data.
     * @returns {Number} The number of actual row elements that the receiver
     *     generated.
     */

    var viewportHeight,
        rowHeight,

        computedRowCount,

        borderSize;

    viewportHeight = this.computeHeight();

    //  The current row height.
    rowHeight = this.getRowHeight();

    //  Viewport height less than row height. Default to 1 row.
    if (viewportHeight < rowHeight) {
        computedRowCount = 1;
    } else {

        computedRowCount = (viewportHeight / rowHeight).round();

        //  Grab the border size
        borderSize = this.getRowBorderHeight();

        //  If the viewport, minus the border height, doesn't fall on an even
        //  boundary, then increment the count by 1, so that we get an overlap
        //  to avoid 'blank' spaces.
        if ((viewportHeight - borderSize) % rowHeight !== 0) {
            computedRowCount += 1;
        }
    }

    return computedRowCount;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getRowAttrSelectionInfo',
function() {

    /**
     * @method getRowAttrSelectionInfo
     * @summary Returns an Array that contains an attribute name and attribute
     *     value that will be used to 'select' all of the rows of the receiver.
     *     Therefore, the receiver needs to stamp this attribute and value on
     *     each row in its drawing machinery methods.
     * @returns {Array} A pair containing the attribute name and value.
     */

    return TP.ac('class', 'row');
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getRowHeight',
function() {

    /**
     * @method getRowHeight
     * @summary Returns the height of each element of the row. This should
     *     correspond to the 'offsetHeight' of each row when the list is
     *     rendered.
     * @returns {Number} The height of a row when rendered.
     */

    //  The target type really needs to override this, so we return 0 here.
    return 0;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getRowBorderHeight',
function() {

    /**
     * @method getRowBorderHeight
     * @summary Returns the height of the bottom and top borders together.
     * @returns {Number} The height of a row bottom and top borders.
     */

    //  The target type really needs to override this, so we return 0 here.
    return 0;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getPageSize',
function() {

    /**
     * @method getPageSize
     * @summary Returns the visual 'page size' in terms of number of rows.
     * @returns {Number} The page size in rows.
     */

    var rowHeight,

        displayedRowCount;

    rowHeight = this.getRowHeight();

    //  And the number of rows we're currently displaying is our overall element
    //  divided by our row height.
    displayedRowCount = (this.getHeight() / rowHeight).floor();

    return displayedRowCount;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getScrollingContainer',
function() {

    /**
     * @method getScrollingContainer
     * @summary Returns the Element that will be used as the 'scrolling
     *     container'. This is the element that will be the container of the
     *     list of items and will be translated to perform scrolling
     * @returns {Element} The element to use as the scrolling container.
     */

    return this.getNativeNode();
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getStartIndex',
function() {

    /**
     * @method getStartIndex
     * @summary Returns the 'start index'. That is, the number of the first
     *     generated row (which, because of how scrolling overlap works, might
     *     or might not be the actual first visible row, but we can still use
     *     this to do next/previous focusing calculations).
     * @returns {Number} The start index.
     */

    var elem,
        rowHeight,

        startIndex;

    elem = this.getNativeNode();

    rowHeight = this.getRowHeight();

    //  The current starting row is whatever our current scrollTop setting is
    //  divided by our row height. Note here how we 'ceil()' the value to get
    //  the maximum. This is important for our calculations.
    startIndex = (elem.scrollTop / rowHeight).ceil();

    return startIndex;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('getStartAndEndVisualRows',
function() {

    /**
     * @method getStartAndEndVisualRows
     * @summary Returns the elements that represent the actual *visible* first
     *     and last rows.
     * @returns {TP.core.UIElementNode[]} An Array pair where the first item is
     *     the first *visual* element and the last item is the last *visual*
     *     element.
     */

    var items,

        data,
        lastDataIndex,

        pageSize,

        firstVisualItem,
        lastVisualItem,

        lastVisualElem,
        rect,
        lastIsClipped;

    //  Grab all of the *visual* elements under the selection container. Note
    //  that this may contain a hidden element at the top or bottom, which we
    //  specifically computed for earlier when computing the generated row
    //  count, so that empty partial blank space won't show.
    items = TP.wrap(this.getSelectionContainer()).getChildElements();

    //  Grab our selection data and the last index that it contains.
    data = this.computeSelectionData();
    lastDataIndex = data.getSize() - 1;

    pageSize = this.getPageSize();

    //  If the last index is less than or equal to our page size, then we're not
    //  any larger than a page and the measurements will be exact. Simply return
    //  the first and last item.
    if (lastDataIndex <= pageSize) {
        firstVisualItem = items.at(0);
        lastVisualItem = items.at(pageSize - 1);
    } else {

        //  Otherwise, grab the native Element of the last item.
        lastVisualElem = items.last().getNativeNode();

        //  Grab it's bounding rectangle.
        rect = lastVisualElem.getBoundingClientRect();

        //  If it's height - top is greater than the receiver's overall height,
        //  then it's the last item that's 'clipped and hidden'.
        /* eslint-disable no-extra-parens */
        lastIsClipped = (rect.top - rect.height) > this.getHeight();
        /* eslint-enable no-extra-parens */

        //  Compute the proper first & last items, depending on whether it's the
        //  last item that's being clipped and hidden or not.
        if (lastIsClipped) {
            firstVisualItem = items.at(0);
            lastVisualItem = items.at(pageSize - 1);
        } else {
            firstVisualItem = items.at(1);
            lastVisualItem = items.at(pageSize);
        }
    }

    return TP.ac(firstVisualItem, lastVisualItem);
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('isReadyToRender',
function() {

    /**
     * @method isReadyToRender
     * @summary Whether or not the receiver is 'ready to render'. Normally, this
     *     means that all of the resources that the receiver relies on to render
     *     have been loaded.
     * @returns {Boolean} Whether or not the receiver is ready to render.
     */

    return true;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('render',
function() {

    /**
     * @method render
     * @summary Renders the receiver.
     * @returns {TP.core.D3VirtualList} The receiver.
     */

    var selectionData,

        rowHeight,
        totalRows,

        virtualScroller;

    //  If we're not ready to render, then don't. Another process will have to
    //  re-trigger the rendering process.

    //  Note that the 'shouldRender' check is a strict check for the value of
    //  'false' (the Boolean value of false). This can't just be a 'falsey'
    //  value.
    if (!this.isReadyToRender() || TP.isFalse(this.get('shouldRender'))) {
        return this;
    }

    //  Select all of the elements in the root selector container
    this.d3SelectContainer();

    //  If the data is not valid, then empty the root selection (keeping the
    //  root itself intact for future updates).
    if (TP.notValid(this.get('data'))) {

        this.get('containerSelection').selectAll('*').remove();

        return this;
    }

    //  The d3 selection data.
    selectionData = this.computeSelectionData();

    //  The number of total rows of data.
    totalRows = selectionData.getSize();

    //  The current row height.
    rowHeight = this.getRowHeight();

    //  Grab the virtual scroller object.
    virtualScroller = this.get('$virtualScroller');

    //  Reset the dynamic properties of the virtual scroller object. The static
    //  properties of this object were set up when it was allocated &
    //  initialized.
    virtualScroller.
        rowHeight(rowHeight).
        totalRows(totalRows).
        data(selectionData, this.getKeyFunction());

    //  Call it's render() to redraw. This is the same method that the virtual
    //  scroller object itself will call when we scroll and provides the
    //  'infinite scroll' capability.
    virtualScroller.render(true);

    //  Signal to observers that this control has rendered.
    this.signal('TP.sig.DidRender');

    return this;
});

//  ------------------------------------------------------------------------

TP.core.D3VirtualList.Inst.defineMethod('setup',
function() {

    /**
     * @method setup
     * @summary Perform the initial setup for the receiver.
     * @returns {TP.core.D3VirtualList} The receiver.
     */

    var scrollingContent,
        scrollerElem,
        viewportElem,

        attrSelectionInfo,

        virtualScroller;

    //  The content that will actually be scrolled.
    scrollingContent = this.getSelectionContainer();

    //  The element that will perform the scrolling.
    scrollerElem = this.getScrollingContainer();

    //  The element that forms the outer viewport
    viewportElem = this.getNativeNode();

    //  Row 'selection' criteria - an Array with the name of the attribute as
    //  the first value and the value of the attribute as the second value.
    attrSelectionInfo = this.getRowAttrSelectionInfo();

    //  Allocate and initialize a virtual scroller with a variety of information
    //  about the receiver, including bound versions of the d3 enter/update/exit
    //  functions, the elements acting as our scroller and viewport, etc.
    virtualScroller = TP.extern.d3.VirtualScroller();
    virtualScroller.
        enter(this.d3Enter.bind(this)).
        update(this.d3Update.bind(this)).
        exit(this.d3Exit.bind(this)).
        scroller(TP.extern.d3.select(scrollerElem)).
        viewport(TP.extern.d3.select(viewportElem)).
        target(viewportElem).
        selectionInfo(attrSelectionInfo).
        control(this);

    //  Call the virtual scroller method to set up the scrolling event listener.
    TP.extern.d3.select(scrollingContent).call(virtualScroller);

    //  Cache the virtual scroller object for use during render.
    this.set('$virtualScroller', virtualScroller);

    return this;
});

//  ------------------------------------------------------------------------

TP.extern.d3.VirtualScroller = function() {

    var enter,
        update,
        exit,
        allData,
        dataid,
        scroller,
        viewport,
        totalRows,
        position,
        rowHeight,
        totalHeight,
        minHeight,
        computedRowCount,
        target,
        selectionInfo,
        delta,
        dispatch,
        control,

        scrollerFunc,

        isScrolling,
        forceUpdate;

    enter = null;
    update = null;
    exit = null;
    allData = TP.ac();
    dataid = null;
    scroller = null;
    viewport = null;
    totalRows = 0;
    position = 0;
    rowHeight = 0;
    totalHeight = 0;
    minHeight = 0;
    computedRowCount = 0;
    target = null;
    selectionInfo = null;
    delta = 0;
    control = null;
    dispatch = TP.extern.d3.dispatch('pageDown', 'pageUp');
    isScrolling = false;
    forceUpdate = false;

    scrollerFunc = function(container) {

        var render,
            scrollRenderFrame;

        render = function(force) {

            var scrollTop,
                lastPosition;

            computedRowCount = control.computeGeneratedRowCount();

            scrollTop = viewport.node().scrollTop;

            /* eslint-disable no-extra-parens */
            totalHeight = Math.max(minHeight, (totalRows * rowHeight));
            /* eslint-enable no-extra-parens */

            //  both style and attr height values seem to be respected
            scroller.style('height', totalHeight + 'px');

            lastPosition = position;
            position = Math.floor(scrollTop / rowHeight);
            delta = position - lastPosition;

            forceUpdate = force;

            scrollRenderFrame(position);
        };

        control.$internalRender = render;

        scrollRenderFrame = function(scrollPosition) {

            var startOffset,
                endOffset,
                dataSize,

                oldStartOffset,
                oldEndOffset,
                oldTotalRows,
                oldDataSize,

                rowSelector;

            //  calculate positioning (use + 1 to offset 0 position vs
            //  totalRow count diff)
            startOffset = Math.max(
                    0,
                    Math.min(scrollPosition, totalRows - computedRowCount + 1));
            endOffset = startOffset + computedRowCount;
            dataSize = allData.getSize();

            oldStartOffset = control.$get('$startOffset');
            oldEndOffset = control.$get('$endOffset');
            oldTotalRows = control.$get('$totalRows');
            oldDataSize = control.$get('$dataSize');

            if (oldStartOffset === startOffset &&
                oldEndOffset === endOffset &&
                oldTotalRows === totalRows &&
                oldDataSize === dataSize) {

                if (!isScrolling && !forceUpdate) {
                    return;
                }

                container.each(
                    function() {
                        var rowUpdateSelection,
                            newData;

                        //  do not update .transitioning elements
                        rowUpdateSelection =
                            container.selectAll('.row:not(.transitioning)');

                        //  compute the new data slice
                        newData = allData.slice(
                                    startOffset,
                                    Math.min(endOffset, totalRows));

                        //  Just update the individual datums for each row
                        rowUpdateSelection.each(
                            function(oldData, index) {
                                TP.extern.d3.select(this).datum(newData[index]);
                            });

                        rowUpdateSelection.call(update);
                    });
            } else {

                /* eslint-disable no-extra-parens */
                container.style(
                        'transform',
                        'translate(0px, ' + (scrollPosition * rowHeight) + 'px)');
                /* eslint-enable no-extra-parens */

                control.$set('$startOffset', startOffset, false);
                control.$set('$endOffset', endOffset, false);
                control.$set('$totalRows', totalRows, false);
                control.$set('$dataSize', allData.getSize(), false);

                //  build a selector that will be used to 'select' rows.
                rowSelector = '*[' + selectionInfo.first() +
                                '~=' +
                                '"' + selectionInfo.last() + '"' +
                                ']';

                //  slice out visible rows from data and display
                container.each(
                    function() {
                        var newData,

                            rowSelection,
                            rowUpdateSelection;

                        //  compute the new data slice
                        newData = allData.slice(
                                    startOffset,
                                    Math.min(endOffset, totalRows));

                        rowSelection = container.selectAll(rowSelector).
                                        data(newData, dataid);

                        rowSelection.exit().call(exit).remove();

                        rowSelection.enter().call(enter);
                        rowSelection.order();

                        //  do not update or position .transitioning elements
                        rowUpdateSelection =
                            container.selectAll('.row:not(.transitioning)');

                        rowUpdateSelection.call(update);

                        rowUpdateSelection.each(
                            function(d, i) {
                                TP.extern.d3.select(this).style(
                                        'transform',
                                        function() {
                                            /* eslint-disable no-extra-parens */
                                            return 'translate(0px,' +
                                                    (i * rowHeight) + 'px)';
                                            /* eslint-enable no-extra-parens */
                                        });
                            });
                    });
            }

            //  dispatch events
            /* eslint-disable no-extra-parens */
            if (endOffset > (allData.length - computedRowCount)) {
            /* eslint-enable no-extra-parens */
                dispatch.pageDown({
                    delta: delta
                });
            } else if (startOffset < computedRowCount) {
                dispatch.pageUp({
                    delta: delta
                });
            }
        };

        //  make render function publicly visible
        scrollerFunc.render = render;

        //  call render on scrolling event
        viewport.on('scroll.scrollerFunc',
                    function() {
                        isScrolling = true;
                        render();
                        isScrolling = false;
                    }, true);
    };

    scrollerFunc.control = function(_) {

        if (!arguments.length) {
            return control;
        }

        control = _;

        return scrollerFunc;
    };

    scrollerFunc.data = function(_, __) {

        if (!arguments.length) {
            return allData;
        }

        allData = _;
        dataid = __;

        return scrollerFunc;
    };

    scrollerFunc.dataid = function(_) {

        if (!arguments.length) {
            return dataid;
        }

        dataid = _;

        return scrollerFunc;
    };

    scrollerFunc.enter = function(_) {

        if (!arguments.length) {
            return enter;
        }

        enter = _;

        return scrollerFunc;
    };

    scrollerFunc.update = function(_) {

        if (!arguments.length) {
            return update;
        }

        update = _;

        return scrollerFunc;
    };

    scrollerFunc.exit = function(_) {

        if (!arguments.length) {
            return exit;
        }

        exit = _;

        return scrollerFunc;
    };

    scrollerFunc.totalRows = function(_) {

        if (!arguments.length) {
            return totalRows;
        }

        totalRows = _;

        return scrollerFunc;
    };

    scrollerFunc.rowHeight = function(_) {

        if (!arguments.length) {
            return rowHeight;
        }

        rowHeight = Number(_);

        return scrollerFunc;
    };

    scrollerFunc.totalHeight = function(_) {

        if (!arguments.length) {
            return totalHeight;
        }

        totalHeight = Number(_);

        return scrollerFunc;
    };

    scrollerFunc.minHeight = function(_) {

        if (!arguments.length) {
            return minHeight;
        }

        minHeight = Number(_);

        return scrollerFunc;
    };

    scrollerFunc.position = function(_) {

        if (!arguments.length) {
            return position;
        }

        position = Number(_);
        if (viewport) {
            viewport.node().scrollTop = position;
        }

        return scrollerFunc;
    };

    scrollerFunc.scroller = function(_) {

        if (!arguments.length) {
            return scroller;
        }

        scroller = _;

        return scrollerFunc;
    };

    scrollerFunc.viewport = function(_) {

        if (!arguments.length) {
            return viewport;
        }

        viewport = _;

        return scrollerFunc;
    };

    scrollerFunc.target = function(_) {

        if (!arguments.length) {
            return target;
        }

        target = _;

        return scrollerFunc;
    };

    scrollerFunc.selectionInfo = function(_) {

        if (!arguments.length) {
            return selectionInfo;
        }

        selectionInfo = _;

        return scrollerFunc;
    };

    scrollerFunc.delta = function() {
        return delta;
    };

    TP.extern.d3.rebind(scrollerFunc, dispatch, 'on');

    return scrollerFunc;
};

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
