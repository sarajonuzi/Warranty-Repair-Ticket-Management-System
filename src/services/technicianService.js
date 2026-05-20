const { getData } = require("../db/database");

async function listTechnicians() {
  const db = await getData();
  return [...db.technicians].sort((a, b) => a.name.localeCompare(b.name));
}

module.exports = {
  listTechnicians
};
