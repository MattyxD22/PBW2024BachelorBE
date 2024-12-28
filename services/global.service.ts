import * as odbc from "odbc";

export const sendQuery = async (query: string) => {
  try {
    const connection = await odbc.connect(`DSN=${process.env.DATABASE_DSN}`);
    const result = await connection.query(query);
    await connection.close();
    return result;
  } catch (error: any) {
    console.log("query error: ", error);
    throw new Error(error);
  }
};
