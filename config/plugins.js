module.exports = ({ env }) => ({
  email: {
    config: {
      provider: "sendgrid",
      providerOptions: {
        apiKey: env("SENDGRID_API_KEY"),
      },
      settings: {
        defaultFrom: "L´ Alqueria <victor_pro_@hotmail.com>",
        defaultReplyTo: "L´ Alqueria <victor_pro_@hotmail.com>",
        testAddress: "victor_pro_@hotmail.com",
      },
    },
  },
});
