import fs from "fs";
import path from "path";

const isDirectory = (path: string) => {
  return fs.lstatSync(path).isDirectory();
};

const getFiles = (dirPath: string, ext: string) => {
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(ext))
    .map((file) => path.join(dirPath, file));
};

const getOutputPath = (inputJack: string) => {
  return path.format({
    ext: ".xml",
    name: path.basename(inputJack, ".jack"),
    dir: path.dirname(inputJack),
  });
};

export { isDirectory, getFiles, getOutputPath };
