let mysql = require("mysql");
let Table = require("cli-table");
let inquirer = require("inquirer");
let colors = require('colors');
         //where my password is stored

let connection = mysql.createConnection({
    host     : 'localhost',
    port     : 3306,
    user     : 'root',                      //change to your user name if it is not root
    password : "",          //change to your password or set up a keys.js file
    database : 'bamazon_db'                    //import schema.sql & schema-seeds.sql to have the bamazon db.
});

let orderTotal = 0;

connection.connect(function(err) {          //set up connection
    if (err) throw err;
    //console.log("connected as id " + connection.threadId);
});



//Display a table of current items available
function displayTable() {
    console.log(colors.yellow("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Bamazon~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"));
    connection.query('SELECT * FROM products', function(err, results) {  //query all from the products table
            if (err) throw err;
            let table = new Table({   // create table from cli-table npm
                head: [('id'), ('item'), ('price'), ('quantity')],
                colWidths: [4, 60, 13, 10]
            });
            for (let i = 0; i < results.length; i++){   //loop through all records IN the db table
            table.push(   //push each record from the bd table to the cli table
                [(JSON.parse(JSON.stringify(results))[i]["item_id"]), (JSON.parse(JSON.stringify(results))[i]["product_name"]),
                ("$ "+JSON.parse(JSON.stringify(results))[i]["price"]), (JSON.parse(JSON.stringify(results))[i]["stock_quantity"])]);
  			}
        console.log(colors.yellow("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~Bamazon~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~"));
        console.log("\n" + table.toString());  //prints cli-table ON screen
        
        console.log("");
    });
    
}

displayTable();


//function for the items purchase
function purchase(){
	inquirer.prompt([
			{
			  type: 'input',
			  message: 'enter the id # of the item to purchase?',
			  name: 'itemID',
        prompt: function(value) {       //ask user to  enter a number
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
			},
			{
			  type: 'input',
			  message: 'enter the quantity now?',
			  name: 'quantity',
        prompt: function(value) {      //ask user to  enter a number
          if (isNaN(value) === false) {
            return true;
          }
          return false;
        }
			}
		]).then(function(answer){
      let itemID = answer.itemID;            //users answer captured id # as  itemID
			let quantity = answer.quantity;			   //store the users answer of purchase qty as let quantity
      //connect to db and select the record from products table with an item_id = the user id input
			connection.query('SELECT * FROM products WHERE item_id=?', [itemID], function(err, results){
				if (err) throw err;
				let stock_quantity = results[0].stock_quantity;           //store the stock qty of the record queried as  stock_quantity
				if (stock_quantity < quantity) {                          //if user orders more than available qty give message
					console.log(colors.bgBlack("Sorry, Insufficient quantity on hand!. check listed qty again"));
          setTimeout(purchase, 1000);                          //recall the purchase function
				} else{                                                   //if user order quantity can be fullfilled...
					stock_quantity -= quantity;                             //subtract the users purchase qty from the store stock qty

          let totalPrice = quantity * results[0].price;           //get and store the totalPrice by  quantity * price of record queried
					let totalSales = totalPrice + results[0].product_sales; // totalSales by adding totalPrice + product_sales of record queried
					let department = results[0].department_name;            //store the department of the record queried as let department

          console.log(colors.white("\nYour line item total on this product: $" + (quantity * results[0].price).toFixed(2)));  //order total $ to the user

          orderTotal += (parseFloat(totalPrice));                 //add the product line price to the total order price to use in update message
          console.log(colors.white("\nYour order total of all products this session: ") + colors.yellow("$"+orderTotal.toFixed(2))+"\n");

          //connect to db and update the stock_quantity to the post order qty
          connection.query('UPDATE products SET ? WHERE item_id=?', [{stock_quantity: stock_quantity}, itemID], function(err, results){
						if (err) throw err;
					});
          //connect to db and select total_sales value from the departments table where the name matches the dept_name of the record previously queried
          connection.query('SELECT total_sales FROM departments WHERE department_name=?', [department], function(err, results){
            if (err) throw err;
						let departmentTotal = results[0].total_sales + totalPrice; // add the users total line item sales price to the total_sales value for dept record queried
            //connect to db and update the total_sales value of the departments table where the name matches the dept_name of the record previously queried
						connection.query('UPDATE departments SET total_sales=? WHERE department_name=?', [departmentTotal, department], function(err, results){
							if(err) throw err;
						});
					});

          //nested inquirer to keep the customer ordering
          inquirer.prompt([
            {
              type: "confirm",
              message: "Would you like something else?",
              name: "yesOrNo",
              default: true
            }
          ]).then(function(data) {
					       if (data.yesOrNo) {  //if the answer is true( yes) 
                   showItemTable();   // show item table 
                   setTimeout(purchase, 1500); //recall the purchase function
                 } else {  //if the answer is no
                   console.log(colors.yellow("Thank you for using Bamazon"));
                   process.exit(0);  //exits to command prompt
                 }
          });
				}
			});
		});
}

setTimeout(purchase, 400); //initiall calls the purchase function giving time for the list to print.