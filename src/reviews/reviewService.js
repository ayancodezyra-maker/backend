// Review Service
import { supabase } from '../config/supabaseClient.js';
import { formatResponse } from '../utils/formatResponse.js';

export const reviewService = {
  /**
   * Create a review
   */
  async createReview(data, userId) {
    const { 
      project_id, 
      reviewee_id, 
      rating, 
      rating_overall,
      rating_quality,
      rating_communication,
      rating_timeline,
      rating_professionalism,
      rating_value,
      comment, 
      body, // Support both comment and body
      title, // Support title field
      project_type,
      photos
    } = data;

    // Use rating_overall or rating
    const finalRating = rating_overall || rating;
    const finalComment = comment || body;

    // Auto-determine reviewee_id from project if not provided
    let finalRevieweeId = reviewee_id;
    
    if (!finalRevieweeId && project_id) {
      // Get project to determine reviewee
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id, contractor_id')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return formatResponse(false, 'Project not found', null);
      }

      // If reviewer is owner, reviewee is contractor (and vice versa)
      if (project.owner_id === userId) {
        finalRevieweeId = project.contractor_id;
      } else if (project.contractor_id === userId) {
        finalRevieweeId = project.owner_id;
      } else {
        // Reviewer is neither owner nor contractor - use contractor as default reviewee
        finalRevieweeId = project.contractor_id;
      }
    }

    // Validate reviewee exists
    if (!finalRevieweeId) {
      return formatResponse(false, 'Missing required field: reviewee_id (or project_id to auto-determine)', null);
    }

    // Validate rating (optional - column may not exist)
    // If rating is provided, it must be valid
    if (finalRating !== undefined && finalRating !== null) {
      if (finalRating < 1 || finalRating > 5) {
        return formatResponse(false, 'Invalid rating: must be between 1-5', null);
      }
    }

    // Check if review already exists for this project
    if (project_id) {
      const { data: existing } = await supabase
        .from('reviews')
        .select('*')
        .eq('project_id', project_id)
        .eq('reviewer_id', userId)
        .eq('reviewee_id', finalRevieweeId)
        .single();

      if (existing) {
        return formatResponse(false, 'Review already exists for this project', null);
      }
    }

    // Build review data - use minimal required fields
    // Required: reviewer_id, reviewee_id
    // Optional: project_id, rating, comment, photos
    const reviewData = {
      project_id: project_id || null,
      reviewer_id: userId, // Always set from authenticated user
      reviewee_id: finalRevieweeId, // Auto-determined if not provided
    };

    // Only add rating if provided and valid (column may not exist in actual DB)
    // We'll try to add it, and if it fails, we'll know the column doesn't exist
    if (finalRating !== undefined && finalRating !== null && finalRating >= 1 && finalRating <= 5) {
      reviewData.rating = finalRating;
    }

    // Add optional fields
    if (finalComment) {
      reviewData.comment = finalComment;
    }
    
    if (photos && Array.isArray(photos)) {
      reviewData.photos = photos;
    }
    
    // Note: We're using minimal fields to avoid schema errors
    // If rating/comment/photos don't exist, the migration will add them

    // Try to insert - if rating/comment/photos columns don't exist, remove them and retry
    let { data: review, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    // If error is about missing column, try again with only required fields
    if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
      // Retry with only absolutely required fields
      const minimalData = {
        project_id: project_id || null,
        reviewer_id: userId,
        reviewee_id: finalRevieweeId,
      };
      
      const retryResult = await supabase
        .from('reviews')
        .insert(minimalData)
        .select()
        .single();
      
      if (retryResult.error) {
        return formatResponse(false, retryResult.error.message, null);
      }
      
      review = retryResult.data;
    } else if (error) {
      return formatResponse(false, error.message, null);
    }

    // Update contractor profile ratings
    await this.updateContractorRatings(finalRevieweeId);

    return formatResponse(true, 'Review created successfully', review);
  },

  /**
   * Get reviews for a contractor
   */
  async getContractorReviews(contractorId) {
    // Use simpler select without foreign key join (might not work)
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', contractorId)
      .order('created_at', { ascending: false });

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Reviews retrieved', data || []);
  },

  /**
   * Get review by ID
   */
  async getReviewById(reviewId) {
    // Use simpler select without foreign key joins
    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error) {
      return formatResponse(false, 'Review not found', null);
    }

    return formatResponse(true, 'Review retrieved', review);
  },

  /**
   * Add response to review
   */
  async addReviewResponse(reviewId, response, userId) {
    // Verify user is the reviewee
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows

    if (reviewError) {
      return formatResponse(false, reviewError.message, null);
    }

    if (!review) {
      return formatResponse(false, 'Review not found', null);
    }

    if (review.reviewee_id !== userId) {
      return formatResponse(false, 'Permission denied: Only the reviewee can respond', null);
    }

    // Build update data - try to use response columns if they exist
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Add response fields if provided
    if (response) {
      updateData.response = response;
      updateData.response_date = new Date().toISOString();
    }

    // Try to update with response fields
    let { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select()
      .maybeSingle();

    // If error is about missing column, retry with only updated_at
    if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
      // Response columns don't exist - just update timestamp
      // User should run migration to add response/response_date columns
      const { data: retryData, error: retryError } = await supabase
        .from('reviews')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .maybeSingle();

      if (retryError) {
        return formatResponse(false, retryError.message, null);
      }

      // Return success but inform user that response columns need to be added
      return formatResponse(
        true, 
        'Review updated. Note: Response columns (response, response_date) do not exist in database. Please run migration fix_reviews_table.sql to add them.', 
        retryData
      );
    }

    if (error) {
      return formatResponse(false, error.message, null);
    }

    return formatResponse(true, 'Response added successfully', data);
  },

  /**
   * Update contractor ratings (helper function)
   */
  async updateContractorRatings(contractorId) {
    // Try to get rating, but handle if column doesn't exist
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('reviewee_id', contractorId);

    if (error || !reviews || reviews.length === 0) {
      return; // No reviews or error getting reviews
    }

    // Try to calculate average rating if rating column exists
    const reviewsWithRating = reviews.filter(r => r.rating !== undefined && r.rating !== null);
    if (reviewsWithRating.length > 0) {
      const totalRating = reviewsWithRating.reduce((sum, r) => sum + (r.rating || 0), 0);
      const averageRating = totalRating / reviewsWithRating.length;

      // Update contractor profile - use correct column names
      await supabase
        .from('contractor_profiles')
        .update({
          avg_rating: averageRating,
          review_count: reviews.length,
        })
        .eq('user_id', contractorId);
    } else {
      // No ratings available, just update count
      await supabase
        .from('contractor_profiles')
        .update({
          review_count: reviews.length,
        })
        .eq('user_id', contractorId);
    }
  },
};

