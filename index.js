// Generated by CoffeeScript 2.3.2
// ![PlayFrame](https://avatars3.githubusercontent.com/u/47147479)
// # Router

// ###### 1kB Trie Router for PlayFrame

// ## Installation
// ```sh
// npm install --save @playframe/router
// ```

// ## Usage
// ```js
// import {h, app, route, mount, Component} from '@playframe/playframe'

// route({
//   counter: 1,
//   _: {
//     inc: (e, state)=> state.counter++,
//     dec: (e, state)=> state.counter--
//   },
//   routes: {
//     '/': ({state})=> <a href="/hello/world"><h1>Link</h1></a>,
//     '/counter': ({state})=> CounterView(state),
//     '/hello/:name': ({state, param})=> <h1>Hello {param.name}!</h1>,
//     '/*': ()=>  <h1>404</h1>
//   }
// })(
//   mount(document.body)
// )
// ```

// ## Source
var LEAF, NAMED, WILDCARD, _404, _Page, _fallback, _href, _props, _state, _subscribed, _sync, add_methods, doc, forest, get_trie, grow_trie, isArray, make_trie, match, set_Page, subscribe, view, walk_trie;

doc = this.document;

({isArray} = Array);

NAMED = Symbol('NAMED');

WILDCARD = Symbol('WILD');

LEAF = Symbol('LEAF');

forest = new WeakMap;

_sync = null;

_state = null;

_href = null;

_props = null;

_Page = null;

_subscribed = false;

_404 = () => {
  return 404;
};

_fallback = () => {
  return _Page = _404;
};

module.exports = view = (sync) => {
  _sync = sync;
  return (state, l) => {
    var href;
    _state = state;
    ({href} = l || (l = location));
    if (!_subscribed && doc) {
      subscribe();
      _subscribed = true;
    }
    if (href !== _href) {
      set_Page(l);
    }
    if (!state._.push) {
      add_methods();
    }
    _props.state = state;
    return _Page(_props);
  };
};

add_methods = () => {
  var hop;
  hop = () => {
    return _sync.next(() => {
      set_Page(location);
      _state._({});
      _sync.frame(() => {
        return scrollTo(0, 0);
      });
    });
  };
  _state._.push = (href) => {
    history.replaceState({
      height: document.body.clientHeight
    }, '');
    history.pushState({}, '', href);
    hop();
  };
  _state._.replace = (href) => {
    history.replaceState({}, '', href);
    hop();
  };
};

subscribe = () => {
  doc.addEventListener(doc.ontouchstart ? 'touchstart' : 'click', (event) => {
    var el;
    el = (typeof event.composedPath === "function" ? event.composedPath()[0] : void 0) || event.target;
    while (el && el.nodeName !== 'A') {
      el = el.parentNode;
    }
    if (!el || event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey || el.target === '_blank' || el.origin !== location.origin || el.getAttribute('href').startsWith('#')) {
      return;
    }
    event.preventDefault();
    return _state._.push(el.href);
  });
  addEventListener('popstate', ({state}) => {
    var style;
    ({style} = doc.body);
    style.minHeight = `${(state != null ? state.height : void 0)}px`;
    set_Page(location);
    _state._({});
    return setTimeout((() => {
      return _sync.render(() => {
        return style.minHeight = '';
      });
    }), 1000);
  });
};

set_Page = (l) => {
  var hash, href, i, j, k, len, pair, pathname, query, ref, search, v;
  ({href, pathname, search, hash, query} = l);
  _href = href;
  if (!query) {
    query = {};
    ref = search.slice(1).split('&');
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      pair = ref[i];
      [k, v] = pair.split('=');
      query[k] = v;
    }
  }
  match(get_trie(_state.routes), pathname);
  _props = {..._props, pathname, search, query, hash};
};

get_trie = (routes) => {
  var trie;
  if (!(trie = forest.get(routes))) {
    forest.set(routes, trie = make_trie(routes));
  }
  return trie;
};

match = (trie, pathname) => {
  var param, path;
  path = pathname.split('/');
  param = {};
  return walk_trie(param, trie, path, 1, _fallback);
};

walk_trie = (param, trie, path, position, fallback) => {
  var Page, named, step, sub_trie;
  fallback = trie[WILDCARD] || fallback;
  if (step = path[position]) {
    if (sub_trie = trie[step]) {
      walk_trie(param, sub_trie, path, position + 1, fallback);
    } else if (named = trie[NAMED]) {
      named(param, trie, path, position, () => {
        return fallback(param, trie, path, position);
      });
    } else {
      fallback(param, trie, path, position);
    }
  } else if (Page = trie[LEAF]) {
    _props = {param};
    _Page = Page;
  } else {
    fallback(param, trie, path, position);
  }
};

make_trie = (routes) => {
  var k, pos, route, trie, v;
  trie = {};
  for (k in routes) {
    v = routes[k];
    route = k.split('/');
    pos = 0;
    if ((route[1] != null) && !route[0]) {
      pos = 1;
    }
    if (typeof v === 'object') {
      // Nested router
      Object.assign(grow_trie(trie, route, pos), get_trie(v)); // function Page
    } else {
      grow_trie(trie, route, pos, v);
    }
  }
  return trie;
};

grow_trie = (trie, route, position, Page) => {
  var first_char, name, named_trie, step;
  if (step = route[position]) {
    first_char = step.charCodeAt(0);
    if (first_char === 58) { // starts with `:`
      name = step.slice(1);
      named_trie = trie[NAMED] || (trie[NAMED] = (param, trie, path, position, fallback) => {
        fallback = trie[WILDCARD] || fallback;
        param = {...param};
        param[name] = path[position];
        walk_trie(param, named_trie, path, position + 1, fallback);
      });
      return grow_trie(named_trie, route, position + 1, Page);
    } else if (first_char === 42) { // starts with `*`
      trie[WILDCARD] = (param, trie, path, position) => {
        var wild;
        wild = path.slice(position);
        _props = {param, wild};
        _Page = Page;
      };
      return trie;
    } else {
      return grow_trie((trie[step] || (trie[step] = {})), route, position + 1, Page);
    }
  } else {
    if (Page) {
      trie[LEAF] = Page;
    }
    return trie;
  }
};
