const HttpException = require("../../../models/http-exception");
const Note = require("../../../models/note");

class NoteController {
  async createNote(req, res) {
    const { sem, room, faculty, note, code } = req.body;
    const noteContent = Array.isArray(note) ? note : [note];
    const notesToCreate = [];
    if (sem && sem.trim() !== "") {
        notesToCreate.push({ sem, note: noteContent, code });
    }
    if (faculty && faculty.trim() !== "") {
        notesToCreate.push({ faculty, note: noteContent, code });
    }

    if (room && room.trim() !== "") {
        notesToCreate.push({ room, note: noteContent, code });
    }

    try {
      if (notesToCreate.length > 0) {
          const createdNotes = await Note.insertMany(notesToCreate);
          res.json(createdNotes);
      } else {
          const fallbackData = { ...req.body, note: noteContent };
          const createdNote = await Note.create(fallbackData);
          res.json(createdNote);
      }
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getNotes(req, res) {
    try {
      const noteList = await Note.find();
      res.json(noteList);
      return;
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getNote(currentCode) {
    try {
      const notes = await Note.find({ code: currentCode }); 
      return notes;
    } catch (error) {
      throw error;
    }
  }  
  
  async getNoteByCode(code, fieldName, fieldValue) {
    try {
      const query = { code: code };
      query[fieldName] = fieldValue;
  
      const notes = await Note.find(query).select('note'); 
      const noteArray = notes.map(note => note.note);
  
      return noteArray;
    } catch (error) {
      throw error;
    }
  }
  



  async getNoteById(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      const data = await Note.findById(id);
      if (!data) throw new HttpException(400, "Data does not exist");
      return data;
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async updateNote(id, updatedNote) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Note.findByIdAndUpdate(id, updatedNote);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }

  async deleteNote(id) {
    if (!id) {
      throw new HttpException(400, "Invalid Id");
    }
    try {
      await Note.findByIdAndDelete(id);
    } catch (e) {
      throw new HttpException(500, e.message || "Internal Server Error");
    }
  }
}

module.exports = NoteController;
