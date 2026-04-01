const fs = require('fs-extra');
const path = require('path');

const readData = async (fileName) => {
  const filePath = path.join(__dirname, '..', 'data', fileName);

  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      await fs.writeJson(filePath, [], { spaces: 2 });
      return [];
    }

    return await fs.readJson(filePath);
  } catch (error) {
    console.error(`Error reading ${fileName}:`, error.message);
    return [];
  }
};

const writeData = async (fileName, data) => {
  const filePath = path.join(__dirname, '..', 'data', fileName);

  try {
    await fs.writeJson(filePath, data, { spaces: 2 });
  } catch (error) {
    console.error(`Error writing ${fileName}:`, error.message);
    throw error;
  }
};

module.exports = { readData, writeData };