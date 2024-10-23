import fetch from "node-fetch";

const CLICKUP_API_TOKEN = process.env.clickup as string;

export const getClickUpTasksFromList = async (req: any, res: any) => {
  const listID = req.params.listID;
  const url = `${process.env.clickupUrl}v2/list/${listID}/task`;

  console.log(listID);
  console.log(url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: CLICKUP_API_TOKEN,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// TODO implement if oauth is needed
// not needed for instances with personal token from clickup
// export const getClickupAuthToken = async (req: any, res: any) => {
//   const url = `${process.env.clickupUrl}v2/user`;

//   try {
//     const resp = await fetch(url, {
//       method: "GET",
//       headers: {
//         Authorization: process.env.clickup as string,
//       },
//     });

//     const data = await resp.text();

//     process.env.CLICKUP_AUTH = data.

//     console.log(data);
//   } catch (error: any) {
//     res.json({ error: 500, message: error.message });
//   }
// };
