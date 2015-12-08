module.exports = {
  path: 'app',
  getComponent(location, cb) {
    require.ensure([], (require) => {
      cb(null, require('./components/App'))
    })
  }
}