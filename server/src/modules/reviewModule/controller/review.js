const Review = require("../../../models/reviewModule/review");
const Paper = require("../../../models/reviewModule/paper");

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
            //console.log(review.reviewAnswers);
            const allReviewAnswers = review.map(review => review.reviewAnswers);
            console.log(allReviewAnswers);
            res.json(allReviewAnswers);
            
            

    } catch(error)
    {
        res.status(500).json({message:'Server error',error});
    }
  };
 
module.exports = {addReview,getAnswersByEVentIdPaperId ,getAnswers,submitReview ,getReviews, getReviewById, updateReview, deleteReview ,getReviewsByEventPaperUser,deleteReviewByPaperEventUser};
