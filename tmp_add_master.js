const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'db', 'carservice.db');
const db = new sqlite3.Database(dbPath);

const email = 'master@mail.ru';
const password = '12345';
const role = 'master';
const firstName = 'Главный';
const lastName = 'Мастер';
const phone = '70000000000';

async function addMaster() {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      "INSERT INTO Employes (first_name, last_name, email, phone, password, role, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, DATE('now'), 'active')",
      [firstName, lastName, email, phone, hashedPassword, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            console.log('Пользователь с таким email уже существует.');
          } else {
            console.error('Ошибка при добавлении мастера:', err.message);
          }
        } else {
          console.log(`Мастер успешно добавлен! ID: ${this.lastID}`);
        }
        db.close();
      }
    );
  } catch (error) {
    console.error('Ошибка:', error);
    db.close();
  }
}

addMaster();
