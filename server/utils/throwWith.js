exports.throwWith = (status, message, name = "Application error") => {
  const error = new Error(message);
  error.status = status;
  error.name = name;
  throw error;
};
