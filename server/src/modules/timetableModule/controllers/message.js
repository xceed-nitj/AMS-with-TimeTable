
const User = require("../../../models/usermanagement/user");
const Message = require("../../../models/message");

class MessageController {
    
     async createMessage(req, res) {
      try {
        const { content,title } = req.body;
        console.log("req.body",req.body);
        if (!content || typeof content !== 'string' || content.trim() === '' || !title || typeof title !== 'string' || title.trim() === '') {
          return res.status(400).json({ message: 'Message content is required' });
        }
        const userId=req.user.id;
        console.log("userId",userId);
        const user = await User.findById(userId);
        console.log("user",user);
        if (!user.role.includes('ITTC')) {
          return res.status(403).json({ message: 'Forbidden: only institute admins can send messages' });
        }
        const message = await Message.create({
          sender: req.user.id,
          content: content.trim(),
          title: title.trim(),
          targetRole: 'DTTI',
        });

        return res.status(201).json({
          message: 'Message sent to all coordinators',
          data: message
        });
      } catch (err) {
        console.error('createMessage error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  
    // Fetching all messages for the logged-in user based on their role.
     async getMyMessages(req, res) {
      try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        const role = user.role;
        console.log("user.role",user.role);
        if (!user.role.includes('DTTI')) {
            return res.status(403).json({ message: 'Forbidden: only department timetable coordinators can view messages' });
          }
        console.log("role",role);
        const messages = await Message.find({ targetRole: "DTTI" }).sort('-createdAt');
        return res.status(200).json({
          message: 'Messages fetched successfully',
          data: messages
        });
      } catch (err) {
        console.error('getMyMessages error:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    }
  
    
    
  }
  
  module.exports = MessageController;