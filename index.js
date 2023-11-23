const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('views'));
app.use(express.urlencoded({ extended: true }));

const upload = multer({ dest: 'uploads/' });
const db = new sqlite3.Database(process.env.DB_PATH || 'transactions.db');


db.serialize(() => {
  db.run('CREATE TABLE IF NOT EXISTS transactions (producer TEXT, affiliate TEXT, value REAL)');
});

app.get('/', (req, res) => {
  res.render('upload', { transactions: {} });
});

app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = req.file.path;

  // Implement logic to process the 'sales.txt' file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the file:', err);
      res.status(500).send('Error processing the file.');
      return;
    }

    // Parse data and insert into the database
    const transactions = parseFileData(data);
    insertIntoDatabase(transactions);

    res.redirect('/transactions');
  });
});

app.get('/transactions', (req, res) => {
  // Implement logic to fetch transactions from the database
  db.all('SELECT * FROM transactions', (err, rows) => {
    if (err) {
      console.error('Error fetching transactions from the database:', err);
      res.status(500).send('Error fetching transactions.');
      return;
    }

    res.render('transactions', { transactions: rows });
  });
});

function parseFileData(data) {
  // Implement logic to parse the data from the file and return an array of transactions
  const lines = data.split('\n');
  const transactions = lines.map(line => {
    const [producer, affiliate, value] = line.split(',');
    return { producer, affiliate, value: parseFloat(value) };
  });

  return transactions;
}

function insertIntoDatabase(transactions) {
  // Implement logic to insert transactions into the database
  const stmt = db.prepare('INSERT INTO transactions VALUES (?, ?, ?)');
  transactions.forEach(transaction => {
    stmt.run(transaction.producer, transaction.affiliate, transaction.value);
  });
  stmt.finalize();
}

app.listen(port, () => {
  console.log(`Server listening at http://127.0.0.1:${port}/`);
});