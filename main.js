const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const prompt = require('electron-prompt');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

async function processImage(filePath, outputPath, percentage, format) {
  try {
    const imageMetadata = await sharp(filePath).metadata();
    const outputFormat = format || imageMetadata.format;

    const options = {};
    if (outputFormat === 'webp') {
      options.quality = 100; // Adjust quality for WebP
    }

    if (outputFormat === 'png') {
      options.compressionLevel = 9; // Maximum compression for PNG
    }

    await sharp(filePath)
      .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
      .toFormat(outputFormat, options)
      .toFile(outputPath);
  } catch (error) {
    console.error("Error processing image:", error);
  }
}

async function convertToWebPWithCompression(filePath, outputPath) {
  try {
    await sharp(filePath)
      .resize({ width: 1400 }) // Resize to a standard width, adjust as needed
      .toFormat('webp', { quality: 80 }) // Convert to WebP with specified quality
      .toFile(outputPath);

    console.log(`Converted ${filePath} to WebP with compression at ${outputPath}`);
  } catch (error) {
    console.error('Error converting to WebP:', error);
  }
}

ipcMain.on('convert-single-image-to-webp', async (event) => {
  console.log("Received 'convert-single-image-to-webp' event");

  const { filePaths, canceled } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] }]
  });

  if (canceled) {
    console.log("File selection was canceled");
    return; // Exit if the user cancels the file dialog
  }

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    const outputPath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.webp');

    console.log(`Selected file: ${filePath}`);
    console.log(`Output path: ${outputPath}`);

    await convertToWebPWithCompression(filePath, outputPath);
  } else {
    console.error('No file selected');
  }
});

async function convertAllImagesToWebP(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);
    console.log(`Found ${files.length} files in directory: ${directoryPath}`);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);
      const outputPath = path.join(directoryPath, path.basename(file, path.extname(file)) + '.webp');

      console.log(`Processing file: ${filePath}`);

      // Check if the file is an image by checking its extension
      if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
        console.log(`Converting ${filePath} to WebP...`);
        await convertToWebPWithCompression(filePath, outputPath);
      } else {
        console.log(`Skipping non-image file: ${file}`);
      }
    }

    console.log(`All images in ${directoryPath} have been converted to WebP.`);
  } catch (error) {
    console.error('Error converting all images to WebP:', error);
  }
}


async function selectAndConvertAllImagesToWebP() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (filePaths && filePaths.length > 0) {
    const directoryPath = filePaths[0];
    await convertAllImagesToWebP(directoryPath);
  }
}

ipcMain.on('convert-all-images-to-webp', (event) => {
  selectAndConvertAllImagesToWebP();
});

async function makeImageSixteenNine(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width;
    const height = metadata.height;

    const targetRatio = 16 / 9;
    let targetWidth, targetHeight;

    if (width / height > targetRatio) {
      targetHeight = height;
      targetWidth = Math.round(targetHeight * targetRatio);
    } else {
      targetWidth = width;
      targetHeight = Math.round(targetWidth / targetRatio);
    }

    const outputPath = path.join(path.dirname(filePath), `16_9_${path.basename(filePath)}`);

    await sharp(filePath)
      .extract({
        width: targetWidth,
        height: targetHeight,
        left: (width - targetWidth) / 2,
        top: (height - targetHeight) / 2
      })
      .toFormat('jpeg')
      .toFile(outputPath);

    console.log(`16:9 image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making image 16:9:', error);
  }
}

async function selectAndMakeImageSixteenNine() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    makeImageSixteenNine(filePath);
  }
}

ipcMain.on('make-image-sixteen-nine', (event) => {
  selectAndMakeImageSixteenNine();
});

async function makeHeroImage(filePath) {
  try {
    const outputPath = path.join(path.dirname(filePath), `hero_${path.basename(filePath, path.extname(filePath))}.webp`);

    await sharp(filePath)
      .resize({ width: 1400 })
      .toFormat('webp', { quality: 80 }) // Adjusted to align with the new compression logic
      .toFile(outputPath);

    console.log(`Hero image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making hero image:', error);
  }
}

async function makeMediumImage(filePath) {
  try {
    const outputPath = path.join(path.dirname(filePath), `medium_${path.basename(filePath, path.extname(filePath))}.webp`);

    await sharp(filePath)
      .resize({ width: 600 })
      .toFormat('webp', { quality: 80 }) // Adjusted to align with the new compression logic
      .toFile(outputPath);

    console.log(`Medium image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making medium image:', error);
  }
}

async function selectAndMakeHeroImage() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    makeHeroImage(filePath);
  }
}
async function selectAndMakeImageSquare() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    await makeImageSquare(filePath);
  }
}

async function makeImageSquare(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const size = Math.min(metadata.width, metadata.height);

    const outputPath = path.join(path.dirname(filePath), `square_${path.basename(filePath)}`);

    await sharp(filePath)
      .extract({
        width: size,
        height: size,
        left: Math.floor((metadata.width - size) / 2),
        top: Math.floor((metadata.height - size) / 2),
      })
      .toFormat('webp')
      .toFile(outputPath);

    console.log(`Square image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making square image:', error);
  }
}
async function selectAndResizeLargeImages() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (filePaths && filePaths.length > 0) {
    const directoryPath = filePaths[0];
    await resizeLargeImages(directoryPath);
  }
}

async function resizeLargeImages(directoryPath) {
  try {
    const files = fs.readdirSync(directoryPath);

    for (const file of files) {
      const filePath = path.join(directoryPath, file);

      // Check if the file is an image by checking its extension
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(path.extname(file).toLowerCase())) {
        const metadata = await sharp(filePath).metadata();

        // Resize images that are larger than 1200px in width
        if (metadata.width > 1200) {
          const outputPath = path.join(directoryPath, 'resized_' + path.basename(file));
          
          await sharp(filePath)
            .resize({ width: 1200 }) // Resize to 1200px width
            .toFile(outputPath);

          console.log(`Resized image saved at ${outputPath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error resizing large images:', error);
  }
}


async function selectAndMakeMediumImage() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    makeMediumImage(filePath);
  }
}

ipcMain.on('make-hero-image', (event) => {
  selectAndMakeHeroImage();
});

ipcMain.on('make-medium-image', (event) => {
  selectAndMakeMediumImage();
});

ipcMain.on('resize-webp-images', (event) => {
  resizeWebpImages();
});

async function resizeWebpImages() {
  try {
    const { filePaths: directoryPaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });

    if (!directoryPaths) return;

    const percentage = await prompt({
      title: 'Enter percentage',
      label: 'Enter the percentage (in %) to resize the webp images to:',
      value: '80',
      inputAttrs: {
        type: 'number'
      },
      type: 'input'
    });

    if (isNaN(percentage)) {
      console.error("Invalid percentage value provided");
      return;
    }

    for (let dirPath of directoryPaths) {
      fs.readdir(dirPath, (err, files) => {
        if (err) {
          console.error('Unable to scan directory: ' + err);
          return;
        }

        files.forEach(async (file) => {
          if (path.extname(file).toLowerCase() === '.webp') {
            const filePath = path.join(dirPath, file);

            const oldFilePath = path.join(dirPath, 'old_' + file);
            fs.renameSync(filePath, oldFilePath);

            const imageMetadata = await sharp(oldFilePath).metadata();

            await sharp(oldFilePath)
              .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
              .toFormat('webp')
              .toFile(filePath);
          }
        });
      });
    }
  } catch (error) {
    console.error("Error resizing webp images:", error);
  }
}

async function selectAndResizeSingleImage() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }]
  });

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the image to:',
    value: '75',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  });

  if (isNaN(percentage)) {
    console.error("Invalid percentage value provided");
    return;
  }

  for (let filePath of filePaths) {
    const imageMetadata = await sharp(filePath).metadata();
    const outputPath = path.join(path.dirname(filePath), 'big_' + path.basename(filePath));

    fs.renameSync(filePath, outputPath);

    await sharp(outputPath)
      .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
      .toFormat('jpeg')
      .toFile(filePath);
  }
}

async function selectAndMakeImageSquare700() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    makeImageSquareAndResize(filePath);
  }
}

async function makeImageSquareAndResize(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const size = Math.min(metadata.width, metadata.height);
    const targetSize = 700;
    let extractSize = size;

    if (size > targetSize) {
      extractSize = targetSize;
    }

    const outputPath = path.join(path.dirname(filePath), `square_700_${path.basename(filePath)}`);

    let image = sharp(filePath)
      .extract({ width: size, height: size, left: (metadata.width - size) / 2, top: (metadata.height - size) / 2 });

    if (size > targetSize) {
      image = image.resize(targetSize, targetSize);
    }

    await image.toFormat('webp').toFile(outputPath);

    console.log(`700x700 square image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making 700x700 square image:', error);
  }
}

ipcMain.on('make-image-square-700', (event) => {
  selectAndMakeImageSquare700();
});

ipcMain.on('make-image-square', (event) => {
  console.log('Received make-image-square event');
  selectAndMakeImageSquare();
});

ipcMain.on('create-favicon', (event) => {
  selectAndCreateFavicon();
});

ipcMain.on('resize-large-images', (event) => {
  selectAndResizeLargeImages();
});

ipcMain.on('convert-image-to-png', (event) => {
  selectAndConvertImageToPNG();
});

ipcMain.on('convert-all-images-to-png', (event) => {
  selectAndConvertAllImagesToPNG();
});

ipcMain.on('resize-images-over-1200px', (event) => {
  selectAndResizeImagesOver1200px();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
