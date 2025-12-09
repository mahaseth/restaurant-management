import config from "../config/config.js";
const getApplicationInfo = () => {
  return {
    name: config.name,
    port: config.port,
    version: config.version,
    status: "OK",
  };
};

export default { getApplicationInfo };
