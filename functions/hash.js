const { createHash } = require("crypto");

// hash function
const sha256 = (input) => {
    const hash = createHash("sha256");
    hash.update(input);
    return hash.digest("hex");
  };

  module.exports = {
    sha256,
  }