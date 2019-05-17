//********************************************************************************************************
// FireShot - Webpage Screenshots and Annotations
// Copyright (C) 2007-2018 Evgeny Suslikov (evgeny@suslikov.ru)
//********************************************************************************************************

// One file for browsers: chrome, mozilla

var FireShotAddon = {
    FSSelector : function(options) {
        var	
            holder,
            wrapper,
            info,

            onSelected,
            selectedElement,

            borders		        = [],
            outer		        = [],
            scrollableElements  = [],

            x1                  = 0,
            x2                  = 0,
            y1                  = 0,
            y2                  = 0,

            prevx               = 0,
            prevy               = 0,

            fTimeout            = 0,
            dbgCntr             = 0,

            ctrlKey	            = false,
            destroyed	        = false,
            fOnlyAreaSelection  = false,
            extendedMode        = options.extendedMode || false,
            doc			        = options.doc,
            browser             = options.browser || "chrome",
            wnd,
            docBody,
            docScroll           = doc.scrollingElement || doc.body,
            autoScrollTO,

            animatedImgDataURL  = "data:image/gif;base64,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";


        function init() {
            docBody = doc.body;
            if (typeof(window) != "undefined") wnd = window;

            if (browser === "firefox") {
                docBody = doc.compatMode == "CSS1Compat" ? doc.documentElement : doc.body;
                wnd = content.window;
            }

            if (browser === "ie") {
                docBody = doc.compatMode == "CSS1Compat" ? doc.documentElement : doc.body;
            }

            if (doc.activeElement && doc.activeElement.tagName === "IFRAME")
                doc.activeElement.blur();
        }

        function isScrollableStyle(style) {
            return style && (style.getPropertyValue("overflow") == "scroll" || style.getPropertyValue("overflow") == "auto" ||
                style.getPropertyValue("overflow-y") == "scroll" || style.getPropertyValue("overflow-y") == "auto" ||
                style.getPropertyValue("overflow-x") == "scroll" || style.getPropertyValue("overflow-x") == "auto")	&&
                style.getPropertyValue("display") != "none" && style.getPropertyValue("visibility") != "hidden";
        }

        function getElementRect(elem, root) {
            var box = elem.getBoundingClientRect(),
                body = root == doc ? docBody : root,
                docElem = root == doc ? root.documentElement : root,
                scrollTop = wnd.pageYOffset || docScroll.scrollTop,
                scrollLeft = wnd.pageXOffset || docScroll.scrollLeft,
                clientTop = 0, //docElem.clientTop || body.clientTop || 0,
                clientLeft = 0, //= docElem.clientLeft || body.clientLeft || 0,
                top  = box.top +  scrollTop - clientTop,
                left = box.left + scrollLeft - clientLeft;

            return { top: Math.round(top), left: Math.round(left), width: box.width, height: box.height };
        }

        function isElementHidden(elem) {
            var p = elem;

            while (p && p != doc) {

                var style = doc.defaultView.getComputedStyle(p, "");

                if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0")
                    return true;
                p = p.parentNode;
            }

            return false;
        }

        function getScrollableElements() {
            var
                itr = doc.createNodeIterator(doc.body, wnd.NodeFilter.SHOW_ELEMENT, null, false),
                elem;

            scrollableElements = [];

            while ((elem = itr.nextNode()) !== null) {

                if (elem.tagName === "BODY") continue;
                if (elem.scrollWidth > 0 && elem.scrollHeight > 0 && (elem.scrollWidth > elem.clientWidth || elem.scrollHeight > elem.clientHeight)) {
                    var style = doc.defaultView.getComputedStyle(elem, "");

                    if (isScrollableStyle(style) && !isElementHidden(elem)) {
                        scrollableElements.push({e: elem, rect: getElementRect(elem, doc)});
                    }
                }

            }
        }

        function highlightScrollableElements(fShow) {
            if (!extendedMode) return;

            var cntr = 0, div;
            scrollableElements.forEach(function (elem) {
                var newId = "divFireShotHightlightElement-" + cntr++;
                if (fShow) {
                    div = doc.createElement('div');
                    div.id = newId;
                    div.style.cssText = "position: absolute; left: " + (elem.rect.left - 3) +
                        "px; top: " + (elem.rect.top - 3) +
                        "px; width: " + elem.rect.width +
                        "px; height: " + elem.rect.height +
                        "px; z-index: 2147483640; border:#fd0 solid 3px;";

                    var info = doc.createElement('div');
                    info.style.cssText   = "font-family: Tahoma; font-size:10px; line-height:1.3em; color: #fff; margin:5px; width:auto; height:auto; padding: 2px; background: #000; opacity: 0.9; position:absolute; border:#333 solid 1px;";
                    info.innerHTML = "<img src='" + animatedImgDataURL + "' width='16' height='16'/>" +
                        "&nbsp;Hold the CTRL key and click this area to capture the scrolling content";

                    div.appendChild(info);
                    doc.body.appendChild(div);

                    //if (info.scrollWidth + 11 > elem.rect.width || info.scrollHeight + 11 > elem.rect.height)
                    //    div.removeChild(info);
                }
                else {
                    div = doc.getElementById(newId);
                    if (div) doc.body.removeChild(div);
                }
            });

        }

        function getScrolledElementAt(x, y) {
            for (var i = 0; i < scrollableElements.length; ++i) {
                var elem = scrollableElements[i];
                if (x >= elem.rect.left && x < elem.rect.left + elem.rect.width && y >= elem.rect.top && y <= elem.rect.top + elem.rect.height) {
                    return elem.e;
                }
            }

            return undefined;
        }

        function scrolledElementExists(e) {
            for (var i = 0; i < scrollableElements.length; ++i)
                if (scrollableElements[i].e === e) return true;
            return false;
        }

        function createHTMLHelpers() {
            holder               = doc.createElement('div');
            holder.style.cssText = "position: absolute; left: 0px; top: 0px; width: 0px; height: 0px; z-index: 2147483640; cursor: crosshair;";

            info                 = doc.createElement('div');
            info.style.cssText   = "font-family: Tahoma; font-size:14px; color: #fff; bottom: 10px; right: 10px; width:auto; height:auto; padding: 3px; background: #000; opacity: 0.9; position:absolute; border:#333 solid 1px; cursor: crosshair;";

            wrapper = doc.createElement('div');
            wrapper.style.cssText = "position: absolute; left: 0px; top: 0px; opacity: 0; cursor: crosshair; z-index: 2147483641;";

            doc.body.appendChild(wrapper);

            for (var i = 0; i < 4; i++) {
                borders.push(doc.createElement('div'));

                var cssText;

                switch (i) {
                    case 0:
                        cssText = "background: url('data:image/gif;base64,R0lGODlhAQAGAKEAAP///wAAADY2Nv///yH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQACgD/ACwAAAAAAQAGAAACAxQuUgAh+QQBCgADACwAAAAAAQAGAAACA5SAUgAh+QQBCgADACwAAAAAAQAGAAACA5SBBQAh+QQBCgADACwAAAAAAQAGAAACA4QOUAAh+QQBCgADACwAAAAAAQAGAAACAwSEUAAh+QQBCgADACwAAAAAAQAGAAACA4SFBQA7') repeat-y left top;";
                        break;
                    case 1:
                        cssText = "background: url('data:image/gif;base64,R0lGODlhBgABAKEAAP///wAAADY2Nv///yH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQACgD/ACwAAAAABgABAAACAxQuUgAh+QQBCgADACwAAAAABgABAAACA5SAUgAh+QQBCgADACwAAAAABgABAAACA5SBBQAh+QQBCgADACwAAAAABgABAAACA4QOUAAh+QQBCgADACwAAAAABgABAAACAwSEUAAh+QQBCgADACwAAAAABgABAAACA4SFBQA7') repeat-x left top;";
                        break;
                    case 2:
                        cssText = "background: url('data:image/gif;base64,R0lGODlhAQAGAKEAAP///wAAADY2Nv///yH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQACgD/ACwAAAAAAQAGAAACAxQuUgAh+QQBCgADACwAAAAAAQAGAAACA5SAUgAh+QQBCgADACwAAAAAAQAGAAACA5SBBQAh+QQBCgADACwAAAAAAQAGAAACA4QOUAAh+QQBCgADACwAAAAAAQAGAAACAwSEUAAh+QQBCgADACwAAAAAAQAGAAACA4SFBQA7') repeat-y right top;";
                        break;
                    case 3:
                        cssText = "background: url('data:image/gif;base64,R0lGODlhBgABAKEAAP///wAAADY2Nv///yH/C05FVFNDQVBFMi4wAwEAAAAh/hpDcmVhdGVkIHdpdGggYWpheGxvYWQuaW5mbwAh+QQACgD/ACwAAAAABgABAAACAxQuUgAh+QQBCgADACwAAAAABgABAAACA5SAUgAh+QQBCgADACwAAAAABgABAAACA5SBBQAh+QQBCgADACwAAAAABgABAAACA4QOUAAh+QQBCgADACwAAAAABgABAAACAwSEUAAh+QQBCgADACwAAAAABgABAAACA4SFBQA7') repeat-x left bottom;";
                        break;
                }

                borders[i].style.cssText = cssText + " opacity: 0.5; position: absolute; cursor: crosshair;";
                holder.appendChild(borders[i]);

                outer.push(doc.createElement('div'));
                outer[i].style.cssText = "position: absolute; background: #000; opacity: 0.3; z-index: 2147483640; cursor: crosshair;";

                doc.body.appendChild(outer[i]);
            }

            holder.appendChild(info);
            doc.body.appendChild(holder);
        }

        function selectElementMouseMove(e) {
            if (destroyed || !e.type) return;

            if (fOnlyAreaSelection || (prevx === e.pageX && prevy === e.pageY))
                return;

            prevx = e.pageX;
            prevy = e.pageY;

            if (fTimeout) clearTimeout(fTimeout);
            fTimeout = setTimeout(function () {

                if (fOnlyAreaSelection && !e.touchEvent) return;

                var elemsToHide = [holder, wrapper, outer[0], outer[1], outer[2], outer[3]];
                elemsToHide.forEach(function (elem) {
                    elem.style.setProperty("display", "none", "important");
                });

                selectedElement = getScrolledElementAt(e.pageX, e.pageY) || doc.elementFromPoint(e.pageX - docScroll.scrollLeft, e.pageY - docScroll.scrollTop);

                //if (isElementHidden(selectedElement))
                //    selectedElement = undefined;

                elemsToHide.forEach(function (elem) {
                    elem.style.setProperty("display", "block", "important");
                });


                if (selectedElement) {

                    var rect = getElementRect(selectedElement, doc);
                    x1 = rect.left;
                    y1 = rect.top;
                    x2 = rect.left + rect.width;
                    y2 = rect.top + rect.height;

                    update();
                }

            }, 15);
        }

        function clearAutoScrollTmr() {
            if (autoScrollTO) {
                clearTimeout(autoScrollTO);
                autoScrollTO = undefined;
            }
        }

        function wrapperMouseDown(e) {

            function autoScroll(e) {
                var
                    speed = 2,
                    shift = {dx: docScroll.scrollLeft, dy: docScroll.scrollTop};

                clearAutoScrollTmr();

                if (e.clientX < 100 && prevx > e.pageX)
                    docScroll.scrollLeft -= (100 - e.clientX) / speed;

                if (e.clientY < 100 && prevy > e.pageY)
                    docScroll.scrollTop -= (100 - e.clientY) / speed;

                var dX = wnd.innerWidth - e.clientX;
                if (dX < 100 && prevx < e.pageX)
                    docScroll.scrollLeft += (100 - dX) / speed;

                var dY = wnd.innerHeight - e.clientY;
                if (dY < 100 && prevy < e.pageY)
                    docScroll.scrollTop += (100 - dY) / speed;

                prevx = e.pageX;
                prevy = e.pageY;

                shift.dx = docScroll.scrollLeft - shift.dx;
                shift.dy = docScroll.scrollTop - shift.dy;

                return shift;
            }

            function wrapperMouseMove(e) {
                if (destroyed || !e.type) return;
                if (e.constructor.name === 'TouchEvent' && e.touches.length === 1) {
                    e = e.touches[0];
                    // Fix for bug in Chrome clientX
                    if (e.pageX === e.clientX && docScroll.scrollLeft > 0) {
                        e = {pageX : e.pageX, pageY: e.pageY, clientX: e.pageX - docScroll.scrollLeft, clientY: e.pageY - docScroll.scrollTop};
                    }
                }

                if (selectedElement) {
                    if (Math.abs(prevx - e.pageX) > 3 && Math.abs(prevy - e.pageY) > 3) {
                        selectedElement = undefined;
                    }
                    else return;
                }

                var shift = autoScroll(e);

                //console.log(e);
                x2 = shift.dx + e.pageX;
                y2 = shift.dy + e.pageY;
                update();

                autoScrollTO = setTimeout(function() {
                    if (!ctrlKey) {
                        var mimicEvt = {clientX : e.clientX, clientY: e.clientY, pageX: e.pageX + shift.dx, pageY: e.pageY + shift.dy};
                        wrapperMouseMove(mimicEvt);
                    }
                }, 25);
            }

            function wrapperMouseUp(e) {

                clearAutoScrollTmr();

                wrapper.removeEventListener('mousemove', wrapperMouseMove, false);
                wrapper.removeEventListener('touchmove', wrapperMouseMove, false);
                doc.removeEventListener('mouseup', wrapperMouseUp, false);
                doc.removeEventListener('touchend', wrapperMouseUp, false);
                doc.removeEventListener('touchcancel', wrapperMouseUp, false);

                if (selectedElement && (!extendedMode || !ctrlKey)) {
                    selectedElement = undefined;
                    x1 = x2 = y1 = y2 = 0;
                }

                update();
                completed();
            }

            if (e.constructor.name === 'TouchEvent' && e.touches.length === 1) {
                e.pageX = e.touches[0].pageX;
                e.pageY = e.touches[0].pageY;
                e.touchEvent = true;

                e.button = 0;
                if (ctrlKey) selectElementMouseMove(e);
            }

            if (e.button === 0) {
                fOnlyAreaSelection = true;
                wrapper.removeEventListener('mousedown',  wrapperMouseDown, true);
                wrapper.removeEventListener('touchstart',  wrapperMouseDown, true);

                wrapper.removeEventListener('mousemove', selectElementMouseMove, true);
                x1 = x2 = e.pageX;

                y1 = y2 = e.pageY;
                prevx = e.pageX;

                prevy = e.pageY;

                highlightScrollableElements(false);

                wrapper.addEventListener('mousemove', wrapperMouseMove, false);
                wrapper.addEventListener('touchmove', wrapperMouseMove, { passive: true });
                doc.addEventListener('mouseup', wrapperMouseUp, false);
                doc.addEventListener('touchend', wrapperMouseUp, { passive: true });
                doc.addEventListener('touchcancel', wrapperMouseUp, { passive: true });
            }

            if (e.constructor.name !== 'TouchEvent') e.preventDefault();
            return true;
        }

        function onKeyDown(e) {
            if (e.keyCode == 27) {
                x1 = 0;
                y1 = 0;
                x2 = 0;
                y2 = 0;

                selectedElement = undefined;
                clearAutoScrollTmr();
                completed();
            }

            if (!ctrlKey && e.ctrlKey) {
                ctrlKey = true;
                update();
            }
        }

        function onKeyUp(e) {
            ctrlKey = e.ctrlKey;
            update();
        }

        function calcSelectionRect() {
            var left = Math.min(x1, x2), top = Math.min(y1, y2), width = Math.abs(x2 - x1), height = Math.abs(y2 - y1);

            if (!selectedElement && ctrlKey) {
                //noinspection JSSuspiciousNameCombination
                height = width;
                if (y2 < y1) top = y1 - height;
            }

            return {left: left, top: top, width: width, height: height};
        }

        function repositionHelper() {
            var margin = "10px";

            info.style.top      = y2 <= y1 ? margin : "";
            info.style.bottom   = y2 > y1 ? margin : "";

            info.style.left     = x2 <= x1 ? margin: "";
            info.style.right    = x2 > x1 ? margin : "";
        }

        function update() {
            if (destroyed) return;

            var docWidth  = Math.max(doc.documentElement.scrollWidth, doc.body.scrollWidth);
            var docHeight = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight);

            var s = calcSelectionRect();

            if (selectedElement && (!extendedMode || !ctrlKey)) {
                s.left = s.top = s.width = s.height = 0;
            }

            holder.style.left   = s.left + "px";
            holder.style.top    = s.top + "px";
            holder.style.width  = s.width + "px";
            holder.style.height = s.height + "px";

            wrapper.style.width  = docWidth + "px";
            wrapper.style.height = docHeight + "px";


            outer[0].style.left   = 0 + "px";
            outer[0].style.top    = 0 + "px";
            outer[0].style.width  = docWidth + "px";
            outer[0].style.height = holder.style.top;

            outer[1].style.left   = 0 + "px";
            outer[1].style.top    = s.top + s.height + "px";
            outer[1].style.width  = docWidth + "px";
            outer[1].style.height = docHeight - (s.top + s.height) + "px";

            outer[2].style.left   = 0 + "px";
            outer[2].style.top    = s.top + "px";
            outer[2].style.width  = s.left + "px";
            outer[2].style.height = s.height + "px";

            outer[3].style.left   = s.left + s.width + "px";
            outer[3].style.top    = s.top + "px";
            outer[3].style.width  = docWidth - (s.left + s.width) + "px";
            outer[3].style.height = s.height + "px";

            for (var i = 0; i < 4; i++) {
                borders[i].style.left   = 0 + "px";
                borders[i].style.top    = 0 + "px";
                borders[i].style.right  = 0 + "px";
                borders[i].style.bottom = 0 + "px";
            }

            repositionHelper();

            if (selectedElement && scrolledElementExists(selectedElement)) {
                var dimensions = Math.round(selectedElement.scrollWidth) + " x " + Math.round(selectedElement.scrollHeight),
                    imgHTML    = "<img src='" + animatedImgDataURL + "' width='16' height='16'/>";

                info.innerHTML = imgHTML + " Scroll and capture: " + dimensions;
                if (info.scrollWidth + 11 > s.width || info.scrollHeight + 11 > s.height)
                    info.innerHTML = imgHTML;
            }
            else
                info.innerHTML = Math.round(s.width) + " x " + Math.round(s.height);

            info.style.visibility = info.scrollWidth + 11 < s.width && info.scrollHeight + 11 < s.height ? "visible" : "hidden";
        }


        function completed() {
            if (destroyed) return;

            destroyed = true;

            wrapper.removeEventListener('mousedown', wrapperMouseDown, true);
            doc.removeEventListener('keydown', onKeyDown, false);
            doc.removeEventListener('keyup', onKeyUp, false);

            doc.body.removeChild(holder);
            doc.body.removeChild(wrapper);

            highlightScrollableElements(false);

            for (var i = 0; i < 4; i++)
                doc.body.removeChild(outer[i]);

            if (selectedElement) {
                var rect = getElementRect(selectedElement, doc);
                x1 = rect.left;
                y1 = rect.top;
                x2 = rect.left + rect.width;
                y2 = rect.top + rect.height;
            }

            var s = calcSelectionRect();

            if (onSelected) {
                onSelected({
                    selectedElement: selectedElement,
                    isScrollable: selectedElement ? isScrollableStyle(doc.defaultView.getComputedStyle(selectedElement, "")) : false,
                    left: s.left,
                    top: s.top,
                    right: s.left + s.width,
                    bottom: s.top + s.height
                });
            }
        }

        return {
            makeSelection: function (onSelectedCB) {
                onSelected      = onSelectedCB;

                init();
                getScrollableElements();
                highlightScrollableElements(true);
                createHTMLHelpers();
                update();

                wrapper.addEventListener('mousedown', wrapperMouseDown, true);
                wrapper.addEventListener('mousemove', selectElementMouseMove, true);
                wrapper.addEventListener('touchstart', wrapperMouseDown, {passive: true});
                doc.addEventListener('keydown', onKeyDown, false);
                doc.addEventListener('keyup', onKeyUp, false);
            }
        };
    },

    FSSelectionHint : function(docElement) {
        var
            cMessageContainerId = "FireShot.topMessageHolder",
            doc                 = docElement;

        return {
            show: function() {

                var holder = doc.createElement('div');
                holder.id = cMessageContainerId;
                holder.style.cssText = "display:block; opacity:0; border:1px solid #666; background:#fff; z-index:2147483647; font-family: Tahoma; text-align: left; font-size:20px; color: #000; margin:0; padding:10px; width:100%;  left:0px; right:0px; top:0px; position:fixed";
                holder.innerHTML = "<strong>HINT:</strong> Hold the CTRL key to capture specific HTML element or scrolling area. &#160;";
                holder.innerHTML += "<a target='_blank' style='color:#08c' href='https://getfireshot.com/demos/selection.php'>View demo</a>";
                holder.innerHTML += " | ";
                holder.innerHTML += "<a style='color:#08c' href='#' onclick = 'document.body.removeChild(document.getElementById(\"" + cMessageContainerId + "\")); return false;'>Close</a>";
                doc.body.appendChild(holder);


                var opacity = 0;
                function setOpacity() {
                    opacity += 0.1;
                    holder.style.opacity = opacity;
                    if (opacity < 1)
                        setTimeout(setOpacity, 30);
                }

                setTimeout(setOpacity, 300);
            },

            hide: function() {
                var element = doc.getElementById(cMessageContainerId);
                if (element) doc.body.removeChild(element);
            },

            isShown: function() {
                return doc.getElementById(cMessageContainerId) !== null;
            }

        }
    }
};