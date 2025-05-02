const express = require("express");
const messageRouter = express.Router();
const MessageController = require("../controllers/message");
const messageController = new MessageController();
const protectRoute =require("../../usermanagement/privateroute")

messageRouter.post("/create",protectRoute,
    async (req, res) => {
        try {
          await messageController.createMessage(req, res);
        } catch (e) {
          res
            .status(e?.status || 500)
            .json({ error: e?.message || "Internal Server Error" });
        }
      }
    
    );
messageRouter.get("/myMessages",protectRoute, 
    async (req, res) => {
        try {
          await messageController.getMyMessages(req, res);
        } catch (e) {
          res
            .status(e?.status || 500)
            .json({ error: e?.message || "Internal Server Error" });
        }
      }
);
messageRouter.put("/readMessage/:messageId",protectRoute, 
    async (req, res) => {
        try {
          await messageController.markMessageAsRead(req, res);
        } catch (e) {
          res
            .status(e?.status || 500)
            .json({ error: e?.message || "Internal Server Error" });
        }
      }
);
messageRouter.delete("/delete/:messageId",protectRoute,async (req, res) => {
    try {
        await messageController.deleteMessage(req, res);
      } catch (e) {
        res
          .status(e?.status || 500)
          .json({ error: e?.message || "Internal Server Error" });
      }
    }
);

module.exports = messageRouter;