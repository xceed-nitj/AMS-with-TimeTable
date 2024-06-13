const Event = require("../../../models/reviewModule/event.js");
const User = require("../../../models/reviewModule/user.js")
const XUser= require("../../../models/usermanagement/user.js")
const express = require("express");
const bodyParser = require("body-parser");
const { sendMail } = require("../../mailerModule/mailer.js"); // Importing the sendMail function
const getEnvironmentURL =require('../../../getEnvironmentURL.js')


const app = express();
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const addEvent = async (req, res) => {
  const { name, startDate, endDate, editor, paperSubmissionDate, reviewTime,instructions } =
    req.body;

  try {
    let newUser;
    const xceedUser= await XUser.findById(editor)
    if (!xceedUser) {
      throw new Error('User not found');
  }
    if (!xceedUser.role.includes('PRM')) {
      xceedUser.role.push('PRM');
      await xceedUser.save(); // Save the updated user
  }
    const eventUser=await User.findOne({email: xceedUser.email})
    if(!eventUser || eventUser.length===0)
    {
      newUser = new User({
        name: xceedUser.email,
        email: xceedUser.email,
        role:"Editor",
        password: "1234"
      });
    newUser.save()

    }
    else{
      newUser=eventUser;
    }
    const newEvent = new Event({
      name:name,
      editor: newUser.id,
      });
    await newEvent.save();

    const event= await Event.findById(newEvent._id).populate('editor').exec();
    if (!event.editor || event.editor.length === 0) {
      console.log("No editors found for the event");
      return;
    }
    console.log(event.editor)
    const editorEmails = event.editor.map(editor => editor.email);
    console.log("Editor Emails:", editorEmails);
    await sendMail(editorEmails, "Welcome to Review Management", `You have been added as editor for the conference "${name}"`);
    res.status(200).send(newEvent);

  } catch (error) {
    res.status(500).send(error);
    console.log(error)
  }
};
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).populate('editor').exec();
    console.log(events)
    res.status(200).json(events);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getEventsByUser = async (req, res) => {
  const Xuser= await XUser.findById(req.user.id)
  const userId= await User.findOne({email:Xuser.email});

  try {
    const events = await Event.find({ 'editor': { $in: [userId.id] } }).exec();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).send(error);
  }
};

const getEventById = async (req, res) => {
  const id = req.params.id;

  if (!id) {
    res.send("id not found");
  } else {
    try {
      const event = await Event.findById(id).populate('editor').exec();
      res.status(200).send(event);
    } catch (error) {
      res.status(500).send(error);
    }
  }
};

const deleteEvent = async (req, res) => {
  const id = req.params.id;
  if (!id) res.send("Id not found");

  try {
    await Event.deleteOne({ _id: id });
    res.status(200).send("Deleted Successfully");
  } catch (error) {
    res.status(500).send(error);
  }
};

const updateEvent = async (req, res) => {
  const id = req.params.id;
  if (!id) res.send("Id not found");

  const updateField = req.body;

  try {
    const event = await Event.findByIdAndUpdate(id, updateField, { new: true, runValidators: true });
    if (!event) {
      return res.status(404).send({ error: 'User not found' });
    }
    res.send(event);
  } catch (error) {
    res.status(400).send(error);
  }
};

const updateEventTemplate = async (req, res) => {
  try {
      const eventId = req.params.id;
      const { templates } = req.body;

      if (!templates) {
          return res.status(400).json({ message: 'Templates data is missing.' });
      }

      const event = await Event.findById(eventId);

      if (!event) {
          return res.status(404).json({ message: 'Event not found.' });
      }

      // Ensure templates object exists in the event before updating
      if (!event.templates) {
          event.templates = {};
      }

      Object.keys(templates).forEach((key) => {
          event.templates[key] = templates[key];
      });

      const updatedEvent = await event.save();

      res.status(200).json(updatedEvent.toObject());
  } catch (error) {
      console.error('Error updating event template:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};




const addEditor = async (req, res) => {
  const email = req.body.email;
  const id=req.params.id;
  const userId = await User.find({email:email})
  if(!userId || userId.length===0)
  {
    const newUser = new User({
      name: email,
      email: email,
      role:"Editor",
      password: "1234"
    });
  
    newUser.save()
    }
  if (!id) res.send("id not found");
  // const newEditor = req.body.editor;
  try {
    const event = await Event.findById(id);
    const updatedId = await User.findOne({email:email})
    event.editor.push(updatedId._id);
    await event.save();
    res.status(200).send("Editor is added successfully");
  } catch (error) {
    res.status(500).send(error);
  }
};

const addReviewer = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { email, baseUrl } = req.body; 

    if (!email) {
      console.error('Email is required');
      return res.status(400).send('Email is required');
    }

    let reviewer = await User.findOne({ email });

    if (!reviewer) {
      const temporaryPassword = generateRandomPassword();
      reviewer = new User({
        name: email,
        email: email,
        role: 'Reviewer',
        password: temporaryPassword
      });
      await reviewer.save();

      await sendMail(
        email,
        'Welcome as a Reviewer',
        `You have been added as a reviewer. Please set your password using this temporary password: ${temporaryPassword}`
      );
    }

    const event = await Event.findById(eventId);

    if (!event) {
      console.error('Event not found:', eventId);
      return res.status(404).send('Event not found');
    }

    // Check if reviewer is already assigned
    const isAlreadyReviewer = event.reviewer.some(r => r.user.equals(reviewer._id));
    if (isAlreadyReviewer) {
      return res.status(400).send('Reviewer already added to the event');
    } 

// Add reviewer to the event
    event.reviewer.push({ user: reviewer._id, status: 'Invited' });
    await event.save();

    const reviewerInvitationTemplate=event.templates.reviewerInvitation;
    const signature=event.templates.signature;
    const acceptLink = `${baseUrl}/prm/${eventId}/reviewer/${reviewer._id}`; // Use the base URL

    await sendMail(
      email,
      'You have been added as a reviewer',
      ` ${reviewerInvitationTemplate} <br>
      Please click <a href="${acceptLink}">here</a> to accept the invitation <br>
      ${signature}
      `

    );

    res.status(200).send('Reviewer added to the event successfully');
  } catch (error) {
    console.error('Error adding reviewer:', error);
    res.status(500).send('Internal server error');
  }
};

const resendInvitation = async (req, res) => {
  try {
    const eventId = req.params.id;
    const { email, baseUrl } = req.body;

    if (!email) {
      console.error('Email is required');
      return res.status(400).send('Email is required');
    }

    const reviewer = await User.findOne({ email });

    if (!reviewer) {
      return res.status(404).send('Reviewer not found');
    }

    const event = await Event.findById(eventId);

    if (!event) {
      console.error('Event not found:', eventId);
      return res.status(404).send('Event not found');
    }

    const acceptLink = `${baseUrl}/prm/${eventId}/reviewer/${reviewer._id}`;
     
    const reviewerInvitationTemplate=event.templates.reviewerInvitation;
    const signature=event.templates.signature;
    await sendMail(
      email,
      'Invitation to be a Reviewer ',
      ` ${reviewerInvitationTemplate}<br>
      Please click <a href="${acceptLink}">here</a> to accept the invitation <br>
      ${signature}
      `
    );

    res.status(200).send('Invitation resent successfully');
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).send('Internal server error');
  }
};

const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8);
};


// Backend controller function



const getAllReviewersInEvent = async (req, res) => {
  try {
    const eventId = req.params.id; // Extract eventId from URL

    // Find the event by ID and populate the user details in the reviewer subdocuments
    const event = await Event.findById(eventId).populate('reviewer.user').exec();

    // If the event doesn't exist, return an error
    if (!event) {
      return res.status(404).send('Event not found');
    }

    // Extract reviewer details (name, email, and status) from the event
    const reviewers = event.reviewer.map(reviewer => ({
      name: reviewer.user.name,  // Assuming the User schema has a name field
      email: reviewer.user.email,  // Assuming the User schema has an email field
      status: reviewer.status
    }));

    // Send the list of reviewers in the event
    res.status(200).json(reviewers);
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    res.status(500).send('Internal server error');
  }
};


const getEventIdByName = async (req, res) => {
  const eventName = req.params.name;

  try {
    // Find the event by name and retrieve its ID
    const event = await Event.findOne({ name: eventName });
    if (!event) {
      // If event with given name not found, return error
      return res.status(404).json({ error: "Event not found" });
    }

    // Return the ID of the event
    res.status(200).json({ eventId: event._id });
  } catch (error) {
    // If an error occurs, return server error
    res.status(500).json({ error: "Internal server error" });
  }
};

const getEditorIdByEmail = async (req, res) => {
  const editorEmail = req.params.email;
  try {
    // Find the user by email and role "Editor"
    const user = await User.find({ email: editorEmail });

    if (!user) {
      // If no user with the email and role "Editor" is found, return error
      return res.status(404).json({ error: "Editor not found" });
    }

    // Return the ID of the editor
    return res.status(200).json({ editorId: user._id });
  } catch (error) {
    // If an error occurs, return server error
    return res.status(500).json({ error: "Internal server error" });
  }
};


const updateReviewerStatus = async (req, res) => {
  const eventId = req.params.eventId; 
  const reviewerId = req.params.reviewerId; 
  const newStatus = req.body.status; 

  try {
    // Find the event by ID
    const event = await Event.findById(eventId);

    
    if (!event) {
      return res.status(404).send('Event not found');
    }

    
    const reviewerIndex = event.reviewer.findIndex(reviewer => reviewer.user.toString() === reviewerId);


    if (reviewerIndex === -1) {
      return res.status(404).send('Reviewer not found in the event');
    }

  
    event.reviewer[reviewerIndex].status = newStatus;
    await event.save();

    
    res.status(200).send('Reviewer status updated successfully');
  } catch (error) {
    console.error('Error updating reviewer status:', error);
    res.status(500).send('Internal server error');
  }
};

module.exports = { getEvents,getEventsByUser, addEvent, getEventById, deleteEvent, updateEvent, updateEventTemplate,getAllReviewersInEvent , addEditor,addReviewer, getEventIdByName ,updateReviewerStatus , resendInvitation};
