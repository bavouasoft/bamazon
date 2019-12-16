-- USE bamazon_db;
CREATE TABLE products (
	item_id INT NOT NULL AUTO_INCREMENT,
	product_name VARCHAR(50) NOT NULL,
	department_id INT(11) NOT NULL,
	price DECIMAL(10, 2) NOT NULL,
	stock_quantity INT(13) NOT NULL,
	PRIMARY KEY (item_id)
);