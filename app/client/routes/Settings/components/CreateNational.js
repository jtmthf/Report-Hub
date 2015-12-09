var React = require('react');
import Modal from 'react-bootstrap/lib/Modal'
import Button from 'react-bootstrap/lib/Button'
import Input from 'react-bootstrap/lib/Input'

class CreateNational extends React.Component {

	constructor(props) {
		super(props);
	}

	// POST api/national
	handleSubmit() {

	}

	render() {
		return (
			<Modal {...this.props}>
				<Modal.Header closeButton>
					<Modal.Title>Create National Organization</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<h4>Here we go!</h4>
				</Modal.Body>
				<Modal.Footer>
					<Button onClick={this.handleSubmit}>Create</Button>
					<Button onClick={this.props.onHide}>Close</Button>
				</Modal.Footer>
			</Modal>
		);
	}
}

module.exports = CreateNational;