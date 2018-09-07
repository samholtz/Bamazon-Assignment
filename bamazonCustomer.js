var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",

    port: 3306,

    user: "root",

    password: "root",
    database: "bamazon",
    socketPath: '/Applications/MAMP/tmp/mysql/mysql.sock',

});

connection.connect(function (err) {
    if (err) throw err;
    buyItem();
});

function askReRun() {
    inquirer.prompt([
        {
            name: "choice",
            type: "list",
            choices: ["yes", "no"],
            message: "Would you like to buy more?"
        }

    ]).then(function (answer) {
        if (answer.choice === "yes") {
            buyItem();
        } else {
            console.log("thanks, come again soon.")
            return
        }
    })

}

function buyItem() {
    connection.query("SELECT * FROM products", function (err, results) {
        if (err) throw err;
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "list",
                    choices: function () {

                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            const quantity = results[i].stock_quantity;
                            const itemId = results[i].item_id
                            const productName = results[i].product_name
                            const price = results[i].price

                            const product = {
                                itemId,
                                productName,
                                price,
                                quantity
                            }

                            choiceArray.push({
                                name: `Item ID: ${itemId}  |  Name: ${productName} |   Price of Item: $ ${price}`,
                                value: product,
                                short: `Name: ${productName} |   Price of Item: $ ${price}`
                            })
                        }
                        return choiceArray;

                    },
                    message: "Please select an item that you wish to buy.\n"
                },
                {
                    name: "how_many",
                    type: "input",
                    message: "How many units of this item would you like to buy?",
                }
            ]).then(function (answer) {

                const chosenItem = answer.choice;
                const { quantity, productName, price } = chosenItem; // destructuring chosen item
                const userAnswerQuantity = answer.how_many;

                if (quantity < userAnswerQuantity) {
                    console.log('There are not enough in stock for you to purchase this.');

                } else {
                    console.log(`Purchasing ${userAnswerQuantity} of ${productName}. That will be $${price * userAnswerQuantity}`)
                    const query = `UPDATE products
                    SET stock_quantity = ${chosenItem.quantity - userAnswerQuantity}
                    WHERE item_id = ${chosenItem.itemId}`
                    connection.query(query, function (err, results) {
                        if (err) {
                            console.log("error updating database")
                            console.log(err)
                        }
                        console.log("Purchase complete!")
                        askReRun();
                    })
                }
            });
    })
}