const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db/carservice.db');

const nomenclature = [
  { id: 10, name: 'Моторное масло 5W-40 (1л)', desc: 'Синтетическое масло для ТО', qty: 100, price: 1200 },
  { id: 11, name: 'Тормозные колодки (передние)', desc: 'Комплект передних колодок', qty: 50, price: 2500 },
  { id: 12, name: 'Тормозные колодки (задние)', desc: 'Комплект задних колодок', qty: 50, price: 1800 },
  { id: 13, name: 'Фильтр воздушный', desc: 'Элемент фильтрующий воздуха', qty: 80, price: 600 },
  { id: 14, name: 'Фильтр салонный', desc: 'Фильтр кондиционера', qty: 80, price: 850 },
  { id: 15, name: 'Фильтр топливный', desc: 'Фильтр тонкой очистки топлива', qty: 40, price: 1100 },
  { id: 16, name: 'Свечи зажигания (к-кт)', desc: 'Набор для 4-цилиндрового двигателя', qty: 60, price: 2200 },
  { id: 17, name: 'Антифриз G12 (1л)', desc: 'Охлаждающая жидкость', qty: 100, price: 550 },
  { id: 18, name: 'Батарейка CR2032', desc: 'Для ключа зажигания', qty: 200, price: 150 },
  { id: 19, name: 'Фреон R134a (100г)', desc: 'Для заправки кондиционера', qty: 500, price: 450 },
  { id: 20, name: 'Очиститель салона', desc: 'Химия для детейлинга', qty: 30, price: 700 },
  { id: 21, name: 'Омывающая жидкость (5л)', desc: 'Зимняя омывайка', qty: 150, price: 350 },
  { id: 22, name: 'Аккумулятор 60Ah', desc: 'Стартерная батарея', qty: 20, price: 6500 },
  { id: 23, name: 'Тормозная жидкость DOT4', desc: '0.5л', qty: 50, price: 400 }
];

db.serialize(() => {
  const stmt = db.prepare("INSERT OR REPLACE INTO Inventory (inventory_id, inventory_name, inventory_discription, quantity_in_stock, inventory_price) VALUES (?, ?, ?, ?, ?)");
  
  nomenclature.forEach(item => {
    stmt.run(item.id, item.name, item.desc, item.qty.toString(), item.price.toString(), (err) => {
      if (err) console.error(`Error inserting item ${item.id}:`, err);
    });
  });
  
  stmt.finalize((err) => {
    if (err) {
      console.error("Error finalizing statement:", err);
    } else {
      console.log("Nomenclature successfully updated.");
    }
    db.close((err) => {
      if (err) console.error("Error closing database:", err);
      process.exit(err ? 1 : 0);
    });
  });
});
