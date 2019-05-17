//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

//noinspection JSUnusedGlobalSymbols,JSUnusedLocalSymbols
var scriptLoaded = true,
    stubbornNodes = [],
    modifiedNodes2 = [],
    divsSnapshot = [],
    commPortName,
	options,
    sbStyle,
    hiddenAttributeFlagName = "__fireshotHiddenElement",
    initialAttributeFlagName = "__fireshotInitialElement";

if (chrome.runtime.sendMessage)
    chrome.runtime.sendMessage({message: "getPortName"}, function(response) {
        commPortName = response.portName;
        getConsolePtr()("Obtained port name: " + commPortName);
});

function getOptionFromScript(optionName, defaultValue) {
    return options[optionName] || defaultValue;
}

function enableSomeElements(enable)
{
	if (typeof enable === "undefined") 
		enable = true;
	
	var elem;
	if (window.location.href.match(/https?:\/\/mail\.google\.com/i))
	{
		//noinspection JSUnresolvedVariable
		var itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false);

		var currentNode;
		while ((currentNode = itr.nextNode()))
			if (currentNode.nodeName == "TD" && currentNode.getAttribute("class") && currentNode.getAttribute("class").match(/Bu y3/i))
			{
				//alert(currentNode.nodeName);
				currentNode.style.setProperty("display", enable ? "" : "none", "important");
			}

		if ((elem = document.getElementById(':ro')))
			elem.style.setProperty("display", enable ? "" : "none", "important");
		if ((elem = document.getElementById(':5')))
			elem.style.setProperty("display", enable ? "" : "none", "important");
	}
	
	/*else if (window.location.href.match(/https?:\/\/www\.(facebook|fb)\.com/i)
		&& (elem = document.getElementById("rightCol")))
	{
		elem.style.setProperty("display", enable ? "" : "none", "important");
	}*/
}

function hideObtrusiveElements(root, horzMoving)
{
    function isElementHidden(elem) {
        var p = elem;

        while (p && p != document) {

            var style = document.defaultView.getComputedStyle(p, "");

            if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0")
                return true;
            p = p.parentNode;
        }

        return false;
    }

    var newDivs = [],
        rootRect = root.getBoundingClientRect(),
        sqr1 = window.innerWidth * window.innerHeight + 1,
        sqr2 = rootRect.width * rootRect.height + 1,
        itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false),
        fDivElement = root !== getScrollingElement(),
        elem;

    while ((elem = itr.nextNode()) !== null)
    {
        if (elem.getAttribute(hiddenAttributeFlagName) === "1") continue;

        var rect = elem.getBoundingClientRect();

        if (elem.scrollWidth > window.innerWidth * 0.9 && elem.scrollHeight > window.innerHeight * 0.9 && 
                elem.clientWidth > rootRect.width * 0.33 && elem.clientHeight > rootRect.height * 0.33) continue;

        if (rect.width * rect.height === 0 || rect.width * rect.height / sqr1 > 0.35) continue;

        var rec = {div: elem, x: rect.left, y: rect.top};
        newDivs.push(rec);

    //&& (!currentLevelDiv || !isChildOf(currentLevelDiv, elem))

        for(var k = 0; k < divsSnapshot.length; ++k) {
            if (divsSnapshot[k].div === elem) {
                if (((!horzMoving && divsSnapshot[k].y === rect.top) || (horzMoving && divsSnapshot[k].x === rect.left)) && !elementInHiddenList(elem)) {

                    // Режим divCapture, не прячем элементы, которые являются родителями.
                    if (elem === root || (fDivElement && isChildOf(elem, root))) continue;

                    // Элемент внутри скроллируемого объекта не проходит по требованиям площади.
                    if (fDivElement && isChildOf(root, elem) && rect.width * rect.height / sqr2 > 0.35) continue;

                    // Больше не обрабатываем детей скрытого элемента
                    if (isElementHidden(elem))
                        elem.setAttribute(hiddenAttributeFlagName, "1");
                    else
                        hideElement(elem);

                }
                break;
            }
        }
    }

    divsSnapshot = newDivs;

}

function elementInHiddenList(elem)
{
    for (var i = 0; i < stubbornNodes.length; ++i)
        if (stubbornNodes[i].elem === elem) return true;

    return false;
}

function hideElement(elem) {
    getConsolePtr()("Hiding:");
    getConsolePtr()(elem);
    var style = document.defaultView.getComputedStyle(elem, "");

    stubbornNodes.push({elem: elem, opacity: style.getPropertyValue("opacity"), animation: style.getPropertyValue("animation")});
    elem.style.setProperty("opacity", "0");
    elem.style.setProperty("animation", "unset");
    elem.setAttribute(hiddenAttributeFlagName, "1");
}

function hideStubbornElements(root, horzMoving)
{
    //var clientWidth = window.document.compatMode == "CSS1Compat" ? window.document.documentElement.clientWidth : window.document.body.clientWidth,
    //    clientHeight = window.document.compatMode == "CSS1Compat" ? window.document.documentElement.clientHeight : window.document.body.clientHeight;
    var
        rootRect = root ? root.getBoundingClientRect() : undefined,
        rootWidth = rootRect ? rootRect.width : window.innerWidth,
        rootHeight = rootRect ? rootRect.height : window.innerHeight;
    
    horzMoving = horzMoving || false;
    //noinspection JSUnresolvedVariable
	var itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false), current;
	while ((current = itr.nextNode()))
	{
		var style = document.defaultView.getComputedStyle(current, "");
		if (style && (style.getPropertyValue("position") == "fixed" || style.getPropertyValue("position") == "sticky")  && !elementInHiddenList(current) && style.getPropertyValue("display") != "none")
		{
			if (root && isChildOf(current, root)) continue;
            if (horzMoving && current.scrollWidth > window.innerWidth) continue;
            if (current.scrollWidth > window.innerWidth * 0.9 && current.scrollHeight > window.innerHeight * 0.9 &&
                current.clientWidth > rootWidth * 0.33 && current.clientHeight > rootHeight * 0.33) continue;

            getConsolePtr()("Found stubborn element " + current.id);
            hideElement(current);
		}
	}
	
	for (var i = 0; i < stubbornNodes.length; ++i)
		//stubbornNodes[i].elem.style.setProperty("display", "none");
		stubbornNodes[i].elem.style.setProperty("opacity", "0");
}

function showHiddenElements()
{
	for (var i = 0; i < stubbornNodes.length; ++i) {
        stubbornNodes[i].elem.style.setProperty("opacity", stubbornNodes[i].opacity);
        stubbornNodes[i].elem.style.setProperty("animation", stubbornNodes[i].animation);
    }
}

function removeCustomAttributes() {
    var itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false), current;
    while ((current = itr.nextNode())) {
        current.removeAttribute(hiddenAttributeFlagName);
        current.removeAttribute(initialAttributeFlagName);
    }
}

function createInitialElementsSnapshot() {
    var itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false), current;
    while ((current = itr.nextNode())) {
        current.setAttribute(hiddenAttributeFlagName, "1");
    }
}

function hideNewElements() {
    var itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false), current;
    while ((current = itr.nextNode())) {
        if (current.getAttribute(hiddenAttributeFlagName) !== "1")
            hideElement(current);
    }
}

function FBAdapter() {
    var absNodes = [];

    function gatherAbsoluteElements() {
        absNodes = Array.prototype.slice.call(
            document.querySelectorAll('DIV')
        ).map(function(element) {
            return {
                element: element,
                top: element.style.top
            };
        }).filter(function(item) {
            return item.element.style.position == "absolute";
        });
    }

    gatherAbsoluteElements();

    return {
        undoSwitchingToFixedPositions : function() {
            absNodes.forEach(function(item) {
                if (item.element.style.position == "fixed") {
                    //console.log(item.element);
                    item.element.style.position = "absolute";
                    item.element.style.top = item.top;
                }
            });
        }
    };
}

function getAltExtents()
{
	var doc = window.document;
	var root = doc.documentElement;
	var canvas_width = root.clientWidth ? root.clientWidth : window.innerWidth;
	var canvas_height = -1;

	if (canvas_height < 0)
		canvas_height = window.innerHeight - getSBHeight(window);

	if (doc.body)
	{
		var altWidth = doc.compatMode == "CSS1Compat" ? doc.documentElement.scrollWidth : doc.body.scrollWidth;

		var altHeight = doc.documentElement.scrollHeight;

		var frameWidth = doc.compatMode == "CSS1Compat" ? doc.documentElement.clientWidth : doc.body.clientWidth;
		var frameHeight = doc.compatMode == "CSS1Compat" ? doc.documentElement.clientHeight : doc.body.clientHeight;

		if (altWidth < frameWidth)
		{
			altWidth = frameWidth;
		}

		if (altHeight < frameHeight)
		{
			altHeight = frameHeight;
		}

		if (canvas_width < altWidth)
		{
			canvas_width = altWidth;
		}

		if (canvas_height < altHeight)
		{
			canvas_height = altHeight;
		}
	}

	return {
		Width: canvas_width,
		Height: canvas_height
	};
}

function findScrolledElement(docWidth, docHeight) {

	var curDoc = document,
		bestElem,
		loc = location.href,
        itr = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, null, false),
        elem;

    while ((elem = itr.nextNode()) !== null)
	{
		if (elem.scrollWidth > 0 && elem.scrollHeight > 0 && (elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight) &&
			((loc.match(/https?:\/\/www\.(facebook|fb)\.com/i) && elem.scrollHeight > docHeight * 0.5) ||
			((elem.scrollWidth > docWidth && elem.scrollHeight > docHeight * 0.5) || (elem.scrollHeight > docHeight && elem.scrollWidth > docWidth * 0.5) || (elem.clientWidth > docWidth * 0.7 && elem.clientHeight > docHeight * 0.7))))
		{
			var style = curDoc.defaultView.getComputedStyle(elem, "");
			if (isScrollableStyle(style) && (!bestElem || bestElem.scrollWidth * bestElem.scrollHeight < elem.scrollWidth * elem.scrollHeight))
			{
				var ext = getElementExtents(elem);
				// Элемент должен полностью помещаться в окне
				if (ext.absoluteX + ext.w <= window.innerWidth + 2 && ext.absoluteY + ext.h <= window.innerHeight + 2)
					bestElem = elem;
			}
		}

	}

	if (bestElem) {
        getConsolePtr()("Found scrolled element:");
        getConsolePtr()(bestElem);
    }
	
	return bestElem;
}

function getElementExtents(element)
{
	var rects = element.getClientRects(), extents = {absoluteX: 0, absoluteY: 0, x: 0, y: 0, w: 0, h: 0};
	if (rects.length > 0)
	{
		extents.absoluteX = element.clientLeft + rects[0].left;
		extents.absoluteY = element.clientTop + rects[0].top;
		extents.w = rects[0].width;
		extents.h = rects[0].height;
	}

	return extents;
}

function disableFloatingInView(parent)
{
	var curDoc = document, ext = getElementExtents(parent),
        sqr = window.innerWidth * window.innerHeight + 1;

	modifiedNodes2 = [];

	//noinspection JSUnresolvedVariable
	var itr = curDoc.createNodeIterator(curDoc.documentElement, NodeFilter.SHOW_ELEMENT, null, false), current;
	while ((current = itr.nextNode()) !== null)
	{
		var style = curDoc.defaultView.getComputedStyle(current, "");
		
		if (style && style.getPropertyValue("opacity") !== "0" && (style.getPropertyValue("position") == "absolute" || style.getPropertyValue("position") == "relative"))
		{
			var elemExt = getElementExtents(current);
            if (elemExt.w * elemExt.h === 0 || elemExt.w * elemExt.h / sqr > 0.35) continue;
			if (current != parent && getIntersection(ext.absoluteX, ext.absoluteY, ext.w, ext.h, elemExt.absoluteX, elemExt.absoluteY, elemExt.w, elemExt.h) &&
				!isChildOf(parent, current) && !isChildOf(current, parent))
			{
				getConsolePtr()("Hiding:");
                getConsolePtr()(current);
				modifiedNodes2.push({object:current, opacity:style.getPropertyValue("opacity")});
                current.style.setProperty("opacity", "0", "important");
			}
		}
	}
}

function enableFloatingInView()
{
	for (var i = 0; i < this.modifiedNodes2.length; i++)
	{
		modifiedNodes2[i].object.style.setProperty("opacity", modifiedNodes2[i].opacity);
	}
}

function getOffsets(msg, mode, cropRect) {
    var offsets = {x: 0, y:0};
    if (mode === cModeVisible) {
        offsets.x = getScrollingElement().scrollLeft;
        offsets.y = getScrollingElement().scrollTop;
    }
    else if (mode === cModeSelected) {
        offsets.x = cropRect.left;
        offsets.y = cropRect.top;
    }
    else if (msg.div) {
        offsets.x = msg.left;
        offsets.y = msg.top;
    }
    return offsets;
}

function getScrollingElement() {
    return document.scrollingElement || document.body;
}


//noinspection JSUnresolvedVariab
chrome.runtime.onConnect.addListener(function(port)
{
	if (chrome.runtime.sendMessage && port.name != commPortName) {
		getConsolePtr()("Comm port name is wrong: " + port.name + " <> " + commPortName);
		return;
	}
	
	var
        firstTime = true,
        frameMode = false,
        isEmulation = window.navigator.plugins.length === 0 && isConsoleOpened(),
	    rows = 1, cols = 1,
	    mode = 0,
        timeout = 0,
        ratioW = 1, ratioH = 1,
	    horzMoving = true, vertMoving = true,
	    clientWidth = 0, clientHeight = 0,
	    scrollStart = {left : 0, top : 0},
	    scrollEnd 	= {left : 0, top : 0},
	    cropRect = {left: 0, top: 0, right: 0, bottom: 0},
	    divElement, doc, body, docScroll, savedScrollTop, savedScrollLeft, fStylesModified, savedOFStyle, savedHeightStyle, savedBodyOFStyle, savedHTMLOverflowXStyle, savedHTMLOverflowYStyle, docWidth, docHeight, savedZIndex, p, linksGrabber, fNative,
        fFacebook = window.location.href.match(/https?:\/\/www\.(facebook|fb)\.com/i), fbAdapter;

	stubbornNodes = [];
	modifiedNodes2 = [];
    divsSnapshot = [];


    function setOptionFromScript(optionName, optionValue) {
        options[optionName] = optionValue;
        port.postMessage({topic: "setOption", optionName: optionName, optionValue: optionValue});
    }


	function initGrabber(grabMode, root) {
        divElement = root;
		mode = grabMode;

        docScroll = getScrollingElement();

		if (mode == cModeEntire && !divElement && !frameMode)
			divElement = findScrolledElement(docScroll.scrollWidth, docScroll.scrollHeight);

        body = divElement || doc.body;

		if (divElement)
		{
            docScroll = divElement;
            divElement.scrollIntoView();
			disableFloatingInView(divElement);
			savedZIndex = divElement.style.zIndex;
			divElement.style.zIndex = 2147483647;
		}


		savedScrollTop = docScroll.scrollTop;
		savedScrollLeft = docScroll.scrollLeft;
		docWidth = docScroll.scrollWidth;
		docHeight = docScroll.scrollHeight;
        savedHTMLOverflowYStyle = savedHTMLOverflowXStyle = undefined;
        savedBodyOFStyle = undefined;


		if (!divElement)
		{
			if (document.defaultView.getComputedStyle(document.body, "").overflowX === 'hidden') {
                savedBodyOFStyle = body.style.overflowX;
                var t = docScroll.scrollHeight;
                body.style.overflowX = 'visible';
                if (t >= docScroll.scrollHeight) {
                    body.style.overflowX = savedBodyOFStyle;
                    savedBodyOFStyle = undefined;
                }
            }

            docWidth = Math.max(doc.documentElement.scrollWidth, body.scrollWidth, document.documentElement.clientWidth, body.offsetWidth, document.documentElement.offsetWidth);
			docHeight = Math.max(doc.documentElement.scrollHeight, body.scrollHeight, document.documentElement.clientHeight, body.offsetHeight, document.documentElement.offsetHeight);

			if (docWidth <= 0 || docHeight <= 0)
			{
				var e = getAltExtents();
				docWidth = e.Width;
				docHeight = e.Height;
			}

			if (docWidth <= 0) docWidth = 1024;
			if (docHeight <= 0) docHeight = 768;
		}


        if (mode === cModeEntire)
		{
            if (isEmulation) {
                // make toolbars disappear in Device emulation mode - bug in Windows
                docScroll.scrollTop = 1;
                docScroll.scrollLeft = 1;
                setTimeout(function() {docScroll.scrollTop = 0; docScroll.scrollLeft = 0;}, 10);
            }

            else {
                docScroll.scrollTop = 0;
                docScroll.scrollLeft = 0;
            }

		}

        if (fFacebook)
            fbAdapter = FBAdapter();

		if (mode !== cModeVisible && mode !== cModeBrowser) {
            enableSomeElements(false);
            //hideScrollbars(true);
        }
		//	disableFixedPositions();

		if (divElement)
		{
			clientWidth = divElement.clientWidth;
			clientHeight = divElement.clientHeight;
		}
		else
		{
			clientWidth = window.innerWidth;//doc.compatMode == "CSS1Compat" ? doc.documentElement.clientWidth : body.clientWidth;
			clientHeight = window.innerHeight;//doc.compatMode == "CSS1Compat" ? doc.documentElement.clientHeight : body.clientHeight;
            if (docWidth < window.innerWidth) docWidth = window.innerWidth;
		}



        /*if (window.innerHeight <= clientHeight && !isEmulation)
			docWidth = clientWidth;*/

		/*if (!divElement && mode === cModeEntire && !hasXScrollbar() && !hasYScrollbar()) {
		 docHeight = clientHeight;
		 docWidth = clientWidth;
		 mode = cModeVisible;
		 }*/
	}

	port.onMessage.addListener(function(msg) {
		switch (msg.topic)
		{
			case "init":
                p = msg.p;
                fNative = msg.native;
                window.isDebug |= msg.debug;
                timeout = (p ? 150 : 200);
                //timeout = 1500;
				doc = window.document;
				options = JSON.parse(msg.options);
                frameMode = msg.frameMode;


				try {
                    initGrabber(msg.mode);
                }
                catch (e) {
                    getConsolePtr()(e.toString());
                    port.postMessage({topic: "initAborted"});
                    return;
                }

                if ((mode !== cModeSelected && !divElement) || isEmulation) {
                    fStylesModified = true;
                    savedOFStyle = docScroll.style.overflow;
                    savedHeightStyle = docScroll.style.height;

                    // Ebay order details не работает в старом режиме.

                    docScroll.style.overflow = 'hidden';
                        //docScroll.style.height = "initial";
                    docScroll.style.height = docHeight + "px";

                    if (!document.scrollingElement) {
                        savedHTMLOverflowYStyle = document.defaultView.getComputedStyle(document.documentElement, "").overflowY;
                        document.documentElement.style.overflowY = "initial";

                        savedHTMLOverflowXStyle = document.defaultView.getComputedStyle(document.documentElement, "").overflowX;
                        document.documentElement.style.overflowX = "initial";
                    }
                }

                var
                    response = {
                        topic: "initDone",
                        url: document.location.toString(),
                        title: document.title,
                        cw: frameMode && frameElement ? frames.parent.innerWidth : window.innerWidth,
                        ch: frameMode && frameElement ? frames.parent.innerHeight: window.innerHeight,
                        emulation: isEmulation
                    };

				if (fFacebook && mode === cModeEntire)
				{
					setTimeout(function(){
                        docScroll.scrollTop = docHeight;
						setTimeout(function(){
                            docScroll.scrollTop = 0;
							setTimeout(function(){
								port.postMessage(response);
							}, timeout);
						}, timeout);
					}, timeout);
				}
				else
				{
					setTimeout(function(){
						port.postMessage(response);
					}, timeout);
				}

            break;

            case "setRatio" :
                ratioW = msg.ratioW;
                ratioH = msg.ratioH;
                getConsolePtr()("Ratios: " + ratioW + ", " + ratioH);
            break;

			case "selectArea":

                if (!document.body) {
                    alert("Apologies, this page does not support capturing selections.");
                    port.postMessage({topic: "areaSelectionCanceled"});
                    break;
                }

				hideStubbornElements();

                var fsSelectionHint = FireShotAddon.FSSelectionHint(document);

                if (fNative && getOptionFromScript(cShowSelectionHintPref, "true") !== "false")
                    fsSelectionHint.show();

                var fsSelector = FireShotAddon.FSSelector({
                        browser: "chrome",
                        extendedMode: fNative,
                        doc: document
                    });

                fsSelector.makeSelection(
                    function (data)
                    {
                        if (fNative) {
                            if (fsSelectionHint.isShown())
                                fsSelectionHint.hide();
                            else
                                setOptionFromScript(cShowSelectionHintPref, "false");
                        }

                        if (data.left == data.right || data.top == data.bottom) {
                            port.postMessage({topic: "areaSelectionCanceled"});
                            showHiddenElements();
                            removeCustomAttributes();
                        }
                        else
                        {


                            if (data.isScrollable) {
                                getConsolePtr()("Capturing element:");
                                getConsolePtr()(data.selectedElement);
                                initGrabber(cModeEntire, data.selectedElement);
                            }
                            else {

                                docScroll.scrollLeft    = data.left;
                                docScroll.scrollTop	    = data.top;

                                scrollStart.left = docScroll.scrollLeft;
                                scrollStart.top  = docScroll.scrollTop;

                                cropRect.left 	= data.left;
                                cropRect.top	= data.top;
                                cropRect.right	= data.right;
                                cropRect.bottom	= data.bottom;
                            }

                            setTimeout(function(){
                                hideStubbornElements();
                                port.postMessage({topic: "areaSelected"});
                            }, timeout);


                        }


                    }
                );
				break;

			case "scrollNext":

				if (firstTime)
				{
                    linksGrabber = new LinksGrabber(divElement || document);
                    linksGrabber.clearAttributes();
                    linksGrabber.markHiddenLinks();
                    linksGrabber.createLinksSnapshot();
                    hideObtrusiveElements(docScroll, false);
                    //createInitialElementsSnapshot();

                    // Линки прокликиваются только для первого экрана.
                    if (docScroll.scrollLeft === 0 && docScroll.scrollTop === 0)
                        linksGrabber.checkClickableLinks();


                    firstTime = false;
					setTimeout(function(){
						//alert(1);
                        port.postMessage({topic: "scrollDone", x: docScroll.scrollLeft * ratioW, y: docScroll.scrollTop * ratioH});
					}, timeout);

					return;
				}

                //checkClickableLinks(tLinks);
				var savedPos, shift;

				if (horzMoving && mode != cModeVisible && mode != cModeBrowser)
				{
					var
						maxWidth = mode == cModeSelected ? cropRect.right : docWidth;

                    shift = Math.max(clientWidth - 30, 0);
					savedPos = docScroll.scrollLeft;
                    docScroll.scrollLeft += Math.max(0, Math.min(shift, maxWidth - (docScroll.scrollLeft + shift) + 20));
					horzMoving = docScroll.scrollLeft != savedPos && docScroll.scrollLeft < docWidth;

					if (horzMoving)
					{
						if (rows == 1) cols ++;
						getConsolePtr()("scrollLeft:" + docScroll.scrollLeft);
						setTimeout(function(){
							hideStubbornElements(divElement, true);
                            hideObtrusiveElements(docScroll, true);
                            //hideNewElements();
                            linksGrabber.createLinksSnapshot();
							setTimeout(function(){
								port.postMessage({topic: "scrollDone", x: docScroll.scrollLeft * ratioW, y: docScroll.scrollTop * ratioH});
							}, timeout);
						}, 0);

						return;
					}

					else if (mode == cModeSelected)
						scrollEnd.left = docScroll.scrollLeft;
				}

				if (vertMoving && mode != cModeVisible && mode != cModeBrowser)
				{
					shift = Math.max(0, clientHeight - 40);
                    savedPos = docScroll.scrollTop;
                    docScroll.scrollTop += Math.max(0, shift);
					vertMoving = savedPos != docScroll.scrollTop && docScroll.scrollTop < docHeight;

					if (mode == cModeSelected)
					{
						vertMoving &= docScroll.scrollTop < cropRect.bottom;
						if (!vertMoving)
							scrollEnd.top = savedPos;
					}
					if (vertMoving)
					{
						rows ++;
                        docScroll.scrollLeft = (mode == cModeEntire ? 0 : scrollStart.left);

						getConsolePtr()("scrollTop:" + docScroll.scrollTop);
						horzMoving = true;

						setTimeout(function(){

                            if (fFacebook)
                                fbAdapter.undoSwitchingToFixedPositions();

							hideStubbornElements(divElement);
                            hideObtrusiveElements(docScroll, false);
                            //hideNewElements();
                            linksGrabber.createLinksSnapshot();
							setTimeout(function(){
								port.postMessage({topic: "scrollDone", x: docScroll.scrollLeft * ratioW, y: docScroll.scrollTop * ratioH});
							}, timeout);
						}, timeout);

						return;
					}
				}

                // Check if we're in the Device Mode emulation
                //var zoom = 100;//window.navigator.plugins.length === 0 && window.navigator.maxTouchPoints > 0 ? 100 : window.devicePixelRatio * 100;

				//noinspection JSUnresolvedVariable
				msg = {
					topic: "scrollFinished",
					div  : 0,
					left : 0,
					top : 0,
					width: (mode == cModeEntire ? docWidth : clientWidth),
					height: (mode == cModeEntire ? docHeight : clientHeight),
					ratioW: ratioW,
                    ratioH: ratioH,
					rows: rows, cols: cols,
					cw: clientWidth, ch: clientHeight,
					hScrollbar: window.innerHeight > clientHeight,
                    vScrollBar: window.innerWidth > clientWidth,
                    cropLeft: 0,
                    cropRight: 0,
                    cropTop: 0,
                    cropBottom: 0
				};

                if (frameMode && frameElement) {
                    msg.div = 1;
                    msg.left = frameElement.clientLeft + frameElement.offsetLeft;
                    msg.top = frameElement.clientTop + frameElement.offsetTop;
                }

				else if (divElement) {
					var rects = divElement.getClientRects();
					msg.div = 1;
					if (rects.length > 0)
					{
						msg.left = divElement.clientLeft + rects[0].left;
						msg.top = divElement.clientTop + rects[0].top;
					}

                    divElement.style.zIndex = savedZIndex;
                    enableFloatingInView();
				}

				if (mode === cModeSelected) {
					msg.width 	= scrollEnd.left - scrollStart.left + clientWidth;
					msg.height 	= scrollEnd.top - scrollStart.top + clientHeight;

					msg.crop 		= true;
					msg.cropLeft 	= cropRect.left - scrollStart.left;
					msg.cropTop 	= cropRect.top - scrollStart.top;
					msg.cropRight	= msg.cropLeft + (cropRect.right - cropRect.left);
					msg.cropBottom	= msg.cropTop + (cropRect.bottom - cropRect.top);
				}

                getConsolePtr()(JSON.stringify(msg));

                var offsets = getOffsets(msg, mode, cropRect);
                linksGrabber.getLinks(msg, offsets);
                linksGrabber.clearAttributes();
                linksGrabber = undefined;

                msg.left *= ratioW;
                msg.top *= ratioH;
                msg.width *= ratioW;
                msg.height *= ratioH;
                msg.cw *= ratioW;
                msg.ch *= ratioH;

                msg.cropLeft *= ratioW;
                msg.cropTop *= ratioH;
                msg.cropRight *= ratioW;
                msg.cropBottom *= ratioH;

                docScroll.scrollLeft = savedScrollLeft;
                docScroll.scrollTop = savedScrollTop;

                if (fStylesModified) {
                    docScroll.style.overflow = savedOFStyle;
                    docScroll.style.height = savedHeightStyle;
                }

                if (savedBodyOFStyle !== undefined) document.body.style.overflowX = savedBodyOFStyle;
                if (savedHTMLOverflowYStyle !== undefined) document.documentElement.style.overflowY = savedHTMLOverflowYStyle;
                if (savedHTMLOverflowXStyle !== undefined) document.documentElement.style.overflowX = savedHTMLOverflowXStyle;


                if (mode != cModeVisible && mode != cModeBrowser) {
					enableSomeElements(true);
                    //hideScrollbars(false);
                }
				//	enableFixedPositions();

				showHiddenElements();
                removeCustomAttributes();

				setTimeout(function(){
					port.postMessage(msg);
				}, timeout);

				break;

            case "sendFireShotCaptureCompleteEvent" :
                if (window.fsPendingCB) {
                    var evtData = {cbId : window.fsPendingCB, data: msg.data};
                    var event = new document.defaultView.CustomEvent('FireShotCaptureCompleteEvent', {detail: evtData});
                    document.dispatchEvent(event);
                }

                break;
		}

		getConsolePtr()("CS:" + msg.topic);

	});
});

/*

document.addEventListener('keydown', function(event) 
{
	var curShortcut = getShortcut(event);
		
	if (curShortcut != "")
		chrome.runtime.sendMessage({message: "checkHotkey", data: curShortcut});
});*/
