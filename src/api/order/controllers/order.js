// @ts-nocheck
"use strict";
const stripe = require("stripe")(
  "sk_test_51NhixSIgvc5fsPdo1i2DrgQnJVJaIQRYCwuRGvk2vKhnM3HU8w1tKoeu5X22be6fJlfZBbDq3OglT8wPYgZ8Ri8e00RPSDd0OQ"
);

const fs = require("fs");
const path = require("path");

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    const { token, products, addressShipping } = ctx.request.body;
    const { id: idUser, email: userEmail, username, name } = ctx.state.user; // Obtener datos del usuario logeado

    console.log("Address shipping:", addressShipping);

    // Función para calcular el precio con descuento
    function calcDiscountPrice(price, discount) {
      if (!discount) return price;

      const discountAmount = (price * discount) / 100;
      const result = price - discountAmount;

      return result.toFixed(2);
    }

    // Calcular el total del pago y construir el cuerpo del correo para el usuario
    let totalPayment = 0;
    let emailBodyUser = `<html>
      <head>
        <style>
          /* Estilos CSS para el correo electrónico */
          .order {
            background-color: #f3f3f3;
            width: 100%;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
          }

          .product {
            display: flex;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }

          .product img {
            width: 100px;
            margin-right: 15px;
            border-radius: 8px;
          }

          .product-details {
            flex: 1;
          }

          .product-title {
            font-weight: bold;
            margin-bottom: 5px;
          }

          .product-info {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
          }

          .product-price {
            font-weight: bold;
          }

          .total {
            text-align: right;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <p>¡Gracias por tu compra!</p>
        <p>Detalles de la compra:</p>
        <ul>`;

    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );

      const totalPrice = Number(priceTemp) * product.quantity;
      totalPayment += totalPrice;

      emailBodyUser += `<li class="product">
        <h1"${product.attributes.title}">
        <div class="product-details">
          <p class="product-title">${product.attributes.title}</p>
          <p class="product-info">${
            product.attributes.category.data.attributes.title
          }</p>
          <p class="product-info">Cantidad: ${product.quantity}</p>
          <p class="product-price">${priceTemp}€ x ${
        product.quantity
      } = ${totalPrice.toFixed(2)}€</p>
        </div>
      </li>`;
    });

    emailBodyUser += `</ul>
      <p class="total">Total pagado: ${totalPayment.toFixed(2)}€</p>
      </body>
    </html>`;

    // Enviar correo electrónico de confirmación al usuario
    try {
      await strapi.plugins["email"].services.email.send({
        to: userEmail, // Correo electrónico del usuario logeado
        from: "victor_pro_@hotmail.com", // Debe coincidir con defaultFrom en config/plugins.js
        replyTo: "victor_pro_@hotmail.com", // Debe coincidir con defaultReplyTo en config/plugins.js
        subject: "Confirmación de compra",
        html: emailBodyUser, // Cuerpo del correo electrónico con detalles de la compra para el usuario
      });
    } catch (err) {
      console.error(
        "Error al enviar el email de confirmación al usuario:",
        err
      );
    }

    // Construir el cuerpo del correo electrónico para el administrador
    let emailBodyAdmin = `<html>
      <head>
        <style>
          /* Estilos CSS para el correo electrónico */
          .order {
            background-color: #f3f3f3;
            width: 100%;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
          }

          .product {
            display: flex;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ddd;
          }

          .product img {
            width: 100px;
            margin-right: 15px;
            border-radius: 8px;
          }

          .product-details {
            flex: 1;
          }

          .product-title {
            font-weight: bold;
            margin-bottom: 5px;
          }

          .product-info {
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
          }

          .product-price {
            font-weight: bold;
          }

          .total {
            text-align: right;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <p>Nueva compra realizada por:</p>
        <p>Nombre: ${name}</p>
        <p>Usuario: ${username}</p>
        <p>Email: ${userEmail}</p>
        <p>Detalles de la compra:</p>
        <ul>`;

    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );

      const totalPrice = Number(priceTemp) * product.quantity;

      emailBodyAdmin += `<li class="product">
        <h1"${product.attributes.title}">
        <div class="product-details">
          <p class="product-title">${product.attributes.title}</p>
          <p class="product-info">${
            product.attributes.category.data.attributes.title
          }</p>
          <p class="product-info">Cantidad: ${product.quantity}</p>
          <p class="product-price">${priceTemp}€ x ${
        product.quantity
      } = ${totalPrice.toFixed(2)}€</p>
        </div>
      </li>`;
    });

    emailBodyAdmin += `</ul>
      <p class="total">Total pagado: ${totalPayment.toFixed(2)}€</p>
      <p>Dirección: ${addressShipping.attributes.address} ${
      addressShipping.attributes.state
    } ${addressShipping.attributes.city} ${
      addressShipping.attributes.postal_code
    }</p>
      </body>
    </html>`;

    // Enviar correo electrónico al administrador
    try {
      await strapi.plugins["email"].services.email.send({
        to: "llinaresvictor7@gmail.com", // Correo electrónico del administrador
        from: "victor_pro_@hotmail.com", // Debe coincidir con defaultFrom en config/plugins.js
        replyTo: "victor_pro_@hotmail.com", // Responder al correo electrónico del usuario
        subject: "Nueva compra realizada",
        html: emailBodyAdmin, // Cuerpo del correo electrónico con detalles de la compra para el administrador
      });
    } catch (err) {
      console.error("Error al enviar el email al administrador:", err);
    }

    // Realizar el cargo a través de Stripe
    const charge = await stripe.charges.create({
      amount: Math.round(totalPayment * 100),
      currency: "eur",
      source: token.id,
      description: `User ID: ${idUser}`,
    });

    // Datos para la orden
    const data = {
      products,
      user: idUser,
      totalPayment,
      idPayment: charge.id,
      addressShipping,
    };

    // Validar y crear la entrada de orden en la base de datos
    const model = strapi.contentTypes["api::order.order"];
    const validData = await strapi.entityValidator.validateEntityCreation(
      model,
      data
    );
    const entry = await strapi.db.query("api::order.order").create({
      data: validData,
    });

    return entry;
  },
}));
