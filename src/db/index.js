import mongoose from "mongoose";
import {DB_NAME} from "../constant.js"

const connectdb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(
      `MongoDB Connected with DBHOST !! : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`MongoDB Connection Faild !! : ${error}`);
    process.exit(1);
  }
};

export { connectdb };
