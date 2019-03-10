
![PlayFrame](https://avatars3.githubusercontent.com/u/47147479)
# Router

###### 1kB Trie Router for PlayFrame

## Installation
```sh
npm install --save @playframe/router
```

## Usage
 [WIP]

## Source

    doc = @document
    {isArray} = Array

    NAMED = Symbol 'NAMED'
    WILDCARD = Symbol 'WILD'
    LEAF = Symbol 'LEAF'


    forest = new WeakMap


    _sync = null

    _state = null
    _href = null
    _props = null
    _Page = null

    _404 = => 404
    _fallback = => _Page = _404



    module.exports = view = (sync)=> _sync = sync; (state, l)=>
      _state = state
      {href} = l or= location

      unless href is _href
        set_Page l

      do add_methods unless state._.push

      _props.state = state
      _Page _props


    add_methods = =>
      hop = => _sync.next =>
        set_Page location
        _state._ {}
        _sync.frame => scrollTo 0, 0

      _state._.push = (href)=>
        history.replaceState {height: document.body.clientHeight}, ''
        history.pushState {}, '', href
        do hop

      _state._.replace = (href)=>
        history.replaceState {}, '', href
        do hop


    if doc
      doc.addEventListener(
        if doc.ontouchstart then 'touchstart' else 'click'
        (event)=>
          el = event.composedPath?()[0] or event.target
          el = el.parentNode while el and el.nodeName isnt 'A'

          return if not el or event.button isnt 0 or
            event.metaKey or event.altKey or event.ctrlKey or event.shiftKey or
            el.target is '_blank' or el.origin isnt location.origin or
            el.getAttribute('href').startsWith('#')

          event.preventDefault()

          _state._.push el.href
      )


      addEventListener 'popstate', ({state})=>
        {style} = doc.body
        style.minHeight = "#{state?.height}px"
        set_Page location
        _state._ {}
        setTimeout (=> _sync.render => style.minHeight = ''), 1000



    set_Page = (l)=>
      {href, pathname, search, hash, query} = l
      _href = href
      unless query
        query = {}
        for pair, i in search.slice(1).split '&'
          [k, v] = pair.split '='
          query[k] = v

      match get_trie(_state.routes), pathname
      _props = {_props..., pathname, search, query, hash}
      return



    get_trie = (routes)=>
      unless trie = forest.get routes
        forest.set routes, trie = make_trie routes
      trie



    match = (trie, pathname)=>
      path = pathname.split '/'
      param = {}
      walk_trie param, trie, path, 1, _fallback



    walk_trie = (param, trie, path, position, fallback)=>
      fallback = trie[WILDCARD] or fallback

      if step = path[position]
        if sub_trie = trie[step]
          walk_trie param, sub_trie, path, position + 1, fallback

        else if named = trie[NAMED]
          named param, trie, path, position,
            => fallback param, trie, path, position

        else
          fallback param, trie, path, position

      else if Page = trie[LEAF]
        _props = {param}
        _Page = Page

      else
        fallback param, trie, path, position

      return



    make_trie = (routes)=>
      trie = {}
      for k, v of routes
        route = k.split '/'

        pos = 0
        if route[1]? and not route[0]
          pos = 1

        if typeof v is 'object'
          # Nested router
          Object.assign grow_trie(trie, route, pos), get_trie v

        else # function Page
          grow_trie trie, route, pos, v

      trie



    grow_trie = (trie, route, position, Page)=>
      if step = route[position]
        first_char = step.charCodeAt 0
        if first_char is 58 # starts with `:`
          name = step.slice 1
          named_trie = trie[NAMED] or= (param, trie, path, position, fallback)=>
            fallback = trie[WILDCARD] or fallback
            param = {param...}
            param[name] = path[position]
            walk_trie param, named_trie, path, position + 1, fallback
            return

          grow_trie named_trie, route, position + 1, Page

        else if first_char is 42 # starts with `*`
          trie[WILDCARD] = (param, trie, path, position)=>
            wild = path.slice position
            _props = {param, wild}
            _Page = Page
            return

          trie

        else
          grow_trie (trie[step] or= {}), route, position + 1, Page

      else
        trie[LEAF] = Page if Page

        trie
