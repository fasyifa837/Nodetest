module.exports = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role_id)) {
      return res.status(403).json({
        message: "Forbidden Access",
      });
    }

    next();
  };
};