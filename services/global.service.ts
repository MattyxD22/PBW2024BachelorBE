import * as odbc from "odbc";

const DSN = "msAccess"; // Replace with the DSN name you set up earlier

export const updateMSAccessDatabase = async () => {
  try {
    const connection = await odbc.connect(`DSN=${DSN}`);
  } catch (error: any) {}
};

export const getAllAccess = async (query: string) => {
  try {
    const connection = await odbc.connect(`DSN=${DSN}`);
    const response: any = await connection.query(query);

    // Filter out metadata to keep only the rows (assuming rows are at the beginning of the response array)
    const rows = response.filter(
      (item: any) =>
        typeof item === "object" && !item.statement && !item.parameters
    );

    const returnObj = {
      response: rows,
      length: rows.length,
    };
    await connection.close();
    return returnObj;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

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
