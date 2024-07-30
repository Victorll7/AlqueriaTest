module.exports = ({ env }) => ({
  email: {
    provider: "sendgrid",
    providerOptions: {
      apiKey: env("SENDGRID_API_KEY"),
    },
    settings: {
      defaultFrom: "llinaresvictor7@gmail.com",
      defaultReplyTo: "llinaresvictor7@gmail.com",
    },
  },
});
