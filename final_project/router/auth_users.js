const express = require('express');
const jwt = require('jsonwebtoken');
let books = require('./booksdb.js');
const regd_users = express.Router();

let users = [];

const isValid = (username) => {
	return users.filter((user) => user.username === username).length > 0;
};

const authenticatedUser = (username, password) => {
	return (
		users.filter(
			(user) => user.username === username && user.password === password
		).length > 0
	);
};

//only registered users can login
regd_users.post('/login', (req, res) => {
	const { username, password } = req.body;

	if (!username || !password) {
		return res
			.status(400)
			.json({ message: 'Username and password are required' });
	}

	if (!authenticatedUser(username, password)) {
		return res.status(401).json({ message: 'Invalid username or password' });
	}

	let accessToken = jwt.sign({ data: password }, 'access', {
		expiresIn: 60 * 60,
	});

	req.session.authorization = {
		accessToken,
		username,
	};

	return res.status(200).json({ message: 'User successfully logged in' });
});

// Add a book review
/**
 * Requirements:
 * 1. Review text comes from req.query.review
 * 2. Username comes from req.session.authorization.username
 * 3. Review goes into books[isbn].reviews[username]
 * 4. If user already reviewed the same book → overwrite
 * 5. If not → create new
 * 6. If book doesn’t exist → return 404
 * 7. Must respond with a proper success message
 *
 */
regd_users.put('/auth/review/:isbn', (req, res) => {
	const isbn = req.params.isbn;
	const review = req.query.review;
	const username = req.session.authorization.username;

	if (!username) {
		return res.status(403).json({ message: 'User not logged in' });
	}

	if (!review) {
		return res
			.status(400)
			.json({ message: 'Review required as query parameter' });
	}

	let book = books[isbn];
	if (!book) {
		return res.status(404).json({ message: 'Book not found' });
	}

	book.reviews[username] = review;

	return res
		.status(200)
		.json({
			message: 'Review added/updated successfully',
			reviews: book.reviews,
		});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
