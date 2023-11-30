# Contributing

Please follow these standards

## Git workflow

1. Fork the project and clone your fork to your development environment
2. Add the original repository as an additional git remote called "upstream"
3. Create a new branch
  - The branch called production is the branch that goes live
  - The branch called master is the branch used for development
  - Feature (feat_) branches are branched off and then merged into master once features are bug-free
  - Release (rele_) branches are branched off master and then merged into production
  - Bug fix (bugf_) branches are branched off production and then merged into both production, release 
  and master

4. Write your code, test it and make sure it works
5. Commit your changes
6. Pull the latest code from upstream into your branch 

  Make sure your changes do not conflict with the original repository.

7. Push changes to the remote "origin" (your repository)
8. Create a pull request
  - If the pull request addresses an issue, tag the related issue

## Code standards

- Comment code when needed. Is it obvious why it is written this way?
- Higher-order components names and filenames are prefixed with `with`.
- If a component needs lifecycle events, use class components.
- Only use the following lifecycle events: 
  - `componentDidMount`
  - `componentDidUpdate`
  - `componentWillUnmount`
  - `shouldComponentUpdate`
- Use async/await instead of promise methods.
- Fetch should always return the response object or an error object in case of error:
  - When fetch returns an PeonyError, that is stored in the component state as peonyError.
  - When fetch encounters an error, the error is stored in the state as lastError.
