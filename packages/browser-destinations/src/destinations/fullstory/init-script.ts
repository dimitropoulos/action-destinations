/* eslint-disable */
// @ts-nocheck
export function initScript({ debug, org }) {
  window._fs_debug = debug
  window._fs_host = 'fullstory.com'
  window._fs_script = 'edge.fullstory.com/s/fs.js'
  window._fs_org = org
  window._fs_namespace = 'FS'

  /* eslint-disable */
  /* istanbul ignore next */
  /* The snippet below differs slightly from the snippet available on fullstory.com because fs.js is already loaded above*/
  ;(function (m, n, e, t, l, o, g, y) {
    if (e in m) {
      if (m.console && m.console.log) {
        m.console.log('FullStory namespace conflict. Please set window["_fs_namespace"].')
      }
      return
    }
    g = m[e] = function (a, b, s) {
      g.q ? g.q.push([a, b, s]) : g._api(a, b, s)
    }
    g.q = []
    g.identify = function (i, v, s) {
      g(l, { uid: i }, s)
      if (v) g(l, v, s)
    }
    g.setUserVars = function (v, s) {
      g(l, v, s)
    }
    g.event = function (i, v, s) {
      g('event', { n: i, p: v }, s)
    }
    g.anonymize = function () {
      g.identify(!!0)
    }
    g.shutdown = function () {
      g('rec', !1)
    }
    g.restart = function () {
      g('rec', !0)
    }
    g.log = function (a, b) {
      g('log', [a, b])
    }
    g.consent = function (a) {
      g('consent', !arguments.length || a)
    }
    g.identifyAccount = function (i, v) {
      o = 'account'
      v = v || {}
      v.acctId = i
      g(o, v)
    }
    g.clearUserCookie = function () {}
    g.setVars = function (n, p) {
      g('setVars', [n, p])
    }
    g._w = {}
    y = 'XMLHttpRequest'
    g._w[y] = m[y]
    y = 'fetch'
    g._w[y] = m[y]
    if (m[y])
      m[y] = function () {
        return g._w[y].apply(this, arguments)
      }
    g._v = '1.3.0'
  })(window, document, window['_fs_namespace'], 'script', 'user')
}
