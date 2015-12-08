var React = require('react');
var Infinite = require('react-infinite');

class App extends React.Component {

	constructor(props) {
		super(props);
		this.state = {isInfiniteLoading: false, elements: this.buildElements(0, 20)};
	}	

	buildElements(start, end) {

	}

	handleInfiniteLoad() {

	}

	elementInfiniteLoad() {

	}

	isInfiniteLoading() {

	}

	render() {
		return (
			<div>
				<Infinite elementHeight={60}
                        useWindowAsScrollContainer                         
                        infiniteLoadingBeginBottomOffset={200}
                        onInfiniteLoad={this.handleInfiniteLoad}
                        loadingSpinnerDelegate={this.elementInfiniteLoad()}
                        isInfiniteLoading={this.state.isInfiniteLoading}
                        >
            		{this.state.elements}
        		</Infinite>;
			</div>
		);
	}
}

module.exports = App