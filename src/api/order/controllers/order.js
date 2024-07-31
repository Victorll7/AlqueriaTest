// @ts-nocheck
"use strict";
const stripe = require("stripe")(
  "sk_test_51NhixSIgvc5fsPdo1i2DrgQnJVJaIQRYCwuRGvk2vKhnM3HU8w1tKoeu5X22be6fJlfZBbDq3OglT8wPYgZ8Ri8e00RPSDd0OQ"
);

function calcDiscountPrice(price, discount) {
  if (!discount) return price;

  const discountAmount = (price * discount) / 100;
  const result = price - discountAmount;

  return result.toFixed(2);
}

/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async paymentOrder(ctx) {
    const { token, products, idUser, addressShipping } = ctx.request.body;

    let totalPayment = 0;
    let emailBodyUser = `<p>¡Gracias por tu compra!</p><p>Detalles de la compra:</p><ul>`;

    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );

      const totalPrice = Number(priceTemp) * product.quantity;
      totalPayment += totalPrice;

      emailBodyUser += `<li>${product.attributes.title} - ${
        product.quantity
      } x ${priceTemp}€ = ${totalPrice.toFixed(2)}€</li>`;
    });

    emailBodyUser += `</ul><p>Total pagado: ${totalPayment.toFixed(2)}€</p>`;

    // Enviar correo electrónico de confirmación al usuario
    try {
      await strapi.plugins["email"].services.email.send({
        to: "correo-usuario@dominio.com", // Correo electrónico del usuario logeado
        from: "tu-correo@dominio.com", // Debe coincidir con defaultFrom en config/plugins.js
        replyTo: "tu-correo@dominio.com", // Debe coincidir con defaultReplyTo en config/plugins.js
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
    let emailBodyAdmin = `<p>Nueva compra realizada por:</p><p>Usuario ID: ${idUser}</p><p>Detalles de la compra:</p><ul>`;

    products.forEach((product) => {
      const priceTemp = calcDiscountPrice(
        product.attributes.price,
        product.attributes.discount
      );

      const totalPrice = Number(priceTemp) * product.quantity;

      emailBodyAdmin += `<li>${product.attributes.title} - ${
        product.quantity
      } x ${priceTemp}€ = ${totalPrice.toFixed(2)}€</li>`;
    });

    emailBodyAdmin += `</ul><p>Total pagado: ${totalPayment.toFixed(2)}€</p>`;
    emailBodyAdmin += `<p>Dirección de envío: ${addressShipping.attributes.address}, ${addressShipping.attributes.state}, ${addressShipping.attributes.city}, ${addressShipping.attributes.postal_code}, ${addressShipping.attributes.title}</p>`;

    // Enviar correo electrónico al administrador
    try {
      await strapi.plugins["email"].services.email.send({
        to: "correo-admin@dominio.com", // Correo electrónico del administrador
        from: "tu-correo@dominio.com", // Debe coincidir con defaultFrom en config/plugins.js
        replyTo: "tu-correo@dominio.com", // Responder al correo electrónico del usuario
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
