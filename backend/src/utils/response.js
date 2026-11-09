/**
 * Casekaaran — Standardized API JSON Responses
 */
function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function error(res, message = 'An error occurred', statusCode = 500, errorCode = 'SERVER_ERROR', details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details })
    }
  });
}

module.exports = { success, error };
