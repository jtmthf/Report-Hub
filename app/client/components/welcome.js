var React = require('react');
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Jumbotron from 'react-bootstrap/lib/Jumbotron'


class Welcome extends React.Component {
	constructor(props) {
		super(props)
		this.backGroundStyle = {
			backgroundImage: 'url(img/welcome.jpg)',
			height: '100vh'
		}
	}

	render() {
		return (
			<Grid fluid={true} style={this.backGroundStyle}>
				<Jumbotron style={{marginTop: 200, borderRadius: 25, backgroundColor: 'rgba(52,73,94,0.74)'}}>
					<h1 className="text-center" style={{color: 'white'}}>STREAMLINE YOUR CHAPTER REPORTING.</h1>
				</Jumbotron>
			</Grid>
		);
	}

}

module.exports = Welcome;