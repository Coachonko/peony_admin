# TODO

- Ensure when fetch gets error 401 responses, remove token from localStorage and redirect.
- Consider checking token `exp` before sending requests to the server
  Why: Solves problems related to expired tokens (it does not handle invalidated tokens).
  Problem: Tokens are currently malformed [Coachonko/sessions #1](https://github.com/Coachonko/sessions/issues/1)
- Consider adding server-side rendering and hydration with inferno-server and inferno-hydrate.
  Why: SEO is not a problem, but it improves the time to first render.
  Blocking: localStorage is not available on first request, only routes that could be rendered on the 
  server are `/login` and NoMatch.
  Solution: API route with tinyhttp, put jwt into cookie and give to client.
- Editor should upload images to Garage, needs a gallery extension for showcases of many pictures.
- Responsiveness
- Accessibility