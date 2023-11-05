# TODO

- Ensure when fetch gets error 401 responses, remove token from localStorage and redirect.
- Use async/await instead of `.then`.
  Why: More readable.
  Problem: Async event handlers could try to change an unmounted component. Use makeCancelable.
  Problem: Lifecycle methods need to check if component still mounted before setState.
- Consider checking token `exp` before sending requests to the server
  Why: Solves problems related to expired tokens (it does not handle invalidated tokens).
  Problem: Tokens are currently malformed [Coachonko/sessions #1](https://github.com/Coachonko/sessions/issues/1)
- Consider adding server-side rendering and hydration with inferno-server and inferno-hydrate.
  Why: SEO is not a problem, but it improves the time to first render.
  Blocking: localStorage is not available on first request, only routes that could be rendered on the 
  server are `/login` and NoMatch.
