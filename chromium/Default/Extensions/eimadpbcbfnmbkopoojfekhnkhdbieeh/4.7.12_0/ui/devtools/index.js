(function () {
    'use strict';

    /* malevic@0.12.2 - Mar 8, 2019 */
    function classes(...args) {
        const classes = [];
        args.filter((c) => Boolean(c))
            .forEach((c) => {
            if (typeof c === 'string') {
                classes.push(c);
            }
            else if (typeof c === 'object') {
                classes.push(...Object.keys(c)
                    .filter((key) => Boolean(c[key])));
            }
        });
        return classes.join(' ');
    }
    function styles(declarations) {
        return Object.keys(declarations)
            .filter((cssProp) => declarations[cssProp] != null)
            .map((cssProp) => `${cssProp}: ${declarations[cssProp]};`)
            .join(' ');
    }
    function isObject(value) {
        return typeof value === 'object' && value != null;
    }
    function isEmptyDeclaration(d) {
        return d == null || d === '';
    }
    function filterChildren(declarations) {
        return declarations.filter((c) => !isEmptyDeclaration(c));
    }
    function unbox(d) {
        const component = d.type;
        const props = d.attrs == null ? undefined : d.attrs;
        const children = d.children;
        return component(props, ...children);
    }
    function deepUnbox(d) {
        let r = d;
        while (typeof r.type === 'function') {
            r = unbox(r);
        }
        return r;
    }
    function flatten(arr) {
        return arr.reduce((flat, toFlatten) => {
            return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
        }, []);
    }

    function m(tagOrComponent, attrs, ...children) {
        children = flatten(children);
        if (typeof tagOrComponent === 'string') {
            const tag = tagOrComponent;
            return { type: tag, attrs, children };
        }
        if (typeof tagOrComponent === 'function') {
            const component = tagOrComponent;
            return { type: component, attrs, children };
        }
        throw new Error('Unsupported declaration type');
    }

    const dataBindings = new WeakMap();
    function setData(element, data) {
        dataBindings.set(element, data);
    }

    const eventListeners = new WeakMap();
    function addListener(element, event, listener) {
        let listeners;
        if (eventListeners.has(element)) {
            listeners = eventListeners.get(element);
        }
        else {
            listeners = {};
            eventListeners.set(element, listeners);
        }
        if (listeners[event] !== listener) {
            if (event in listeners) {
                element.removeEventListener(event, listeners[event]);
            }
            element.addEventListener(event, listener);
            listeners[event] = listener;
        }
    }
    function removeListener(element, event) {
        let listeners;
        if (eventListeners.has(element)) {
            listeners = eventListeners.get(element);
        }
        else {
            return;
        }
        if (event in listeners) {
            element.removeEventListener(event, listeners[event]);
            delete listeners[event];
        }
    }

    function createPlugins() {
        const plugins = [];
        return {
            add(plugin) {
                plugins.push(plugin);
                return this;
            },
            apply(props) {
                let result;
                let plugin;
                for (let i = plugins.length - 1; i >= 0; i--) {
                    plugin = plugins[i];
                    result = plugin(props);
                    if (result != null) {
                        return result;
                    }
                }
                return null;
            }
        };
    }

    const nativeContainers = new WeakMap();
    const mountedElements = new WeakMap();
    const didMountHandlers = new WeakMap();
    const didUpdateHandlers = new WeakMap();
    const willUnmountHandlers = new WeakMap();
    const lifecycleHandlers = {
        'didmount': didMountHandlers,
        'didupdate': didUpdateHandlers,
        'willunmount': willUnmountHandlers
    };
    const XHTML_NS = 'http://www.w3.org/1999/xhtml';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const pluginsCreateNode = createPlugins()
        .add(({ d, parent }) => {
        if (!isObject(d)) {
            return document.createTextNode(d == null ? '' : String(d));
        }
        const tag = d.type;
        if (tag === 'svg') {
            return document.createElementNS(SVG_NS, 'svg');
        }
        if (parent.namespaceURI === XHTML_NS) {
            return document.createElement(tag);
        }
        return document.createElementNS(parent.namespaceURI, tag);
    });
    const pluginsMountNode = createPlugins()
        .add(({ node, parent, next }) => {
        parent.insertBefore(node, next);
        return true;
    });
    const pluginsUnmountNode = createPlugins()
        .add(({ node, parent }) => {
        parent.removeChild(node);
        return true;
    });
    const pluginsSetAttribute = createPlugins()
        .add(({ element, attr, value }) => {
        if (value == null || value === false) {
            element.removeAttribute(attr);
        }
        else {
            element.setAttribute(attr, value === true ? '' : String(value));
        }
        return true;
    })
        .add(({ element, attr, value }) => {
        if (attr.indexOf('on') === 0) {
            const event = attr.substring(2);
            if (typeof value === 'function') {
                addListener(element, event, value);
            }
            else {
                removeListener(element, event);
            }
            return true;
        }
        return null;
    })
        .add(({ element, attr, value }) => {
        if (attr === 'native') {
            if (value === true) {
                nativeContainers.set(element, true);
            }
            else {
                nativeContainers.delete(element);
            }
            return true;
        }
        if (attr in lifecycleHandlers) {
            const handlers = lifecycleHandlers[attr];
            if (value) {
                handlers.set(element, value);
            }
            else {
                handlers.delete(element);
            }
            return true;
        }
        return null;
    })
        .add(({ element, attr, value }) => {
        if (attr === 'data') {
            setData(element, value);
            return true;
        }
        return null;
    })
        .add(({ attr }) => {
        if (attr === 'key') {
            return true;
        }
        return null;
    })
        .add(({ element, attr, value }) => {
        if (attr === 'class' && isObject(value)) {
            let cls;
            if (Array.isArray(value)) {
                cls = classes(...value);
            }
            else {
                cls = classes(value);
            }
            if (cls) {
                element.setAttribute('class', cls);
            }
            else {
                element.removeAttribute('class');
            }
            return true;
        }
        return null;
    })
        .add(({ element, attr, value }) => {
        if (attr === 'style' && isObject(value)) {
            const style = styles(value);
            if (style) {
                element.setAttribute('style', style);
            }
            else {
                element.removeAttribute('style');
            }
            return true;
        }
        return null;
    });
    const elementsAttrs = new WeakMap();
    function getAttrs(element) {
        return elementsAttrs.get(element) || null;
    }
    let currentDOMNode = null;
    function getDOMNode() {
        return currentDOMNode;
    }
    function unboxComponent(d, parent, node) {
        const prevDOMNode = currentDOMNode;
        currentDOMNode = node;
        const u = deepUnbox(d);
        currentDOMNode = prevDOMNode;
        return u;
    }
    function createNode(c, parent, next) {
        const isElement = isObject(c);
        const isComponent = isElement && typeof c.type === 'function';
        const d = isComponent ? unboxComponent(c, parent, null) : c;
        const node = pluginsCreateNode.apply({ d, parent });
        if (isElement) {
            const element = node;
            const elementAttrs = {};
            elementsAttrs.set(element, elementAttrs);
            if (d.attrs) {
                Object.keys(d.attrs).forEach((attr) => {
                    const value = d.attrs[attr];
                    pluginsSetAttribute.apply({ element, attr, value });
                    elementAttrs[attr] = value;
                });
            }
        }
        pluginsMountNode.apply({ node, parent, next });
        if (!(node instanceof Element)) {
            return node;
        }
        if (didMountHandlers.has(node)) {
            didMountHandlers.get(node)(node);
            mountedElements.set(node, true);
        }
        if (isElement && !nativeContainers.has(node)) {
            syncChildNodes(d, node);
        }
        if (isComponent) {
            componentMatches.set(node, c.type);
        }
        if (isElement && c.attrs && c.attrs.key != null) {
            keyMatches.set(node, c.attrs.key);
        }
        return node;
    }
    function collectAttrs(element) {
        return Array.from(element.attributes)
            .reduce((obj, { name, value }) => {
            obj[name] = value;
            return obj;
        }, {});
    }
    function syncNode(c, existing) {
        if (!isObject(c)) {
            existing.textContent = c == null ? '' : String(c);
            return;
        }
        const d = typeof c.type === 'function' ? unboxComponent(c, existing.parentElement, existing) : c;
        const element = existing;
        const attrs = d.attrs || {};
        let existingAttrs = getAttrs(element);
        if (!existingAttrs) {
            existingAttrs = collectAttrs(element);
            elementsAttrs.set(element, existingAttrs);
        }
        Object.keys(existingAttrs).forEach((attr) => {
            if (!(attr in attrs)) {
                pluginsSetAttribute.apply({ element, attr, value: null });
                delete existingAttrs[attr];
            }
        });
        Object.keys(attrs).forEach((attr) => {
            const value = attrs[attr];
            if (existingAttrs[attr] !== value) {
                pluginsSetAttribute.apply({ element, attr, value });
                existingAttrs[attr] = value;
            }
        });
        if (didMountHandlers.has(element) && !mountedElements.has(element)) {
            didMountHandlers.get(element)(element);
            mountedElements.set(element, true);
        }
        else if (didUpdateHandlers.has(element)) {
            didUpdateHandlers.get(element)(element);
        }
        if (!nativeContainers.has(element)) {
            syncChildNodes(d, element);
        }
    }
    function removeNode(node, parent) {
        if (node instanceof Element && willUnmountHandlers.has(node)) {
            willUnmountHandlers.get(node)(node);
        }
        pluginsUnmountNode.apply({ node, parent });
    }
    const componentMatches = new WeakMap();
    const keyMatches = new WeakMap();
    const pluginsMatchNodes = createPlugins()
        .add(({ d, element }) => {
        const declarations = Array.isArray(d.children) ? filterChildren(d.children) : [];
        const nodes = Array.from(element.childNodes);
        const declarationsKeys = new Map();
        declarations
            .filter((c) => isObject(c) && c.attrs && c.attrs.key != null)
            .forEach((c) => {
            if (declarationsKeys.has(c.attrs.key)) {
                throw new Error('Siblings should have different keys');
            }
            declarationsKeys.set(c.attrs.key, c);
        });
        if (declarationsKeys.size > 0 && declarationsKeys.size !== declarations.length) {
            throw new Error('Some siblings did not have keys');
        }
        if (declarationsKeys.size > 0) {
            const matchedByKey = nodes
                .filter((node) => keyMatches.has(node) && declarationsKeys.has(keyMatches.get(node)))
                .reduce((map, node) => {
                map.set(keyMatches.get(node), node);
                return map;
            }, new Map());
            return declarations.map((d) => {
                const key = d.attrs.key;
                const node = matchedByKey.has(key) ? matchedByKey.get(key) : null;
                return [d, node];
            });
        }
        let nodeIndex = 0;
        return declarations.map((c) => {
            const isElement = isObject(c);
            const isText = !isElement;
            let found = null;
            let node = null;
            for (; nodeIndex < element.childNodes.length; nodeIndex++) {
                node = element.childNodes.item(nodeIndex);
                if (isText) {
                    if (node instanceof Element) {
                        break;
                    }
                    if (node instanceof Text) {
                        found = node;
                        nodeIndex++;
                        break;
                    }
                }
                if (isElement && node instanceof Element) {
                    if ((typeof c.type === 'function') ||
                        (typeof c.type === 'string' && node.tagName.toLowerCase() === c.type)) {
                        found = node;
                    }
                    nodeIndex++;
                    break;
                }
            }
            return [c, found];
        });
    });
    function commit(matches, element) {
        const matchedNodes = new Set();
        matches.map(([, node]) => node)
            .filter((node) => node)
            .forEach((node) => matchedNodes.add(node));
        Array.from(element.childNodes)
            .filter((node) => !matchedNodes.has(node))
            .forEach((node) => removeNode(node, element));
        const remainingNodes = Array.from(matchedNodes.values());
        if (remainingNodes.some((node) => keyMatches.has(node))) {
            let a;
            let b;
            for (let i = remainingNodes.length - 2; i >= 0; i--) {
                a = remainingNodes[i];
                b = remainingNodes[i + 1];
                if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_PRECEDING) {
                    b.parentElement.insertBefore(a, b);
                }
            }
        }
        let prevNode = null;
        matches
            .forEach(([d, node], i) => {
            if (node) {
                syncNode(d, node);
                prevNode = node;
            }
            else {
                const nextSibling = (prevNode ?
                    prevNode.nextSibling :
                    (i === 0 ? element.firstChild : null));
                prevNode = createNode(d, element, nextSibling);
            }
        });
    }
    function syncChildNodes(d, element) {
        const matches = pluginsMatchNodes.apply({ d, element });
        commit(matches, element);
    }
    function sync(target, declaration) {
        const isElement = isObject(declaration);
        if (!((!isElement && target instanceof Text) ||
            (isElement && (target instanceof Element && (typeof declaration.type === 'function' || (typeof declaration.type === 'string' &&
                target.tagName.toLowerCase() === declaration.type)))))) {
            throw new Error('Wrong sync target');
        }
        syncNode(declaration, target);
        return target;
    }

    const pluginsIsVoidTag = createPlugins()
        .add((tag) => tag in VOID_TAGS);
    const pluginsSkipAttr = createPlugins()
        .add(({ value }) => (value == null || value === false))
        .add(({ attr }) => (([
        'data',
        'native',
        'didmount',
        'didupdate',
        'willunmount',
    ].indexOf(attr) >= 0 ||
        attr.indexOf('on') === 0) ? true : null));
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    const pluginsStringifyAttr = createPlugins()
        .add(({ value }) => value === true ? '' : escapeHtml(value))
        .add(({ attr, value }) => {
        if (attr === 'class' && isObject(value)) {
            let cls;
            if (Array.isArray(value)) {
                cls = classes(...value);
            }
            else {
                cls = classes(value);
            }
            return escapeHtml(cls);
        }
        return null;
    })
        .add(({ attr, value }) => {
        if (attr === 'style' && isObject(value)) {
            return escapeHtml(styles(value));
        }
        return null;
    });
    const pluginsProcessText = createPlugins()
        .add((text) => escapeHtml(text));
    const VOID_TAGS = [
        'area',
        'base',
        'basefont',
        'bgsound',
        'br',
        'col',
        'command',
        'embed',
        'frame',
        'hr',
        'img',
        'image',
        'input',
        'isindex',
        'keygen',
        'link',
        'menuitem',
        'meta',
        'nextid',
        'param',
        'source',
        'track',
        'wbr',
        'circle',
        'ellipse',
        'image',
        'line',
        'path',
        'polygon',
        'rect',
    ].reduce((map, tag) => (map[tag] = true, map), {});

    /* malevic@0.12.2 - Mar 8, 2019 */

    const nodesData = new WeakMap();
    let current = null;
    let isComponentUnboxing = false;
    function useState(initialState) {
        if (!isComponentUnboxing) {
            throw new Error('Component does not support state, wrap it into `withState');
        }
        const info = current;
        info.state = info.state || initialState;
        const state = info.state;
        const setState = (newState) => {
            if (isComponentUnboxing) {
                throw new Error('Calling `setState` inside a component leads to infinite loop');
            }
            const { component, node, props, children, state } = info;
            info.state = Object.assign({}, state, newState);
            sync(node, {
                type: component,
                attrs: props,
                children,
            });
        };
        return { state, setState };
    }
    function withState(component) {
        function StateComponent(props, ...children) {
            isComponentUnboxing = true;
            const node = getDOMNode();
            const prev = current;
            const info = node && nodesData.has(node) ?
                nodesData.get(node) :
                { component: StateComponent };
            Object.assign(info, {
                props,
                children,
            });
            current = info;
            const d = component(props, ...children);
            current = prev;
            isComponentUnboxing = false;
            if (typeof d.type !== 'string') {
                throw new Error('A component with state should not contain another component');
            }
            d.attrs = d.attrs || {};
            let prevDidMount = d.attrs.didmount;
            d.attrs.didmount = (el) => {
                info.node = el;
                nodesData.set(el, info);
                prevDidMount && prevDidMount(el);
            };
            return d;
        }
        return StateComponent;
    }

    function toArray(x) {
        return Array.isArray(x) ? x : [x];
    }
    function mergeClass(cls, propsCls) {
        const normalized = toArray(cls).concat(toArray(propsCls));
        return classes(...normalized);
    }
    function omitAttrs(omit, attrs) {
        const result = {};
        Object.keys(attrs).forEach((key) => {
            if (omit.indexOf(key) < 0) {
                result[key] = attrs[key];
            }
        });
        return result;
    }

    function Button(props = {}, ...children) {
        const cls = mergeClass('button', props.class);
        const attrs = omitAttrs(['class'], props);
        return (m("button", Object.assign({ class: cls }, attrs),
            m("span", { class: "button__wrapper" }, children)));
    }

    function getUILanguage() {
        return chrome.i18n.getUILanguage();
    }

    const is12H = (new Date()).toLocaleTimeString(getUILanguage()).endsWith('M');

    var ThemeEngines = {
        cssFilter: 'cssFilter',
        svgFilter: 'svgFilter',
        staticTheme: 'staticTheme',
        dynamicTheme: 'dynamicTheme',
    };

    const DEVTOOLS_DOCS_URL = 'https://github.com/alexanderby/darkreader#how-to-contribute';

    function Body({ data, actions }) {
        const { state, setState } = useState({ errorText: null });
        let textNode;
        const wrapper = (data.settings.theme.engine === ThemeEngines.staticTheme
            ? {
                header: 'Static Theme Editor',
                fixesText: data.devStaticThemesText,
                apply: (text) => actions.applyDevStaticThemes(text),
                reset: () => actions.resetDevStaticThemes(),
            } : data.settings.theme.engine === ThemeEngines.cssFilter || data.settings.theme.engine === ThemeEngines.svgFilter ? {
            header: 'Inversion Fix Editor',
            fixesText: data.devInversionFixesText,
            apply: (text) => actions.applyDevInversionFixes(text),
            reset: () => actions.resetDevInversionFixes(),
        } : {
            header: 'Dynamic Theme Editor',
            fixesText: data.devDynamicThemeFixesText,
            apply: (text) => actions.applyDevDynamicThemeFixes(text),
            reset: () => actions.resetDevDynamicThemeFixes(),
        });
        function onTextRender(node) {
            textNode = node;
            if (!state.errorText) {
                textNode.value = wrapper.fixesText;
            }
        }
        async function apply() {
            const text = textNode.value;
            try {
                await wrapper.apply(text);
                setState({ errorText: null });
            }
            catch (err) {
                setState({
                    errorText: String(err),
                });
            }
        }
        function reset() {
            wrapper.reset();
            setState({ errorText: null });
        }
        return (m("body", null,
            m("header", null,
                m("img", { id: "logo", src: "../assets/images/darkreader-type.svg", alt: "Dark Reader" }),
                m("h1", { id: "title" }, "Developer Tools")),
            m("h3", { id: "sub-title" }, wrapper.header),
            m("textarea", { id: "editor", native: true, didmount: onTextRender, didupdate: onTextRender }),
            m("label", { id: "error-text" }, state.errorText),
            m("div", { id: "buttons" },
                m(Button, { onclick: reset }, "Reset"),
                m(Button, { onclick: apply }, "Apply")),
            m("p", { id: "description" },
                "Read about this tool ",
                m("strong", null,
                    m("a", { href: DEVTOOLS_DOCS_URL, target: "_blank" }, "here")),
                ". If a ",
                m("strong", null, "popular"),
                " website looks incorrect e-mail to ",
                m("strong", null, "DarkReaderApp@gmail.com"))));
    }
    var Body$1 = withState(Body);

    class Connector {
        constructor() {
            this.counter = 0;
            this.port = chrome.runtime.connect({ name: 'ui' });
        }
        getRequestId() {
            return ++this.counter;
        }
        sendRequest(request, executor) {
            const id = this.getRequestId();
            return new Promise((resolve, reject) => {
                const listener = ({ id: responseId, ...response }) => {
                    if (responseId === id) {
                        executor(response, resolve, reject);
                        this.port.onMessage.removeListener(listener);
                    }
                };
                this.port.onMessage.addListener(listener);
                this.port.postMessage({ ...request, id });
            });
        }
        getData() {
            return this.sendRequest({ type: 'get-data' }, ({ data }, resolve) => resolve(data));
        }
        getActiveTabInfo() {
            return this.sendRequest({ type: 'get-active-tab-info' }, ({ data }, resolve) => resolve(data));
        }
        subscribeToChanges(callback) {
            const id = this.getRequestId();
            this.port.onMessage.addListener(({ id: responseId, data }) => {
                if (responseId === id) {
                    callback(data);
                }
            });
            this.port.postMessage({ type: 'subscribe-to-changes', id });
        }
        enable() {
            this.port.postMessage({ type: 'enable' });
        }
        disable() {
            this.port.postMessage({ type: 'disable' });
        }
        setShortcut(command, shortcut) {
            this.port.postMessage({ type: 'set-shortcut', data: { command, shortcut } });
        }
        changeSettings(settings) {
            this.port.postMessage({ type: 'change-settings', data: settings });
        }
        setTheme(theme) {
            this.port.postMessage({ type: 'set-theme', data: theme });
        }
        toggleSitePattern(pattern) {
            this.port.postMessage({ type: 'toggle-site-pattern', data: pattern });
        }
        markNewsAsRead(ids) {
            this.port.postMessage({ type: 'mark-news-as-read', data: ids });
        }
        applyDevDynamicThemeFixes(text) {
            return this.sendRequest({ type: 'apply-dev-dynamic-theme-fixes', data: text }, ({ error }, resolve, reject) => error ? reject(error) : resolve());
        }
        resetDevDynamicThemeFixes() {
            this.port.postMessage({ type: 'reset-dev-dynamic-theme-fixes' });
        }
        applyDevInversionFixes(text) {
            return this.sendRequest({ type: 'apply-dev-inversion-fixes', data: text }, ({ error }, resolve, reject) => error ? reject(error) : resolve());
        }
        resetDevInversionFixes() {
            this.port.postMessage({ type: 'reset-dev-inversion-fixes' });
        }
        applyDevStaticThemes(text) {
            return this.sendRequest({ type: 'apply-dev-static-themes', data: text }, ({ error }, resolve, reject) => error ? reject(error) : resolve());
        }
        resetDevStaticThemes() {
            this.port.postMessage({ type: 'reset-dev-static-themes' });
        }
        disconnect() {
            this.port.disconnect();
        }
    }

    function getMockData(override = {}) {
        return Object.assign({
            isEnabled: true,
            isReady: true,
            settings: {
                enabled: true,
                theme: {
                    mode: 1,
                    brightness: 110,
                    contrast: 90,
                    grayscale: 20,
                    sepia: 10,
                    useFont: false,
                    fontFamily: 'Segoe UI',
                    textStroke: 0,
                    engine: 'cssFilter',
                    stylesheet: '',
                },
                customThemes: [],
                siteList: [],
                applyToListedOnly: false,
                changeBrowserTheme: false,
                notifyOfNews: false,
                syncSettings: true,
                automation: '',
                time: {
                    activation: '18:00',
                    deactivation: '9:00',
                },
            },
            fonts: [
                'serif',
                'sans-serif',
                'monospace',
                'cursive',
                'fantasy',
                'system-ui'
            ],
            news: [],
            shortcuts: {
                'addSite': 'Alt+Shift+A',
                'toggle': 'Alt+Shift+D'
            },
            devDynamicThemeFixesText: '',
            devInversionFixesText: '',
            devStaticThemesText: '',
        }, override);
    }
    function getMockActiveTabInfo() {
        return {
            url: 'https://darkreader.org/',
            isProtected: false,
            isInDarkList: false,
        };
    }
    function createConnectorMock() {
        let listener = null;
        const data = getMockData();
        const tab = getMockActiveTabInfo();
        const connector = {
            getData() {
                return Promise.resolve(data);
            },
            getActiveTabInfo() {
                return Promise.resolve(tab);
            },
            subscribeToChanges(callback) {
                listener = callback;
            },
            changeSettings(settings) {
                Object.assign(data.settings, settings);
                listener(data);
            },
            setTheme(theme) {
                Object.assign(data.settings.theme, theme);
                listener(data);
            },
            setShortcut(command, shortcut) {
                Object.assign(data.shortcuts, { [command]: shortcut });
                listener(data);
            },
            toggleSitePattern(pattern) {
                const index = data.settings.siteList.indexOf(pattern);
                if (index >= 0) {
                    data.settings.siteList.splice(pattern, 1);
                }
                else {
                    data.settings.siteList.push(pattern);
                }
                listener(data);
            },
            markNewsAsRead(ids) {
            },
            disconnect() {
            },
        };
        return connector;
    }

    function connect() {
        if (typeof chrome === 'undefined' || !chrome.extension) {
            return createConnectorMock();
        }
        return new Connector();
    }

    function renderBody(data, actions) {
        sync(document.body, m(Body$1, { data: data, actions: actions }));
    }
    async function start() {
        const connector = connect();
        window.addEventListener('unload', (e) => connector.disconnect());
        const data = await connector.getData();
        renderBody(data, connector);
        connector.subscribeToChanges((data) => renderBody(data, connector));
    }
    start();

}());
