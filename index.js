const app = require("./api/index");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const config = require("./configs/config");

if (config.isVercel) {
  app.use(async (req, res, next) => {
    try {
      await mongoose.connect(config.mongoUri, config.mongoOptions);
      console.log("Connected to MongoDB");
      next();
    } catch (error) {
      console.log(error);
      res.status(500).send();
    }
  });
}

app.use(bodyParser.json());
app.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200,
  }),
);

app.listen(config.port, () => {
  console.log("Express server listening on port " + config.port);
});
