import React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'

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
	<Router routes={rootRoute} />,
	document.getElementById('content')
)