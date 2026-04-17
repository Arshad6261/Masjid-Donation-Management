export const scopeToArea = (req, res, next) => {
  req.areaFilter = req.user.role === 'admin'
    ? {}
    : { area: { $in: req.user.assignedAreas || [] } };
  return next();
};
