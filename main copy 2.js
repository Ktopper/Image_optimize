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
    console.error("Error process image:", error);
  }
}
async function makeImageSixteenNine(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width;
    const height = metadata.height;
    
    // Calculate the target dimensions for 16:9
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

async function selectAndResizeImages() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the images to:',
    value: '50',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  });

  if (isNaN(percentage)) {
    // TODO: Handle invalid input
    return;
  }

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        // TODO: Handle error
        console.log('Unable to scan directory: ' + err);
        return;
      }

      files.forEach(async (file) => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          const imageMetadata = await sharp(filePath).metadata();

          const outputPath = path.join(dirPath, 'big_' + file);
          fs.renameSync(filePath, outputPath);

          await sharp(outputPath)
            .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
            .toFormat('jpeg')
            .toFile(filePath);
        }
      });
    });
  }
}

async function selectAndMakeImageSquare() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0]; // Assuming single selection
    makeImageSquare(filePath);
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
        left: (metadata.width - size) / 2,
        top: (metadata.height - size) / 2,
      })
      .toFile(outputPath);

    console.log(`Square image created at ${outputPath}`);
  } catch (error) {
    console.error('Error making image square:', error);
  }
}

// Favicon
async function selectAndCreateFavicon() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    createFavicon(filePath);
  }
}

async function createFavicon(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    const size = Math.min(metadata.width, metadata.height);
    const targetSize = 50;

    const outputPath = path.join(path.dirname(filePath), `favicon_${path.basename(filePath, path.extname(filePath))}.png`);

    await sharp(filePath)
      .extract({ width: size, height: size, left: (metadata.width - size) / 2, top: (metadata.height - size) / 2 })
      .resize(targetSize, targetSize)
      .toFormat('png')
      .toFile(outputPath);

    console.log(`Favicon created at ${outputPath}`);
  } catch (error) {
    console.error('Error creating favicon:', error);
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
    // TODO: Handle invalid input
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

async function selectAndResizeLargeImages() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  const percentage = await prompt({
    title: 'Enter percentage',
    label: 'Enter the percentage (in %) to resize the images to:',
    value: '75',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  });

  const sizeThreshold = await prompt({
    title: 'Enter size threshold',
    label: 'Enter the file size threshold (in KB) to resize images above:',
    value: '200',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  });

  const dimensionThreshold = await prompt({
    title: 'Enter dimension threshold',
    label: 'Enter the dimension threshold (in px) to resize images above:',
    value: '800',
    inputAttrs: {
      type: 'number'
    },
    type: 'input'
  });

  if (isNaN(percentage) || isNaN(sizeThreshold) || isNaN(dimensionThreshold)) {
    // TODO: Handle invalid input
    return;
  }

  const sizeThresholdInBytes = sizeThreshold * 1024;

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        // TODO: Handle error
        console.log('Unable to scan directory: ' + err);
        return;
      }

      files.forEach(async (file) => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);

          const imageMetadata = await sharp(filePath).metadata();

          if(stats.size > sizeThresholdInBytes && (imageMetadata.width > dimensionThreshold || imageMetadata.height > dimensionThreshold)) {
            const outputPath = path.join(dirPath, 'big_' + file);
            fs.renameSync(filePath, outputPath);

            await sharp(outputPath)
              .resize({ width: Math.round(imageMetadata.width * percentage / 100) })
              .toFormat('jpeg')
              .toFile(filePath);
          }
        }
      });
    });
  }
}

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

async function selectAndConvertImageToPNG() {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'gif', 'webp'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    const outputPath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.png');
    await processImage(filePath, outputPath, 100, 'png');
  }
}
ipcMain.on('convert-single-image-to-webp', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] }]
  });

  if (filePaths && filePaths.length > 0) {
    const filePath = filePaths[0];
    const outputPath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.webp');
    await convertToWebPWithCompression(filePath, outputPath);
  }
});

async function selectAndConvertAllImagesToPNG() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  if (directoryPaths && directoryPaths.length > 0) {
    const dirPath = directoryPaths[0];
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
      }

      files.forEach(async (file) => {
        if (['.jpg', '.jpeg', '.gif', '.webp'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          const outputPath = path.join(dirPath, path.basename(file, path.extname(file)) + '.png');
          await processImage(filePath, outputPath, 100, 'png');
        }
      });
    });
  }
}

async function selectAndResizeImagesOver1200px() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
      }

      files.forEach(async (file) => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          try {
            const imageMetadata = await sharp(filePath).metadata();

            if (imageMetadata.width > 1200 || imageMetadata.height > 800) {
              const tempFilePath = path.join(dirPath, 'temp_' + file);

              // Rename the original file to a temporary file
              fs.renameSync(filePath, tempFilePath);

              // Resize the image and save it back to the original file name
              let resizeOptions = {};
              if (imageMetadata.width > 1200) {
                resizeOptions.width = 1200;
              }
              if (imageMetadata.height > 800) {
                resizeOptions.height = 800;
              }

              await sharp(tempFilePath)
                .resize(resizeOptions)
                .toFile(filePath);

              // Remove the temporary file
              fs.unlinkSync(tempFilePath);
            }
          } catch (error) {
            console.error('Error processing image:', error);
          }
        }
      });
    });
  }
}
async function optimizeImagesInFolder() {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
      }

      files.forEach(async (file) => {
        const ext = path.extname(file).toLowerCase();
        if (['.png', '.webp'].includes(ext)) {
          const filePath = path.join(dirPath, file);
          const tempFilePath = path.join(dirPath, 'temp_' + file);

          // Rename the original file to a temporary file
          fs.renameSync(filePath, tempFilePath);

          try {
            const options = {};
            if (ext === '.png') {
              options.compressionLevel = 9; // Maximum compression for PNG
            } else if (ext === '.webp') {
              options.quality = 80; // Adjust quality for WebP
            }

            // Optimize the image and save it back to the original file name
            await sharp(tempFilePath)
              .toFormat(ext === '.png' ? 'png' : 'webp', options)
              .toFile(filePath);

            // Remove the temporary file
            fs.unlinkSync(tempFilePath);
          } catch (error) {
            console.error('Error optimizing image:', error);
            // If an error occurs, restore the original file
            fs.renameSync(tempFilePath, filePath);
          }
        }
      });
    });
  }
}

ipcMain.on('optimize-images', (event) => {
  optimizeImagesInFolder();
});

ipcMain.on('make-image-sixteen-nine', (event) => {
  selectAndMakeImageSixteenNine();
});

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

ipcMain.on('resize-webp-images', (event) => {
  resizeWebpImages();
});

ipcMain.on('resize-single-image', (event) => {
  selectAndResizeSingleImage();
});

ipcMain.on('resize-all-images', (event) => {
  selectAndResizeImages();
});

ipcMain.on('resize-large-images', (event) => {
  selectAndResizeLargeImages();
});

ipcMain.on('convert-single-image-to-webp', async (event) => {
  const { filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif'] }],
  });

  filePaths.forEach(async filePath => {
    const outputPath = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)) + '.webp');
    await processImage(filePath, outputPath, 100, 'webp');
  });
});

ipcMain.on('convert-all-images-to-webp', async (event) => {
  const { filePaths: directoryPaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  for (let dirPath of directoryPaths) {
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.log('Unable to scan directory: ' + err);
        return;
      }
      
      files.forEach(async file => {
        if (['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase())) {
          const filePath = path.join(dirPath, file);
          const outputPath = path.join(dirPath, path.basename(file, path.extname(file)) + '.webp');
          await processImage(filePath, outputPath, 100, 'webp');
        }
      });
    });
  }
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
