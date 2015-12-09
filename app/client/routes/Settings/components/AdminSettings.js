var React = require('react');
import ButtonToolbar from 'react-bootstrap/lib/ButtonToolbar';
import Button from 'react-bootstrap/lib/Button';
import Grid from 'react-bootstrap/lib/Grid';
import Col from 'react-bootstrap/lib/Col';
import Row from 'react-bootstrap/lib/Row';
import CreateNational from './CreateNational';
import EditNational from './EditNational';
import CreateChapter from './CreateChapter';
import EditChapter from './EditChapter';

class AdminSettings extends React.Component {

	constructor(props) {
		super(props);
		this.state = {showCreateNational: false, showEditNational: false, showCreateChapter: false, showEditChapter: false}
		this.handleCreateNational = this.handleCreateNational.bind(this);
		this.handleEditNational = this.handleEditNational.bind(this);
		this.handleCreateChapter = this.handleCreateChapter.bind(this);
		this.handleEditChapter = this.handleEditChapter.bind(this);
		this.closeCreateNational = this.closeCreateNational.bind(this);
		this.closeEditNational = this.closeEditNational.bind(this);
		this.closeCreateChapter = this.closeCreateChapter.bind(this);
		this.closeEditChapter = this.closeEditChapter.bind(this);
	}

	handleCreateNational() {
		this.setState({showCreateNational: true});
	}

	handleEditNational() {
		this.setState({showEditNational: true});
	}

	handleCreateChapter() {
		this.setState({showCreateChapter: true});
	}

	handleEditChapter() {
		this.setState({showEditChapter: true});
	}

	closeCreateNational() {
		this.setState({showCreateNational: false});
	}

	closeEditNational() {
		this.setState({showEditNational: false});
	}

	closeCreateChapter() {
		this.setState({showCreateChapter: false});
	}

	closeEditChapter() {
		this.setState({showEditChapter: false});
	}

	render() {
		return (
			<div>
				<Grid fluid={true}>
					<Row>
						<Col xs={10} xsOffset={1}>
							<ButtonToolbar>
								<Button bsSize="large" onClick={this.handleCreateNational}>Create National</Button>
								<Button bsSize="large" onClick={this.handleEditNational}>Edit National</Button>
								<Button bsSize="large" onClick={this.handleCreateChapter}>Create Chapter</Button>
								<Button bsSize="large" onClick={this.handleEditChapter}>Edit Chapter</Button>
							</ButtonToolbar>
						</Col>
					</Row>
				</Grid>
				<CreateNational show={this.state.showCreateNational} onHide={this.closeCreateNational} />
				<EditNational show={this.state.showEditNational} onHide={this.closeEditNational} />
				<CreateChapter show={this.state.showCreateChapter} onHide={this.closeCreateChapter} />
				<EditChapter show={this.state.showEditChapter} onHide={this.closeEditChapter} />
			</div>
		);
	}
}

export default AdminSettings
