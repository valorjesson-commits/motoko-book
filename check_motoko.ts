import mo from "motoko"
import fs from "fs"
import path from "path"

const baseCommit = "9037e2c2d9947084c93278f4be6bac4517f2ab8f"
const base = JSON.parse(
  fs.readFileSync(
    new URL("./node_modules/motoko/packages/latest/base.json", import.meta.url),
    "utf8"
  )
)
base.version = baseCommit
mo.loadPackage(base)

const folders = findFolder("src", "_mo")
const motokoFiles = folders.flatMap((folder) =>
  fs
    .readdirSync(folder)
    .filter((file) => path.extname(file) === ".mo")
    .map((file) => path.join(folder, file))
)
motokoFiles.forEach((file) => mo.write(file, fs.readFileSync(file, "utf8")))
motokoFiles.forEach(checkMotoko)

function findFolder(dir: string, folderName: string) {
  let array: string[] = []
  let files = fs.readdirSync(dir)
  for (let i = 0; i < files.length; i++) {
    let filePath = path.join(dir, files[i])
    let stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      if (files[i] === folderName) {
        array.push(filePath)
        let result = findFolder2(filePath)
        if (result) {
          result.forEach((value) => array.push(value))
        }
      } else {
        let result = findFolder(filePath, folderName)
        if (result) {
          result.forEach((value) => array.push(value))
        }
      }
    }
  }
  return array
}

function findFolder2(dir: string) {
  let array: string[] = []
  let files = fs.readdirSync(dir)
  for (let i = 0; i < files.length; i++) {
    let filePath = path.join(dir, files[i])
    let stats = fs.statSync(filePath)
    if (stats.isDirectory()) {
      array.push(filePath)
      let result = findFolder2(filePath)
      if (result) {
        result.forEach((value) => array.push(value))
      }
    }
  }
  return array
}

function checkMotoko(file: string) {
  try {
    const check = mo.check(file)
    const errors = check.filter(({ severity }) => severity === 1)
    if (check.length === 0) {
      console.log("CORRECT: " + file)
    } else if (errors.length === 0) {
      console.log("WARNING: " + file)
      console.log(check)
    } else {
      console.log("ERROR: " + file)
      console.log(errors)
      process.exitCode = 1
    }
  } catch (error) {
    console.log("ERROR: " + file)
    console.log(error)
    process.exitCode = 1
  }
}
