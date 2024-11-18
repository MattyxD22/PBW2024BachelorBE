import fetch from "node-fetch";

export const exportCSV = async (req: any, res: any) => {
    console.log('plz');
    
    try {
      console.log(req.body)
      res.status(200).json({'Status': 200, 'Message': '.CVS exported successfully'});
    } catch (error: any) {
      console.error("Error exporting csv file:", error.message);
      res.status(500).json({ error: error.message });
    }
  };