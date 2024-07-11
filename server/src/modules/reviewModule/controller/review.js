const mongoose=require("mongoose");
const Review = require("../../../models/reviewModule/review");
const Paper = require("../../../models/reviewModule/paper");
const User=require("../../../models/usermanagement/user");
const Event=require("../../../models/reviewModule/event");
const {sendMail} =require("../../mailerModule/mailer");
const {jsPDF} = require("jspdf");
require("jspdf-autotable");

const addReview = async (req, res) => {
    const { paperId, eventId, reviewerId, reviewans, commentsAuthor, commentsEditor, decision } = req.body;

    try {
        const newReview = new Review({
            paperId,
            eventId,
            reviewerId,
            reviewans,
            commentsAuthor,
            commentsEditor,
            decision
        });
        await newReview.save();
        res.status(201).json(newReview);
    } catch (error) {
        res.status(500).json({ message: "Error creating review", error });
    }
};

const getReviews = async (req, res) => {
    try {
        const reviews = await Review.find();
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: "Error fetching reviews", error });
    }
};

const getReviewById = async (req, res) => {
    const { id } = req.params;
    try {
        const review = await Review.findById(id).populate('paperId eventId reviewerId');
        if (!review) return res.status(404).json({ message: "Review not found" });
        res.status(200).json(review);
    } catch (error) {
        res.status(500).json({ message: "Error fetching review", error });
    }
};

const getReviewsByEventPaperUser = async (req, res) => {
    const { paperId, eventId, userId } = req.params;

    try {
        const reviews = await Review.find({ paperId, eventId, reviewerId: userId });

        if (!reviews || reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found' });
        }

        res.status(200).json(reviews);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteReviewByPaperEventUser = async (req, res) => {
    const { paperId, eventId, userId } = req.params;

    try {
        const result = await Review.deleteMany({ paperId, eventId, reviewerId: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No reviews found to delete' });
        }

        res.status(200).json({ message: 'Reviews deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 

const updateReview = async (req, res) => {
    const { id } = req.params;
    const updateFields = req.body;

    try {
        const updatedReview = await Review.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updatedReview) return res.status(404).json({ message: "Review not found" });
        res.status(200).json(updatedReview);
    } catch (error) {
        res.status(500).json({ message: "Error updating review", error });
    }
};

const deleteReview = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedReview = await Review.findByIdAndDelete(id);
        if (!deletedReview) return res.status(404).json({ message: "Review not found" });
        res.status(200).json({ message: "Review deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting review", error });
    }
};

const submitReview = async (req, res) => {
    const { eventId, paperId, reviewerId, reviewAnswers, commentsAuthor, commentsEditor, decision } = req.body;
  
    const completedDate = new Date();
    const paper = await Paper.findOneAndUpdate({
        _id: paperId,
        'reviewers.userId': reviewerId
    }, {
        $set: {
            'reviewers.$.completedDate': completedDate
        }
    }, {
        new: true,
        runValidators: true
    });
    await paper.save();

    try {
      const newReview = new Review({
        eventId,
        paperId,
        reviewerId,
        reviewAnswers,
        commentsAuthor,
        commentsEditor,
        decision,
      });
  
      await newReview.save();

      // Generate PDF
      const doc = new jsPDF();
        
      const eventResponse = await Event.findById(eventId);
        if (!eventResponse) {
            console.log("Event Not Found");
            return res.status(404).json({ message: "Event not found" });
        }

        const paperResponse = await Paper.findById(paperId);
        if (!paperResponse) {
            console.log("Paper Not Found");
            return res.status(404).json({ message: "Paper not found" });
        }

        const reviewerResponse = await User.findById(reviewerId);
        if (!reviewerResponse) {
            console.log("Reviewer Not Found");
            return res.status(404).json({ message: "Reviewer not found" });
        }

        // Ensure data property exists
        const eventName = eventResponse.name || "N/A";
        const paperTitle = paperResponse.title || "N/A";
        const reviewerName = reviewerResponse.name || "N/A";
        // console.log(reviewerResponse.email[0]);
        const reviewerEmail = reviewerResponse.email[0];//Asuuming 1st email is the primary email 

        doc.text(`Event name: ${eventName}`, 10, 10);
        doc.text(`Paper title: ${paperTitle}`, 10, 20);
        doc.text(`Paper ID: ${paperId}`, 10, 30);
        doc.text(`Reviewer Name: ${reviewerName}`, 10, 40);
         
        const stripHTMLTags = (str) => {
            return str.replace(/<\/?[^>]+(>|$)/g, "");
        };

      // Add review questions and answers
      const reviewData = reviewAnswers.map((answer, index) => [
          `Question ${index + 1}: ${stripHTMLTags(answer.question)}`,
          `Answer: ${stripHTMLTags(answer.answer) || ''}`
      ]);

      doc.autoTable({
          head: [['Question', 'Answer']],
          body: reviewData,
          startY: 50
      });

      doc.text(`Author comments: ${commentsAuthor}`, 10, doc.autoTable.previous.finalY + 10);
      doc.text(`Editor comments: ${commentsEditor}`, 10, doc.autoTable.previous.finalY + 20);
      doc.text(`Submitted time: ${completedDate.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 30);

      // Save the PDF to a buffer
      const pdfBuffer = doc.output('arraybuffer');

      // Send email with PDF attachment
      await sendMail(
          reviewerEmail,
          'Thank You for Submitting Review',
          '<p>Thank You for Submitting Review</p>',
          [
              {
                  filename: 'review.pdf',
                  content: Buffer.from(pdfBuffer),
                  contentType: 'application/pdf'
              }
          ]
      );

  
      res.status(200).json({ message: "Review submitted successfully", review: newReview });
    } catch (error) {
      console.error('Error submitting review:', error);
      res.status(500).json({ error: "Error submitting review" });
    }
  };
  const getAnswers = async (req, res) => {
    const { eventId, paperId, userId } = req.params;
  
    try {
      const answers = await Answer.find({ eventId, paperId, userId });
      res.status(200).json(answers);
    } catch (error) {
      console.error('Error fetching answers:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  const getAnswersByEVentIdPaperId =async(req,res)=>{
    const {eventId,paperId}=req.params;
    try{
        const review=await Review.find({eventId,paperId});
        if(!review)
            {
                return res.status(404).json({ message: 'Review not found' });
            }
        res.json(review);
    } catch(error)
    {
        res.status(500).json({message:'Server error',error});
    }
  };
 
module.exports = {addReview,getAnswersByEVentIdPaperId ,getAnswers,submitReview ,getReviews, getReviewById, updateReview, deleteReview ,getReviewsByEventPaperUser,deleteReviewByPaperEventUser};
