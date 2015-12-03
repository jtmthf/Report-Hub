module.exports = {
  path: 'register',
  getComponent(location, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/Register'))
    })
  }
}