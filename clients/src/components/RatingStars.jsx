/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({
  rating,
  maxStars = 5,
  size = 18,
  interactive = false,
  onChange
}) => {
  const [hoverRating, setHoverRating] = useState(null);

  const handleClick = (val) => {
    if (interactive && onChange) {
      onChange(val);
    }
  };

  const handleMouseEnter = (val) => {
    if (interactive) {
      setHoverRating(val);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  const currentDisplay = hoverRating !== null ? hoverRating : rating;

  return (
    <div className="flex items-center gap-1" id={`rating-stars-container-${interactive ? 'edit' : 'view'}`}>
      {Array.from({ length: maxStars }).map((_, idx) => {
        const starValue = idx + 1;
        const isFilled = starValue <= currentDisplay;
        const isHalf = !isFilled && starValue - 0.5 <= currentDisplay;

        return (
          <button
            key={idx}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => handleMouseEnter(starValue)}
            onMouseLeave={handleMouseLeave}
            className={`${interactive ? 'cursor-pointer hover:scale-115 transition-transform duration-100 focus:outline-none' : ''}`}
            id={`star-${starValue}`}
          >
            <Star
              size={size}
              className={`transition-colors duration-150 ${
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-zinc-300 dark:text-zinc-600'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
};
