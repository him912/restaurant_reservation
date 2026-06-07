function ReviewList({ reviews }) {
  if (!reviews?.length) {
    return <p>No reviews available yet. Be the first to share your experience.</p>;
  }

  return (
    <div className="review-list">
      <h2>Guest reviews</h2>
      {reviews.map((review) => (
        <div key={review._id} className="review-item">
          <div className="review-top">
            <strong>{review.userId?.username || "Guest"}</strong>
            <span>{review.rating} ★</span>
          </div>
          <p>{review.comment || "No comment provided."}</p>
          {review.photos?.length > 0 && (
            <div className="review-photos">
              {review.photos.map((photo, index) => (
                <img key={index} src={photo} alt={`Review photo ${index + 1}`} />
              ))}
            </div>
          )}
          {review.responses?.length > 0 && (
            <div className="review-responses">
              {review.responses.map((response) => (
                <div key={response._id} className="review-response">
                  <small>Owner reply:</small>
                  <p>{response.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default ReviewList;
