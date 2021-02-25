import { Analytics, Context, Plugin } from '@segment/analytics-next'
import * as jsdom from 'jsdom'
import browserPluginsDestination from '../..'
import { Subscription } from '../../../../lib/browser-destinations'
import { browserDestinationPlugin } from '../../../../runtime'

expect.extend({
  toBeWithinOneSecondOf(got, expected) {
    if (typeof got === 'string') {
      got = parseInt(got, 10)
    }

    if (typeof expected === 'string') {
      got = parseInt(expected, 10)
    }

    const oneSecond = 1000

    const timeDiff = Math.abs(expected - got)
    const timeDiffInSeconds = timeDiff / 1000

    const pass = timeDiff < oneSecond
    const message = () =>
      `${got} should be within a second of ${expected}, ` + `actual difference: ${timeDiffInSeconds.toFixed(1)}s`

    return { pass, message }
  }
})

const example: Subscription[] = [
  {
    partnerAction: 'sessionId',
    name: 'SessionId',
    enabled: true,
    subscribe: 'type = "track"',
    mapping: {}
  }
]

let browserActions: Record<string, Plugin>
let ajs: Analytics

beforeEach(async () => {
  jest.restoreAllMocks()
  jest.resetAllMocks()

  const html = `
  <!DOCTYPE html>
    <head>
      <script>'hi'</script>
    </head>
    <body>
    </body>
  </html>
  `.trim()

  const jsd = new jsdom.JSDOM(html, {
    runScripts: 'dangerously',
    resources: 'usable',
    url: 'https://localhost'
  })

  const windowSpy = jest.spyOn(global, 'window', 'get')
  windowSpy.mockImplementation(() => (jsd.window as unknown) as Window & typeof globalThis)

  browserActions = browserDestinationPlugin(browserPluginsDestination, {}, example)

  ajs = new Analytics({
    writeKey: 'w_123'
  })
})

describe('ajs-integration', () => {
  test('updates the original event with a session id', async () => {
    await browserActions.sessionId.load(Context.system(), ajs)

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    const updatedCtx = await browserActions.sessionId.track?.(ctx)
    // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
    expect(updatedCtx?.event.integrations?.Amplitude?.session_id).not.toBeUndefined()
  })

  test('runs as an enrichment middleware', async () => {
    await ajs.register(browserActions.sessionId)
    jest.spyOn(browserActions.sessionId, 'track')

    const ctx = new Context({
      type: 'track',
      event: 'greet',
      properties: {
        greeting: 'Oi!'
      }
    })

    await ajs.track(ctx.event)

    expect(browserActions.sessionId.track).toHaveBeenCalled()
    expect(ajs.queue.plugins.map((p) => ({ name: p.name, type: p.type }))).toMatchInlineSnapshot(`
      Array [
        Object {
          "name": "Amplitude Browser Plugins sessionId",
          "type": "enrichment",
        },
      ]
    `)
  })
})

describe('sessoinId', () => {
  beforeEach(async () => {
    jest.useFakeTimers()
    await browserActions.sessionId.load(Context.system(), ajs)
  })

  const id = () => new Date().getTime()

  describe('new sessions', () => {
    test('sets a session id', async () => {
      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await browserActions.sessionId.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations?.Amplitude?.session_id).toBeWithinOneSecondOf(id())
    })

    test('persists the session id', async () => {
      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      await browserActions.sessionId.track?.(ctx)

      expect(window.localStorage.getItem('analytics_session_id')).toBeWithinOneSecondOf(id().toString())
      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(id().toString())
    })
  })

  describe('existing sessions', () => {
    test('uses an existing session id', async () => {
      const then = id()
      jest.advanceTimersByTime(10000)

      window.localStorage.setItem('analytics_session_id', then.toString())

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await browserActions.sessionId.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations?.Amplitude?.session_id).toBeWithinOneSecondOf(then)
    })

    test('keeps track of when the session was last accessed', async () => {
      const then = id()
      jest.advanceTimersByTime(10000)
      window.localStorage.setItem('analytics_session_id', then.toString())

      const now = id()

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await browserActions.sessionId.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations?.Amplitude?.session_id).toBeWithinOneSecondOf(then)

      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(now)
    })

    test('reset session when stale', async () => {
      const then = id()
      window.localStorage.setItem('analytics_session_id.last_access', then.toString())
      window.localStorage.setItem('analytics_session_id', then.toString())

      const THIRTY_MINUTES = 30 * 60000
      jest.advanceTimersByTime(THIRTY_MINUTES)

      const now = id()

      const ctx = new Context({
        type: 'track',
        event: 'greet',
        properties: {
          greeting: 'Oi!'
        }
      })

      const updatedCtx = await browserActions.sessionId.track?.(ctx)
      // @ts-expect-error Need to fix ajs-next types to allow for complex objects in `integrations`
      expect(updatedCtx?.event.integrations?.Amplitude?.session_id).toBeWithinOneSecondOf(now)

      expect(window.localStorage.getItem('analytics_session_id')).toBeWithinOneSecondOf(now.toString())
      expect(window.localStorage.getItem('analytics_session_id.last_access')).toBeWithinOneSecondOf(now.toString())
    })
  })
})