const generateObject = (username, msg) => {
  return {
    username,
    text: msg,
    timestamp: new Date().getTime(),
  };
};

const generateLocationMessage = (username, url) => {
  return {
    username,
    url,
    timestamp: new Date().getTime(),
  };
};

module.exports = { generateObject, generateLocationMessage };
