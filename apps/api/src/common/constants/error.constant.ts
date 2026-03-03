export const ErrorMessages = {
  // ─── Auth ───────────────────────────────────────────────────────────────────
  INVALID_CREDENTIALS: 'Email or password is incorrect',
  USER_BANNED: 'User has been banned',
  EMAIL_NOT_VERIFIED: 'You need verify your email first',
  EMAIL_ALREADY_IN_USE: 'Email is already in use',
  INVALID_TOKEN: 'Invalid Token',
  INVALID_OR_EXPIRED_TOKEN: 'Invalid or expired token',
  NO_GOOGLE_USER: 'No user from Google found',
  GOOGLE_ACCOUNT_CONFLICT:
    'User is already linked to a different Google account',

  // ─── JWT Strategies ──────────────────────────────────────────────────────────
  INVALID_TOKEN_TYPE: 'Invalid token type',
  MISSING_OR_INVALID_JTI: 'Missing or invalid jti',
  TOKEN_REVOKED: 'Token has been revoked',

  // ─── Users ───────────────────────────────────────────────────────────────────
  USER_NOT_FOUND: 'User not found',
  NO_PERMISSION: 'You have no right to perform this action',

  // ─── Recipes ─────────────────────────────────────────────────────────────────
  RECIPE_NOT_FOUND: 'Recipe not found',
  AT_LEAST_ONE_STEP: 'At least one step is required',
  DUPLICATE_ORDER_INDEX: 'Order index can not be duplicated',
  ORDER_INDEX_START_FROM_1: 'order_index must start from 1',
  ORDER_INDEX_CONTINUOUS: 'Order index must be continuous',
  CANNOT_LIKE_OWN_RECIPE: 'You cannot like your own recipe',

  // ─── Comments ────────────────────────────────────────────────────────────────
  COMMENT_NOT_FOUND: 'Comment not found',
  NO_RIGHT_DELETE_COMMENT: 'You not have right to delete this comment',
  NO_RIGHT_UPDATE_COMMENT: 'You not have right to update this comment',

  // ─── Collections ─────────────────────────────────────────────────────────────
  COLLECTION_NOT_FOUND: 'Collection not found',
  COLLECTION_FORBIDDEN:
    'Collection is not exist or you have no right to see this',
  NO_RIGHT_EDIT_COLLECTION: 'You have no right to edit this',

  // ─── Reports ─────────────────────────────────────────────────────────────────
  REPORT_NOT_FOUND: 'Report not found',
};
