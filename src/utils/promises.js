export class CancelError extends Error {
  constructor (message) {
    super(message)
    this.name = 'CancelError'
  }
}

// makeCancelable turns a promise into a cancelable promise.
// It can be used to prevent accidental state updates of unmounted components.
export function makeCancelable (promise) {
  let hasCanceled = false

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      val => hasCanceled ? reject(new CancelError('Promise was canceled')) : resolve(val),
      error => hasCanceled ? reject(new CancelError('Promise was canceled')) : reject(error)
    )
  })

  return {
    promise: wrappedPromise,
    cancel () {
      hasCanceled = true
    }
  }
};
