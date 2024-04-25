import { connectdb } from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

connectdb()
  .then(() => {
    app.listen(process.env.PORT || 5100, () => {
      console.log(`App running at Port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log(`MongoDb connection error : ${err}`);
  });
