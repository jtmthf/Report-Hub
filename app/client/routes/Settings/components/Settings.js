var React = require('react');
import Tabs from 'react-bootstrap/lib/Tabs';
import Tab from 'react-bootstrap/lib/Tab';
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Panel from 'react-bootstrap/lib/Panel';
import AdminSettings from './AdminSettings';
import MySettings from './MySettings';


class Settings extends React.Component {

	constructor(props) {
		super(props);
		this.handleSelect = this.handleSelect.bind(this);
		this.state = {key: 'mine'};
	}

	handleSelect(key) {
		this.setState({key: key});
	}	

	render() {
		return (
			<Grid fluid={true}>
				<Col xs={12} md={10} mdOffset={1}>
					<Panel>
						<Grid fluid={true}>
							<Tabs activeKey={this.state.key} onSelect={this.handleSelect}>
								<Tab eventKey="mine" title="My Settings"><AdminSettings /></Tab>
								<Tab eventKey="admin" title="Admin Settings"><MySettings /></Tab>
							</Tabs>
						</Grid>
					</Panel>
				</Col> 
			</Grid>
		);
	}
}

module.exports = Settings