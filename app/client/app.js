import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { createHistory, useBasename } from 'history'

const history = useBasename(createHistory)();


const rootRoute = {
	component: 'div',
	childRoutes: [{
		path: '/',
		component: require('./components/App'),
		indexRoute: require('./components/Welcome'),
		childRoutes: [
			require('./routes/Register')
		]
	}]
};

render(
	<Router history={history} routes={rootRoute} />,
	document.getElementById('content')
)