import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { createHistory, useBasename } from 'history'

const history = useBasename(createHistory)();


const rootRoute = {
	component: 'div',
	childRoutes: [{
		path: '/',
		component: require('./components/Nav'),
		childRoutes: [
			require('./routes/Register'),
			require('./routes/Login'),
			require('./routes/App')
		]
	}]
};

render(
	<Router history={history} routes={rootRoute} />,
	document.getElementById('content')
)