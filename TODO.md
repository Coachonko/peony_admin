# TODO

## Functionality

- Monorepo: add an utils package for storefront frontend developers.
- Display app errors and messages using the Alerts component/
  - lift all peonyError and lastError states to App?
- Replace jodit editor with something better.

## Bugs

- `You tried to redirect to the same route you're currently on: "/posts/post/075c60c2-dd1f-a002-d43b-4d8866808785undefined"` when saving a new post.

## Style

- Responsiveness
- Accessibility
- Style elements uniformly. Global app styles go in `App.less`
- Fix warnings:
  - Buttons must have text
- Fix bugs:
  - Tables move when they shouldn't
  - `userMenu` should toggle off when clicking on a link or outside of it.