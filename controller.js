const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const dbFile = './library.db';

app.use(bodyParser.json());

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to the SQLite database');
  }
});

async function withDb(callback) {
  return new Promise((resolve, reject) => {
    callback(resolve, reject);
  });
}

app.get('/books', async (req, res) => {
  try {
    const books = await withDb((resolve, reject) => {
      db.all('SELECT * FROM books', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    res.json(books);
  } catch (error) {
    console.error('Error retrieving books:', error);
    res.status(500).send('Server error');
  }
});

app.get('/books/isbn/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    const book = await withDb((resolve, reject) => {
      db.get('SELECT * FROM books WHERE isbn = ?', [isbn], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    if (book) {
      res.json(book);
    } else {
      res.status(404).send('Book with the specified ISBN not found');
    }
  } catch (error) {
    console.error('Error finding book by ISBN:', error);
    res.status(500).send('Server error');
  }
});

app.get('/books/author/:author', async (req, res) => {
    const { author } = req.params;
    try {
      const books = await withDb((resolve, reject) => {
        db.all('SELECT * FROM books WHERE author LIKE ?', [`%${author}%`], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
      if (books.length > 0) {
        res.json(books);
      } else {
        res.status(404).send('No books found for the specified author');
      }
    } catch (error) {
      console.error('Error finding books by author:', error);
      res.status(500).send('Server error');
    }
  });
  

app.get('/books/title/:title', async (req, res) => {
  const { title } = req.params;
  try {
    const books = await withDb((resolve, reject) => {
      db.all('SELECT * FROM books WHERE title LIKE ?', [`%${title}%`], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
    if (books.length > 0) {
      res.json(books);
    } else {
      res.status(404).send('No books found with the specified title');
    }
  } catch (error) {
    console.error('Error finding books by title:', error);
    res.status(500).send('Server error');
  }
});

app.get('/books/review/:isbn', async (req, res) => {
  const { isbn } = req.params;
  try {
    const book = await withDb((resolve, reject) => {
      db.get('SELECT review FROM books WHERE isbn = ?', [isbn], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    if (book && book.review) {
      res.json({ isbn, review: book.review });
    } else {
      res.status(404).send('Review for the specified ISBN not found');
    }
  } catch (error) {
    console.error('Error retrieving book review:', error);
    res.status(500).send('Server error');
  }
});

app.post('/users/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }
  try {
    const result = await withDb((resolve, reject) => {
      db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });
    res.status(201).send({ message: 'User registered successfully', userId: result });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Server error');
  }
});

app.post('/users/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }
  try {
    const user = await withDb((resolve, reject) => {
      db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    if (user) {
      res.json({ message: 'Login successful', username: user.username });
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
