export const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  if (err.name === 'ZodError') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists',
    });
  }

  if (!err.isOperational) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message: status === 500 && isProd ? 'Internal server error' : err.message,
  });
};
