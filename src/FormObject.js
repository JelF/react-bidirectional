// @flow

/*
 * Core of bi-directional binding.
 * It acts like angular scopes, but in different maner
 * In general, you have to instance it in form component and
 * mount it like
 * formObject.watch([], model => this.setState({ model: model }))
 * then you can pass it into inputs (as a prop) using `fieldset` api,
 * so they could use get and set on given fieldset
 *
 * TODO: allow values defaulting
 */

class FormObject {
  model: any
  _callbacks: { [string]: Array<Function> }
  _fieldsets: { [string]: FormObject }

  constructor(model: any) {
    this.model = model
    this._callbacks = {}
    this._fieldsets = {}
  }

  get(path: string | Array<string>) {
    return this._parsePath(path).reduce(this.model, (x, acc) => acc[x])
  }

  set(path: string | Array<string>, value: any) {
    const parsedPath = this._parsePath(path)

    if (parsedPath == []) {
      this.model = value
    } else {
      const object = parsedPath.slice(0, -1).reduce(this.model, (x, acc) => acc[x])
      object[parsedPath[parsedPath.length - 1]] = value
    }

    this._runCallbacks(parsedPath)
  }

  watch(path: string | Array<string>, callback: Function) {
    const joinedPath = (typeof path === "string") ? path : path.join(".")
    if (!(joinedPath in this._callbacks)) { this._callbacks[joinedPath] = [] }
    this._callbacks[joinedPath].push(callback)
  }

  fieldset(path: string) {
    const parsedPath = this._parsePath(path)
    const joinedPath = parsedPath.join(".")
    if (joinedPath in this._fieldsets) { return this._fieldsets[joinedPath] }

    const result = new FormObject(this.get(parsedPath))
    this._fieldsets[joinedPath] = result
    result.watch([], update => this.set(parsedPath, update))
    this.watch(joinedPath, update => result.set(update))
    return result
  }

  _parsePath(path: string | Array<string>) {
    return (typeof path === "string") ? (path.split('.')) : path
  }

  _runCallbacks(path: Array<string>) {
    const joinedPath = path.join(".")
    const newValue = this.get(path)
    
    this._callbacks.entries.forEach(([callbacks, callbackPath]) => {
      if (~callbackPath.indexOf(joinedPath) || ~joinedPath.indexOf(callbackPath)) {
        callbacks.forEach(callback => callback(newValue))
      }
    })
  }
}
