import * as odbc from "odbc";

const DSN = "msAccess";
export const sendQuery = async (query: string) => {
  try {
    const connection = await odbc.connect(`DSN=${DSN}`);
    const result = await connection.query(query);
    await connection.close();
    return result;
  } catch (error: any) {
    console.log("query error: ", error);
    throw new Error(error);
  }
};
