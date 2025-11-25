/**
 * Pagination Utilities
 * Helper functions for pagination, sorting, and filtering
 */

/**
 * Parse pagination parameters from query
 */
export const parsePagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Parse sorting parameters from query
 */
export const parseSorting = (req, defaultSortBy = 'created_at', defaultOrder = 'desc') => {
  const sortBy = req.query.sortBy || defaultSortBy;
  const order = req.query.order || defaultOrder;

  return { sortBy, order: order.toLowerCase() };
};

/**
 * Apply pagination to Supabase query
 */
export const applyPagination = (query, pagination) => {
  return query.range(pagination.offset, pagination.offset + pagination.limit - 1);
};

/**
 * Apply sorting to Supabase query
 */
export const applySorting = (query, sorting) => {
  return query.order(sorting.sortBy, { ascending: sorting.order === 'asc' });
};

/**
 * Apply filters to Supabase query
 */
export const applyFilters = (query, filters) => {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        query = query.in(key, value);
      } else if (typeof value === 'string' && value.includes(',')) {
        // Handle comma-separated values
        query = query.in(key, value.split(',').map((v) => v.trim()));
      } else {
        query = query.eq(key, value);
      }
    }
  });
  return query;
};

/**
 * Build pagination response
 */
export const buildPaginationResponse = (data, pagination, total) => {
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  };
};

/**
 * Parse common filters from query
 */
export const parseCommonFilters = (req, allowedFilters = []) => {
  const filters = {};
  allowedFilters.forEach((filter) => {
    if (req.query[filter] !== undefined) {
      filters[filter] = req.query[filter];
    }
  });
  return filters;
};

/**
 * Parse date range filters
 */
export const parseDateRange = (req, startField = 'start_date', endField = 'end_date') => {
  const filters = {};
  if (req.query[startField]) {
    filters[startField] = req.query[startField];
  }
  if (req.query[endField]) {
    filters[endField] = req.query[endField];
  }
  return filters;
};

/**
 * Apply date range to query
 */
export const applyDateRange = (query, startField, endField, startDate, endDate) => {
  if (startDate) {
    query = query.gte(startField, startDate);
  }
  if (endDate) {
    query = query.lte(endField, endDate);
  }
  return query;
};

/**
 * Apply search to query (for text fields)
 */
export const applySearch = (query, searchFields, searchTerm) => {
  if (!searchTerm) return query;

  const searchConditions = searchFields
    .map((field) => `${field}.ilike.%${searchTerm}%`)
    .join(',');

  return query.or(searchConditions);
};

